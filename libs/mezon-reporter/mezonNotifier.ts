import { MEZON_THREAD_URL } from 'libs/mezon-reporter/constant';

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
  totalDuration?: number;
  failedTests?: Array<{
    title: string;
    file: string;
    error: string;
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
    // console.log('[Mezon] Attempting to send notification:', message);

    if (!this.isEnabled) {
      return;
    }

    try {
      const githubInfo = this.getGitHubInfo();
      const { ReportExporter } = await import('./reportExporter');
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

      // Check if this is a simple start message or if all tests passed (simple success message)
      const isStartMessage = message.includes('started') || message.includes('🚀');
      const isAllTestsPassed =
        message.includes('Successfully') &&
        enrichedPayload.failed === 0 &&
        enrichedPayload.passed &&
        enrichedPayload.passed > 0;

      const isSimpleMessage = isStartMessage || isAllTestsPassed;
      const messageToSend = isSimpleMessage
        ? this.formatSimpleMessage(message, enrichedPayload)
        : this.formatDetailedMessage(message, enrichedPayload);

      const body = this.createMezonWebhookPayload(messageToSend);

      // console.log(`[Mezon] Sending ${isSimpleMessage ? 'simple' : 'detailed'} notification...`);
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
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // For start messages
    if (message.includes('started') || message.includes('🚀')) {
      let simpleMessage = `${message}\n`;
      simpleMessage += `⏰ ${timestamp} (GMT+7)\n`;

      if (payload.totalTests !== undefined) {
        simpleMessage += `📊 Total Tests: ${payload.totalTests}\n`;
      }

      simpleMessage += `🌍 Environment: ${payload.environment || 'development'}\n`;

      // Add GitHub info for start messages
      if (payload.branch) {
        simpleMessage += `🌿 Branch: ${payload.branch}\n`;
      }
      if (payload.actor) {
        simpleMessage += `👤 Actor: ${payload.actor}\n`;
      }
      if (payload.commitSha) {
        simpleMessage += `📝 Commit: ${payload.commitSha}\n`;
      }

      return simpleMessage;
    }

    // For success messages (all tests passed)
    if (message.includes('Successfully')) {
      const passed = payload.passed || 0;
      const total = payload.totalTests || passed;
      const duration = payload.totalDuration ? this.formatDuration(payload.totalDuration) : 'N/A';

      let successMessage = `✅ All tests passed! ${passed}/${total} tests completed successfully in ${duration} ⏰ ${timestamp} (GMT+7)`;

      // Add GitHub links for success messages
      const links = this.formatGitHubLinks(payload);
      if (links) {
        successMessage += `\n\n${links}`;
      }

      if (payload.reportUrl) {
        successMessage += `\n📊 [View Test Report] ${payload.reportUrl}`;
      }

      return successMessage;
    }

    return `${message} ⏰ ${timestamp} (GMT+7)`;
  }

  private formatDetailedMessage(message: string, payload: NotificationPayload): string {
    let detailedMessage = `${message}\n\n`;

    if (payload.error) {
      detailedMessage += `❌ **ERROR DETAILS**\n`;
      detailedMessage += `🔍 Error: ${this.truncateText(payload.error, 300)}\n\n`;
    }

    if (payload.failedTests && payload.failedTests.length > 0) {
      detailedMessage += `🚨 **FAILED TESTS DETAILS**\n`;
      payload.failedTests.forEach((failedTest, index) => {
        detailedMessage += `\n${index + 1}. **${failedTest.title}**\n`;
        detailedMessage += `   📁 File: ${this.getFileName(failedTest.file)}\n`;
        detailedMessage += `   ⏱️ Duration: ${this.formatDuration(failedTest.duration)}\n`;
        detailedMessage += `   ❌ Error: ${this.truncateText(failedTest.error, 200)}\n`;
      });
      detailedMessage += `\n`;
    }

    // Add GitHub links for detailed messages
    const links = this.formatGitHubLinks(payload);
    if (links) {
      detailedMessage += `\n${links}`;
    }
    if (payload.reportUrl) {
      detailedMessage += `\n📊 [View Test Report] ${payload.reportUrl}`;
    }

    return detailedMessage;
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

  private getFileName(filePath: string): string {
    return filePath.split('/').pop() || filePath;
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

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  private getGitHubInfo(): Partial<NotificationPayload> {
    const githubInfo: Partial<NotificationPayload> = {};

    // Extract GitHub environment variables
    const repoFullName = process.env.GITHUB_REPOSITORY; // e.g., "owner/repo"
    const runId = process.env.GITHUB_RUN_ID;
    const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
    const sha = process.env.GITHUB_SHA;
    const ref = process.env.GITHUB_REF;
    const actor = process.env.GITHUB_ACTOR;
    const eventName = process.env.GITHUB_EVENT_NAME;

    // Set basic info
    if (sha) githubInfo.commitSha = sha.substring(0, 7); // Short SHA
    if (actor) githubInfo.actor = actor;

    // Extract branch name from ref
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

    // Build GitHub Action run URL
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

    // Alternative: try to get PR URL from event payload
    if (!githubInfo.prUrl && process.env.GITHUB_EVENT_PATH) {
      try {
        const fs = require('fs');
        const eventPayload = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
        if (eventPayload.pull_request?.html_url) {
          githubInfo.prUrl = eventPayload.pull_request.html_url;
        }
      } catch {
        // Ignore errors reading event payload
        // console.log('[Mezon] Could not read GitHub event payload');
      }
    }

    return githubInfo;
  }
}
