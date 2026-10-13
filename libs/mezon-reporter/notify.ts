import * as fs from 'fs';
import * as path from 'path';
import { MezonNotifier, NotificationPayload } from './mezonNotifier';

const action = process.argv[2] || 'start'; // 'start' | 'end'
const runPhase = process.env.RUN_PHASE || 'manual'; // 'web' | 'multi' | 'manual'
const eventName = process.env.EVENT_NAME || process.env.GITHUB_EVENT_NAME || 'workflow_dispatch';
const branch =
  process.env.BRANCH || process.env.SELECTED_REF || process.env.GITHUB_REF_NAME || 'main';
const actor = process.env.ACTOR || process.env.GITHUB_ACTOR || '';
const commitSha =
  process.env.COMMIT_SHA || (process.env.GITHUB_SHA ? process.env.GITHUB_SHA.substring(0, 7) : '');
const envName = process.env.NODE_ENV || 'production';
const vercelReportUrl = process.env.VERCEL_REPORT_URL || process.env.REPORT_URL || '';
const allureRoot = process.env.ALLURE_VERCEL_ROOT || '/home/nccsoft/allure-vercel-reports';
const reportRelativePath = process.env.REPORT_RELATIVE_PATH || '';
const reportDeployOutcome = process.env.REPORT_DEPLOY_OUTCOME || 'success';
const isUiStressRun = process.env.RUN_UI_STRESS === 'true';
const stressHistoryMessageCount = process.env.STRESS_HISTORY_MESSAGE_COUNT || '120';
const stressMode = process.env.UI_STRESS_MODE || 'soak';

const collectAttachments = (value: unknown, attachments: unknown[] = []): unknown[] => {
  if (Array.isArray(value)) {
    for (const item of value) collectAttachments(item, attachments);
    return attachments;
  }
  if (!value || typeof value !== 'object') return attachments;
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.attachments)) attachments.push(...record.attachments);
  for (const [key, nestedValue] of Object.entries(record)) {
    if (key !== 'attachments') collectAttachments(nestedValue, attachments);
  }
  return attachments;
};

const formatMetric = (value: unknown, suffix = ''): string => {
  const numericValue = typeof value === 'number' ? value : Number.NaN;
  return Number.isFinite(numericValue)
    ? `${numericValue.toFixed(1).replace(/\.0$/, '')}${suffix}`
    : 'N/A';
};

