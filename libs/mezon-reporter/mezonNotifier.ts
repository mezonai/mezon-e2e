import * as fs from 'fs';
import { MEZON_THREAD_URL } from './constant';
import { ReportExporter } from './reportExporter';

interface ChannelWebhookPayload {
  type: string;
  message: {
    t: string;
  };
}

export interface NotificationPayload {
  totalTests?: number;
  environment?: string;
  error?: string;
  passed?: number;
  failed?: number;
  skipped?: number;
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
  jobName?: string;
  status?: string;
  notRanTests?: number;
}

export class MezonNotifier {
  private initialWebhookUrl?: string;

  constructor(webhookUrl?: string) {
    this.initialWebhookUrl = webhookUrl;
  }

  private getWebhookUrl(targetWebhookUrl?: string): string | undefined {
    return (
      targetWebhookUrl ||
      this.initialWebhookUrl ||
      process.env.MEZON_WEBHOOK_URL ||
      MEZON_THREAD_URL
    );
  }

  private isNotificationEnabled(url?: string): boolean {
    return process.env.MEZON_NOTIFICATIONS !== 'false' && !!url;
  }

  async send(
    message: string,
    payload?: NotificationPayload & { skipReport?: boolean },
    targetWebhookUrl?: string
  ): Promise<void> {
    const url = this.getWebhookUrl(targetWebhookUrl);
    if (!this.isNotificationEnabled(url) || !url) {
      return;
    }

    try {
      const githubInfo = this.getGitHubInfo();
      const shouldExportReport =
        !payload?.skipReport && !payload?.reportUrl && process.env.UPLOAD_REPORT === 'true';

      const exportResult = shouldExportReport
        ? await new ReportExporter().exportPlaywrightReport()
        : null;

      const enrichedPayload: NotificationPayload = {
        ...payload,
        ...githubInfo,
        environment: payload?.environment || process.env.NODE_ENV || 'development',
        reportUrl: payload?.reportUrl || exportResult?.reportUrl,
      };

      const messageToSend = this.formatSimpleMessage(message, enrichedPayload);
      const body = this.createMezonWebhookPayload(messageToSend);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.warn(
          `[Mezon] Notification fetch returned status: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.warn('[Mezon] Error sending notification:', error);
    }
  }

  async sendCronStart(jobName?: string, payload?: NotificationPayload): Promise<void> {
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const githubInfo = this.getGitHubInfo();
    const name = jobName || payload?.jobName || 'Mezon E2E Automation Cronjob';
    const envName = payload?.environment || process.env.NODE_ENV || 'development';

    let message = `🚀 [CRONJOB STARTED] ${name}\n`;
    message += `🌍 ${envName} | ⏰ ${timestamp}`;

    if (githubInfo.branch || githubInfo.actor) {
      const gitParts: string[] = [];
      if (githubInfo.branch) gitParts.push(`🌿 ${githubInfo.branch}`);
      if (githubInfo.actor) gitParts.push(`👤 ${githubInfo.actor}`);
      message += `\n${gitParts.join(' | ')}`;
    }

    await this.send(message, { ...payload, skipReport: true });
  }

  async sendCronEnd(message: string, payload?: NotificationPayload): Promise<void> {
    await this.send(message, payload);
  }

  async sendInterrupted(payload?: NotificationPayload): Promise<void> {
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const passed = payload?.passed || 0;
    const failed = payload?.failed || 0;
    const flaky = payload?.flaky || 0;
    const total = payload?.totalTests || 0;
    const notRan = payload?.notRanTests || 0;
    const duration = payload?.totalDuration ? this.formatDuration(payload.totalDuration) : 'N/A';
    const envName = payload?.environment || process.env.NODE_ENV || 'development';
    const githubInfo = this.getGitHubInfo();

    let message = `⛔ Test Suite Interrupted / Cancelled\n`;
    message += `📊 ${passed}✅ ${failed}❌ ${flaky}🔄 / ${total} tests`;
    if (duration !== 'N/A') {
      message += ` in ${duration}`;
    }
    message += `\n`;
    if (notRan > 0) {
      message += `⏭️ ${notRan} tests did not run\n`;
    }

    const gitParts: string[] = [];
    const branch = githubInfo.branch || payload?.branch;
    const actor = githubInfo.actor || payload?.actor;
    const commitSha = githubInfo.commitSha || payload?.commitSha;
    if (branch) gitParts.push(`🌿${branch}`);
    if (actor) gitParts.push(`👤${actor}`);
    if (commitSha) gitParts.push(`📝${commitSha}`);
    if (gitParts.length > 0) {
      message += `${gitParts.join(' ')} | `;
    }
    message += `🌍${envName} | ⏰${timestamp}`;

    await this.send(message, { ...payload, skipReport: true });
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
    const total = payload.totalTests || (passed + failed + flaky > 0 ? passed + failed + flaky : 0);
    const duration = payload.totalDuration ? this.formatDuration(payload.totalDuration) : 'N/A';

    let formattedMessage = `${message}\n`;

    // Test results summary
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

  private createMezonWebhookPayload(message: string): ChannelWebhookPayload {
    return {
      type: 'hook',
      message: {
        t: message,
      },
    };
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
        const eventPayload = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
        if (eventPayload.pull_request?.html_url) {
          githubInfo.prUrl = eventPayload.pull_request.html_url;
        }
      } catch {}
    }

    return githubInfo;
  }
}
