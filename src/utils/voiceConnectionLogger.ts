import { Page } from '@playwright/test';

type LogLevel = 'verbose' | 'normal' | 'minimal';

/**
 * Monitors WebSocket and WebRTC connection status during voice channel operations
 * Logs connection state, ICE candidates, and network information
 *
 * Verbosity Levels:
 * - 'verbose': All frame sends/receives + all console messages (LOCAL DEV)
 * - 'normal': Key events + connection state changes (CI/GITHUB)
 * - 'minimal': Only errors and connection failures (PRODUCTION)
 */
export class VoiceConnectionLogger {
  private page: Page;
  private wsConnected = false;
  private rtcConnected = false;
  private logs: string[] = [];
  private logLevel: LogLevel;

  constructor(page: Page, logLevel: LogLevel = process.env.CI ? 'normal' : 'verbose') {
    this.page = page;
    this.logLevel = logLevel;
    console.log(`📊 Voice Logger Level: ${this.logLevel.toUpperCase()}`);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = { verbose: 3, normal: 2, minimal: 1 };
    return levels[level] >= levels[this.logLevel];
  }

  /**
   * Start monitoring browser console for voice/WebSocket/WebRTC logs
   */
  async startMonitoring() {
    console.log('🔊 Starting Voice Connection monitoring...');

    // These globals are installed before every document navigation.  The app does
    // not expose __WS_CONNECTION__ / __RTC_CONNECTION__, so reading those values
    // reports a false "disconnected" state even when voice is healthy.
    await this.page.addInitScript(() => {
      const win = window as any;
      if (win.__voiceConnectionInstrumentationInstalled) return;
      win.__voiceConnectionInstrumentationInstalled = true;

      const state = (win.__voiceConnectionState = {
        sockets: [] as Array<{ url: string; readyState: number; closedAt?: string }>,
        peers: [] as Array<{
          connectionState: string;
          iceConnectionState: string;
          iceGatheringState: string;
          iceServers: string[];
          candidateErrors: Array<{ url: string; errorCode: number; errorText: string }>;
        }>,
      });

      const NativeWebSocket = win.WebSocket;
      function TrackedWebSocket(this: WebSocket, ...args: ConstructorParameters<typeof WebSocket>) {
        const socket = new NativeWebSocket(...args);
        const trackedSocket: { url: string; readyState: number; closedAt?: string } = {
          url: socket.url,
          readyState: socket.readyState,
        };
        state.sockets.push(trackedSocket);
        const updateState = () => {
          trackedSocket.readyState = socket.readyState;
        };
        socket.addEventListener('open', updateState);
        socket.addEventListener('close', () => {
          updateState();
          trackedSocket.closedAt = new Date().toISOString();
        });
        socket.addEventListener('error', updateState);
        return socket;
      }
      TrackedWebSocket.prototype = NativeWebSocket.prototype;
      Object.setPrototypeOf(TrackedWebSocket, NativeWebSocket);
      win.WebSocket = TrackedWebSocket;

      const NativePeerConnection = win.RTCPeerConnection;
      if (!NativePeerConnection) return;
      function TrackedPeerConnection(this: RTCPeerConnection, configuration?: RTCConfiguration) {
        const peer = new NativePeerConnection(configuration);
        const iceServers = (configuration?.iceServers || []).flatMap(server => {
          const urls = typeof server.urls === 'string' ? [server.urls] : server.urls || [];
          return urls.map(String);
        });
        const trackedPeer = {
          connectionState: peer.connectionState,
          iceConnectionState: peer.iceConnectionState,
          iceGatheringState: peer.iceGatheringState,
          iceServers,
          candidateErrors: [] as Array<{ url: string; errorCode: number; errorText: string }>,
        };
        state.peers.push(trackedPeer);
        const updateState = () => {
          trackedPeer.connectionState = peer.connectionState;
          trackedPeer.iceConnectionState = peer.iceConnectionState;
          trackedPeer.iceGatheringState = peer.iceGatheringState;
        };
        peer.addEventListener('connectionstatechange', updateState);
        peer.addEventListener('iceconnectionstatechange', updateState);
        peer.addEventListener('icegatheringstatechange', updateState);
        peer.addEventListener('icecandidateerror', (event: RTCPeerConnectionIceErrorEvent) => {
          trackedPeer.candidateErrors.push({
            url: event.url,
            errorCode: event.errorCode,
            errorText: event.errorText,
          });
        });
        return peer;
      }
      TrackedPeerConnection.prototype = NativePeerConnection.prototype;
      Object.setPrototypeOf(TrackedPeerConnection, NativePeerConnection);
      win.RTCPeerConnection = TrackedPeerConnection;
    });

    // Capture browser console messages
    this.page.on('console', msg => {
      const logMessage = `[${msg.type().toUpperCase()}] ${msg.text()}`;

      // Only log console messages in verbose mode
      if (this.shouldLog('verbose')) {
        console.log(logMessage);
      }
      this.logs.push(logMessage);
    });

    // Monitor network WebSocket connections
    this.page.on('websocket', ws => {
      if (this.shouldLog('normal')) {
        console.log(`📨 WebSocket created: ${ws.url}`);
      }
      this.wsConnected = true;
      this.logs.push(`WebSocket URL: ${ws.url}`);

      ws.on('framesent', event => {
        // Only log frames in verbose mode (very noisy)
        if (this.shouldLog('verbose')) {
          console.log(`📤 WS Frame Sent: ${event.payload}`);
        }
      });

      ws.on('framereceived', event => {
        // Only log frames in verbose mode (very noisy)
        if (this.shouldLog('verbose')) {
          console.log(`📥 WS Frame Received: ${event.payload.slice(0, 100)}...`);
        }
      });

      ws.on('close', () => {
        // Always log critical events
        console.log(`❌ WebSocket closed: ${ws.url}`);
        // A page can have several sockets. The browser-side snapshot below is
        // the authoritative status; do not mark every socket close as a voice failure.
      });
    });
  }

