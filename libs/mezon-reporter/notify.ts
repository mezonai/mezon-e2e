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

async function run(): Promise<void> {
  const notifier = new MezonNotifier();

  if (action === 'start') {
    let title = 'Playwright E2E Suite';
    if (eventName === 'schedule' && runPhase === 'web') {
      title = 'Allure Daily Web Test Suite (20:00)';
    } else if (eventName === 'schedule' && runPhase === 'multi') {
      title = 'Allure Daily MultiChat Test Suite (02:00)';
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

    let summaryPath = '';
    if (
      reportRelativePath &&
      fs.existsSync(path.join(allureRoot, 'reports', reportRelativePath, 'widgets', 'summary.json'))
    ) {
      summaryPath = path.join(allureRoot, 'reports', reportRelativePath, 'widgets', 'summary.json');
    }

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

    const isSuccess = failed === 0;
    const emoji = isSuccess ? '🎉' : '💥';
    const statusText = isSuccess
      ? 'Test Suite Completed Successfully'
      : 'Test Suite Completed with Issues';

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
      reportUrl: vercelReportUrl,
    };

    await notifier.send(`${emoji} ${statusText}`, payload);
  }
}

run().catch(err => {
  console.error('Fatal error in mezon notify CLI:', err);
  process.exit(1);
});
