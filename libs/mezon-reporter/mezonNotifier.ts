import { MEZON_THREAD_URL } from 'libs/mezon-reporter/constant';
import { ReportExporter } from './reportExporter';

interface MezonWebhookPayload {
  type: string;
  message: {
    t: string;
    mentions?: Array<{
      user_id: string;
      s: number;
      e: number;
    }>;
  };
}

export interface NotificationPayload {
  totalTests?: number;
  environment?: string;
  error?: string;
  passed?: number;
  failed?: number;
  flaky?: number;
  totalDuration?: number;
  failedTests?: Array<{
    title: string;
    file: string;
    error: string;
    duration: number;
  }>;
  flakyTests?: Array<{
    title: string;
    file: string;
    retryCount: number;
    finalStatus: string;
    duration: number;
  }>;
  prUrl?: string;
  actionUrl?: string;
  commitSha?: string;
  branch?: string;
  actor?: string;
  reportUrl?: string;
}

export class MezonNotifier {
  private webhookUrl?: string;
  private isEnabled: boolean;
  private mentionUserId?: string;

  constructor() {
    this.webhookUrl = process.env.MEZON_WEBHOOK_URL || MEZON_THREAD_URL;
    this.isEnabled = process.env.MEZON_NOTIFICATIONS !== 'false' && !!this.webhookUrl;
  }

  async send(message: string, payload?: NotificationPayload): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      const githubInfo = this.getGitHubInfo();
      const reportExporter = new ReportExporter();
      const exportResult = await reportExporter.exportPlaywrightReport();
      const enrichedPayload = {
        ...payload,
        ...githubInfo,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        project: 'Mezon E2E Tests',
        reportUrl: exportResult?.reportUrl,
      };

      const messageToSend = this.formatSimpleMessage(message, enrichedPayload);
      const body = this.createMezonWebhookPayload(messageToSend);

      if (this.webhookUrl) {
        await fetch(this.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      }
    } catch (error) {
      console.warn('[Mezon] Error sending notification:', error);
    }
  }

  private formatSimpleMessage(message: string, payload: NotificationPayload): string {
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const passed = payload.passed || 0;
    const failed = payload.failed || 0;
    const flaky = payload.flaky || 0;
    const total = payload.totalTests || passed + failed + flaky;
    const duration = payload.totalDuration ? this.formatDuration(payload.totalDuration) : 'N/A';

    let formattedMessage = `${message}\n`;

    // Test results summary (always show)
    if (total > 0) {
      formattedMessage += `📊 ${passed}✅ ${failed}❌ ${flaky}🔄 / ${total} tests`;
      if (duration !== 'N/A') {
        formattedMessage += ` in ${duration}`;
      }
      formattedMessage += `\n`;
    }

    // Git info (compact)
    if (payload.branch || payload.actor || payload.commitSha) {
      const gitInfo = [];
      if (payload.branch) gitInfo.push(`🌿${payload.branch}`);
      if (payload.actor) gitInfo.push(`👤${payload.actor}`);
      if (payload.commitSha) gitInfo.push(`📝${payload.commitSha}`);
      formattedMessage += `${gitInfo.join(' ')} | `;
    }

    // Environment and timestamp
    formattedMessage += `🌍${payload.environment || 'dev'} | ⏰${timestamp}`;

    // Links (compact)
    const links = this.formatGitHubLinks(payload);
    if (links) {
      formattedMessage += `\n${links}`;
    }

    if (payload.reportUrl) {
      formattedMessage += `\n📊 [Report](${payload.reportUrl})`;
    }

    return formattedMessage;
  }

  private createMezonWebhookPayload(message: string): MezonWebhookPayload {
    const payload: MezonWebhookPayload = {
      type: 'hook',
      message: {
        t: message,
      },
    };

    if (this.mentionUserId) {
      const mentionText = `\n\n@mezon.bot`;
      const fullMessage = `${message}${mentionText}`;

      payload.message.t = fullMessage;
      payload.message.mentions = [
        {
          user_id: this.mentionUserId,
          s: fullMessage.length - mentionText.length + 2, // +2 for \n\n
          e: fullMessage.length,
        },
      ];
    }

    return payload;
  }

  private formatDuration(duration: number): string {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${(duration / 1000).toFixed(2)}s`;
    }
  }

  private formatGitHubLinks(payload: NotificationPayload): string {
    const links: string[] = [];

    if (payload.prUrl) {
      links.push(`🔗 [View Pull Request](${payload.prUrl})`);
    }

    if (payload.actionUrl) {
      links.push(`⚡ [GitHub Action Run](${payload.actionUrl})`);
    }

    return links.length > 0 ? links.join('\n') : '';
  }

  private getGitHubInfo(): Partial<NotificationPayload> {
    const githubInfo: Partial<NotificationPayload> = {};
    const repoFullName = process.env.GITHUB_REPOSITORY;
    const runId = process.env.GITHUB_RUN_ID;
    const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
    const sha = process.env.GITHUB_SHA;
    const ref = process.env.GITHUB_REF;
    const actor = process.env.GITHUB_ACTOR;
    const eventName = process.env.GITHUB_EVENT_NAME;

    if (sha) githubInfo.commitSha = sha.substring(0, 7);
    if (actor) githubInfo.actor = actor;

    if (ref) {
      if (ref.startsWith('refs/heads/')) {
        githubInfo.branch = ref.replace('refs/heads/', '');
      } else if (ref.startsWith('refs/pull/')) {
        // For PR events, extract PR number
        const prNumber = ref.match(/refs\/pull\/(\d+)\/merge/)?.[1];
        if (prNumber) {
          githubInfo.branch = `PR #${prNumber}`;
        }
      }
    }

    if (repoFullName && runId) {
      githubInfo.actionUrl = `${serverUrl}/${repoFullName}/actions/runs/${runId}`;
    }

    // Build PR URL for pull request events
    if (eventName === 'pull_request' && repoFullName) {
      const prNumber =
        process.env.GITHUB_REF?.match(/refs\/pull\/(\d+)\/merge/)?.[1] ||
        process.env.GITHUB_HEAD_REF;
      if (prNumber) {
        githubInfo.prUrl = `${serverUrl}/${repoFullName}/pull/${prNumber}`;
      }
    }

    if (!githubInfo.prUrl && process.env.GITHUB_EVENT_PATH) {
      try {
        const fs = require('fs');
        const eventPayload = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
        if (eventPayload.pull_request?.html_url) {
          githubInfo.prUrl = eventPayload.pull_request.html_url;
        }
      } catch {}
    }

    return githubInfo;
  }
}