  /**
   * Check current connection status
   */
  async checkConnectionStatus() {
    try {
      const snapshot = await this.page.evaluate(
        () => (window as any).__voiceConnectionState || null
      );
      const sockets = snapshot?.sockets || [];
      const peers = snapshot?.peers || [];
      const openSockets = sockets.filter(
        (socket: { readyState: number }) => socket.readyState === 1
      );
      const connectedPeers = peers.filter(
        (peer: { connectionState: string }) => peer.connectionState === 'connected'
      );
      const wsStatus = `WebSocket: ${openSockets.length}/${sockets.length} OPEN`;
      const rtcStatus = peers.length
        ? `RTC: ${peers.map((peer: { connectionState: string }) => peer.connectionState).join(', ')}`
        : 'RTC: no peer created';
      const iceStatus = peers.length
        ? `ICE: ${peers.map((peer: { iceConnectionState: string }) => peer.iceConnectionState).join(', ')}`
        : 'ICE: no peer created';
      this.wsConnected = openSockets.length > 0;
      this.rtcConnected = connectedPeers.length > 0;

      // Always log status checks (important for debugging)
      console.log(`
        🔊 Voice Connection Status:
        ${wsStatus}
        ${rtcStatus}
        ${iceStatus}
      `);

      return { wsStatus, rtcStatus, iceStatus, sockets, peers };
    } catch (error) {
      console.error('Failed to check connection status:', error);
      return null;
    }
  }

  /**
   * Log environment info (URL, SFU config, etc)
   */
  async logEnvironmentInfo() {
    const envInfo = await this.page.evaluate(() => {
      return {
        baseURL: window.location.href,
        sfuWsUrl: (window as any).NX_CHAT_APP_SFU_WS_URL || 'Not set',
        userAgent: navigator.userAgent,
        protocol: window.location.protocol,
      };
    });

    console.log(`
      🌐 Environment Info:
      Base URL: ${envInfo.baseURL}
      SFU WS URL: ${envInfo.sfuWsUrl}
      Protocol: ${envInfo.protocol}
      User Agent: ${envInfo.userAgent}
    `);

    this.logs.push(JSON.stringify(envInfo, null, 2));
    return envInfo;
  }

  /**
   * Get all collected logs
   */
  getLogs(): string[] {
    return this.logs;
  }

  /**
   * Print all collected logs (optimized for CI/GitHub Actions)
   */
  printLogs() {
    if (this.logLevel === 'minimal') {
      // Minimal: Only print critical info
      console.log('\n📋 Voice Connection Log Summary:');
      console.log(`   WS Status: ${this.wsConnected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`   RTC Status: ${this.rtcConnected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`   Total Events: ${this.logs.length}`);
      return;
    }

    if (this.logLevel === 'normal') {
      // Normal: Print summary + errors/warnings
      console.log('\n📋 Voice Connection Log Summary (CI Mode):');
      console.log(`   Captured Events: ${this.logs.length}`);
      console.log(`   WS Status: ${this.wsConnected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`   RTC Status: ${this.rtcConnected ? '✅ Connected' : '❌ Disconnected'}`);

      // Print only critical logs (errors, warnings)
      const criticalLogs = this.logs.filter(
        log =>
          log.includes('ERROR') ||
          log.includes('FAILED') ||
          log.includes('❌') ||
          log.includes('closed') ||
          log.includes('disconnected')
      );

      if (criticalLogs.length > 0) {
        console.log('\n   ⚠️  Critical Events:');
        criticalLogs.forEach((log, i) => {
          console.log(`      ${i + 1}. ${log}`);
        });
      } else {
        console.log('   ✅ No critical events');
      }
      return;
    }

    // Verbose: Print all logs (local development)
    console.log('\n📋 All Voice Connection Logs (VERBOSE):');
    this.logs.forEach((log, i) => {
      console.log(`  ${i + 1}. ${log}`);
    });
  }
}