const readUiStressMetricSummary = (reportDirectory: string): string[] => {
  const testCasesDirectory = path.join(reportDirectory, 'data', 'test-cases');
  const attachmentsDirectory = path.join(reportDirectory, 'data', 'attachments');
  if (!fs.existsSync(testCasesDirectory) || !fs.existsSync(attachmentsDirectory)) return [];

  const payloads = new Map<string, Record<string, unknown>>();
  for (const fileName of fs.readdirSync(testCasesDirectory)) {
    if (!fileName.endsWith('.json')) continue;
    try {
      const testCase = JSON.parse(fs.readFileSync(path.join(testCasesDirectory, fileName), 'utf8'));
      for (const value of collectAttachments(testCase)) {
        const attachment = value as { name?: string; source?: string; type?: string };
        if (
          attachment.type !== 'application/json' ||
          !attachment.name ||
          !attachment.source ||
          path.basename(attachment.source) !== attachment.source
        ) {
          continue;
        }
        const attachmentPath = path.join(attachmentsDirectory, attachment.source);
        if (fs.existsSync(attachmentPath)) {
          payloads.set(
            attachment.name,
            JSON.parse(fs.readFileSync(attachmentPath, 'utf8')) as Record<string, unknown>
          );
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not read UI stress metrics from ${fileName}:`, error);
    }
  }

  const summary: string[] = [];
  const history = payloads.get('history-scroll-metrics');
  if (history) {
    const shifts = Array.isArray(history.anchorShifts)
      ? history.anchorShifts.filter((value): value is number => typeof value === 'number')
      : [];
    summary.push(
      `History: ${formatMetric(history.successfulPageLoads)} pages, shift ${formatMetric(shifts.length ? Math.max(...shifts) : 0)}/${formatMetric(history.maxAllowedShiftPx, 'px')}, latest ${history.latestMessageRestored === true ? 'yes' : 'no'}, jump ${history.jumpToOldestCompleted === true ? 'yes' : 'no'}`
    );
  }
  const burst = payloads.get('burst-render-latency');
  if (burst) {
    summary.push(
      `Burst p95: ${formatMetric(burst.p95LatencyMs)}/${formatMetric(burst.budgetMs, 'ms')}`
    );
  }
  const switching = payloads.get('conversation-switch-latency');
  if (switching) summary.push(`Switch p95: ${formatMetric(switching.p95Ms, 'ms')}`);
  const reconnect = payloads.get('reconnect-catch-up-metrics');
  if (reconnect) {
    summary.push(
      `Reconnect: ${formatMetric(reconnect.catchUpLatencyMs)}/${formatMetric(reconnect.budgetMs, 'ms')}`
    );
  }
  const endurance = payloads.get('endurance-browser-metrics');
  if (endurance) {
    summary.push(
      `Endurance: heap ${formatMetric(endurance.observedMaxHeapGrowthPercent)}/${formatMetric(endurance.maxHeapGrowthPercent, '%')}, nodes ${formatMetric(endurance.observedMaxNodeGrowthPercent)}/${formatMetric(endurance.maxNodeGrowthPercent, '%')}, UI p95 ${formatMetric(endurance.finalP95Ms)}/${formatMetric(endurance.interactionP95BudgetMs, 'ms')}`
    );
  }
  const media = payloads.get('endurance-media-readiness');
  if (media) {
    summary.push(
      `Media: realtime ${media.mediaReceivedRealtime === true ? 'yes' : 'no'}, reload ${media.mediaReadyAfterReload === true ? 'yes' : 'no'}`
    );
  }
  return summary;
};

async function run(): Promise<void> {
  const notifier = new MezonNotifier();

  if (action === 'start') {
    let title = 'Playwright E2E Suite';
    if (eventName === 'schedule' && runPhase === 'web') {
      title = 'Allure Daily Web Test Suite (20:00)';
    } else if (eventName === 'schedule' && runPhase === 'multi') {
      title = 'Allure Daily MultiChat Test Suite (02:00)';
    } else if (eventName === 'workflow_dispatch' && isUiStressRun) {
      title = `UI Stress Manual Suite (${stressMode}, ${stressHistoryMessageCount} history messages)`;
    }

    await notifier.sendCronStart(title, {
      branch,
      actor,
      commitSha,
      environment: envName,
    });
  } else if (action === 'end') {
    if (eventName === 'schedule' && runPhase === 'web') {
      console.log(
        'ℹ️ [Mezon] Web phase of daily cronjob completed. End webhook will be sent after 02:00 AM multi phase + deployment.'
      );
      return;
    }

    let passed = 0;
    let failed = 0;
    let skipped = 0;
    const flaky = 0;
    let total = 0;
    let durationMs = 0;

    const reportDirectory = path.join(allureRoot, 'reports', reportRelativePath);
    const candidateSummaryPath = path.join(reportDirectory, 'widgets', 'summary.json');
    const summaryPath =
      reportRelativePath && fs.existsSync(candidateSummaryPath) ? candidateSummaryPath : '';

    if (summaryPath && fs.existsSync(summaryPath)) {
      try {
        const summaryData = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        const stat = summaryData.statistic || {};
        passed = stat.passed || 0;
        failed = (stat.failed || 0) + (stat.broken || 0);
        skipped = stat.skipped || 0;
        total = stat.total || passed + failed + skipped;
        if (summaryData.time && summaryData.time.duration) {
          durationMs = summaryData.time.duration;
        }
        console.log(
          `📊 [Mezon] Parsed summary metrics from ${summaryPath}: ${passed} passed, ${failed} failed, ${skipped} skipped out of ${total}`
        );
      } catch (err) {
        console.warn('⚠️ Could not parse Allure summary.json:', err);
      }
    }

    const isSuccess = failed === 0 && reportDeployOutcome === 'success';
    const emoji = isSuccess ? '🎉' : '💥';
    const suiteName = isUiStressRun
      ? `UI Stress Manual Suite (${stressMode}, ${stressHistoryMessageCount} history messages)`
      : 'Test Suite';
    const statusText = isSuccess
      ? `${suiteName} Completed Successfully`
      : `${suiteName} Completed with Issues`;

    const isScheduled = eventName === 'schedule';
    const targetReportUrl =
      vercelReportUrl ||
      process.env.REPORT_URL ||
      (reportRelativePath
        ? `https://mezon-automation.io.vn/${reportRelativePath}/`
        : 'https://mezon-automation.io.vn/');
    const metricSummary = isUiStressRun ? readUiStressMetricSummary(reportDirectory) : undefined;
    if (metricSummary?.length) {
      console.log(`📈 [Mezon] UI stress metrics: ${metricSummary.join(' | ')}`);
    }

    const payload: NotificationPayload = {
      passed,
      failed,
      skipped,
      flaky,
      totalTests: total,
      totalDuration: durationMs,
      branch,
      actor,
      commitSha,
      environment: envName,
      reportUrl: targetReportUrl,
      captureScreenshot: isScheduled,
      metricSummary,
    };

    await notifier.send(`${emoji} ${statusText}`, payload);
  }
}

run().catch(err => {
  console.error('Fatal error in mezon notify CLI:', err);
  process.exit(1);
});
