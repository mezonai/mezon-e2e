#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import console from 'node:console';
import process from 'node:process';

const manualReportsDir = process.argv[2];
if (!manualReportsDir) {
  console.error('Usage: node build-manual-dashboard.mjs <manual-reports-directory>');
  process.exit(1);
}

const escapeHtml = value =>
  String(value).replace(
    /[&<>"']/g,
    character =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]
  );

const readJson = filePath => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
};

const formatMetric = (value, suffix = '') => {
  const numericValue = typeof value === 'number' ? value : Number.NaN;
  return Number.isFinite(numericValue)
    ? `${numericValue.toFixed(1).replace(/\.0$/, '')}${suffix}`
    : 'N/A';
};

const buildKeyMetrics = payloads => {
  const keyMetrics = [];
  const history = payloads.get('history-scroll-metrics');
  if (history) {
    const shifts = Array.isArray(history.anchorShifts)
      ? history.anchorShifts.filter(value => typeof value === 'number')
      : [];
    keyMetrics.push(
      `History ${formatMetric(history.successfulPageLoads)} pages / shift ${formatMetric(shifts.length ? Math.max(...shifts) : 0)}/${formatMetric(history.maxAllowedShiftPx, 'px')} / latest ${history.latestMessageRestored === true ? 'yes' : 'no'} / jump ${history.jumpToOldestCompleted === true ? 'yes' : 'no'}`
    );
  }
  const burst = payloads.get('burst-render-latency');
  if (burst) {
    keyMetrics.push(
      `Burst p95 ${formatMetric(burst.p95LatencyMs)}/${formatMetric(burst.budgetMs, 'ms')}`
    );
  }
  const switching = payloads.get('conversation-switch-latency');
  if (switching) keyMetrics.push(`Switch p95 ${formatMetric(switching.p95Ms, 'ms')}`);
  const reconnect = payloads.get('reconnect-catch-up-metrics');
  if (reconnect) {
    keyMetrics.push(
      `Reconnect ${formatMetric(reconnect.catchUpLatencyMs)}/${formatMetric(reconnect.budgetMs, 'ms')}`
    );
  }
  const endurance = payloads.get('endurance-browser-metrics');
  if (endurance) {
    keyMetrics.push(
      `Heap ${formatMetric(endurance.observedMaxHeapGrowthPercent)}/${formatMetric(endurance.maxHeapGrowthPercent, '%')} / DOM ${formatMetric(endurance.observedMaxNodeGrowthPercent)}/${formatMetric(endurance.maxNodeGrowthPercent, '%')} / UI p95 ${formatMetric(endurance.finalP95Ms)}/${formatMetric(endurance.interactionP95BudgetMs, 'ms')}`
    );
  }
  const media = payloads.get('endurance-media-readiness');
  if (media) {
    keyMetrics.push(
      `Media realtime ${media.mediaReceivedRealtime === true ? 'yes' : 'no'} / reload ${media.mediaReadyAfterReload === true ? 'yes' : 'no'}`
    );
  }
  return keyMetrics;
};

const collectAttachments = (value, attachments = []) => {
  if (Array.isArray(value)) {
    for (const item of value) collectAttachments(item, attachments);
    return attachments;
  }
  if (!value || typeof value !== 'object') return attachments;

  if (Array.isArray(value.attachments)) {
    attachments.push(...value.attachments);
  }
  for (const [key, nestedValue] of Object.entries(value)) {
    if (key !== 'attachments') collectAttachments(nestedValue, attachments);
  }
  return attachments;
};

const findManualRuns = () => {
  if (!fs.existsSync(manualReportsDir)) return [];
  const runs = [];
  for (const month of fs.readdirSync(manualReportsDir, { withFileTypes: true })) {
    if (!month.isDirectory() || !/^\d{4}-\d{2}$/.test(month.name)) continue;
    const monthDir = path.join(manualReportsDir, month.name);
    for (const run of fs.readdirSync(monthDir, { withFileTypes: true })) {
      if (!run.isDirectory()) continue;
      const runDir = path.join(monthDir, run.name);
      if (!fs.existsSync(path.join(runDir, 'index.html'))) continue;
      runs.push({ month: month.name, name: run.name, directory: runDir });
    }
  }
  return runs.sort((left, right) => right.name.localeCompare(left.name));
};

const buildMetricsPage = run => {
  const testCasesDir = path.join(run.directory, 'data', 'test-cases');
  const attachmentsDir = path.join(run.directory, 'data', 'attachments');
  if (!fs.existsSync(testCasesDir) || !fs.existsSync(attachmentsDir)) {
    return { metricTables: [], keyMetrics: [] };
  }

  const metricTables = [];
  const metricPayloads = new Map();
  for (const fileName of fs.readdirSync(testCasesDir)) {
    if (!fileName.endsWith('.json')) continue;
    const testCase = readJson(path.join(testCasesDir, fileName));
    if (!testCase) continue;
    for (const attachment of collectAttachments(testCase)) {
      if (
        typeof attachment?.source !== 'string' ||
        path.basename(attachment.source) !== attachment.source
      ) {
        continue;
      }
      if (attachment?.type === 'application/json' && typeof attachment?.name === 'string') {
        const payload = readJson(path.join(attachmentsDir, attachment.source));
        if (payload) metricPayloads.set(attachment.name, payload);
      }
      if (attachment?.name === 'UI Stress Metrics Summary' && attachment?.type === 'text/html') {
        metricTables.push({
          testName: testCase.name || 'UI Stress test',
          status: testCase.status || 'unknown',
          source: attachment.source,
        });
      }
    }
  }

  const keyMetrics = buildKeyMetrics(metricPayloads);
  if (metricTables.length === 0) return { metricTables, keyMetrics };
  metricTables.sort((left, right) => left.testName.localeCompare(right.testName));
  const cards = metricTables
    .map(
      table => `
      <section class="metric-card">
        <div class="metric-header">
          <h2>${escapeHtml(table.testName)}</h2>
          <span class="status ${escapeHtml(table.status)}">${escapeHtml(table.status)}</span>
        </div>
        <iframe title="${escapeHtml(table.testName)} metrics" src="./data/attachments/${encodeURIComponent(table.source)}" loading="lazy"></iframe>
      </section>`
    )
    .join('');

  fs.writeFileSync(
    path.join(run.directory, 'metrics.html'),
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>UI Stress Metrics - ${escapeHtml(run.name)}</title>
  <style>
    body { margin: 0; padding: 28px; font-family: Inter, Arial, sans-serif; background: #020617; color: #e2e8f0; }
    header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
    h1, h2 { margin: 0; }
    h1 { font-size: 26px; }
    h2 { font-size: 16px; }
    a { color: #93c5fd; text-decoration: none; }
    .actions { display: flex; gap: 16px; }
    .metric-card { margin-bottom: 24px; border: 1px solid #334155; border-radius: 12px; overflow: hidden; background: #0f172a; }
    .metric-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px; background: #1e293b; }
    .status { padding: 3px 9px; border-radius: 999px; text-transform: uppercase; font-size: 12px; font-weight: 700; background: #334155; }
    .status.passed { background: #14532d; color: #86efac; }
    .status.failed, .status.broken { background: #7f1d1d; color: #fecaca; }
    iframe { display: block; width: 100%; min-height: 520px; border: 0; background: #0f172a; }
  </style>
</head>
<body>
  <header>
    <div><h1>UI Stress Metrics</h1><div>${escapeHtml(run.name)}</div></div>
    <div class="actions"><a href="/manual/">All manual runs</a><a href="./">Open Allure</a></div>
  </header>
  ${cards}
</body>
</html>`
  );

  return { metricTables, keyMetrics };
};

fs.mkdirSync(manualReportsDir, { recursive: true });
const runs = findManualRuns().map(run => {
  const summary = readJson(path.join(run.directory, 'widgets', 'summary.json'));
  const statistic = summary?.statistic || {};
  const dashboard = buildMetricsPage(run);
  return {
    ...run,
    passed: statistic.passed || 0,
    failed: (statistic.failed || 0) + (statistic.broken || 0),
    skipped: statistic.skipped || 0,
    total: statistic.total || 0,
    metricTables: dashboard.metricTables.length,
    keyMetrics: dashboard.keyMetrics,
  };
});

const runCards =
  runs.length > 0
    ? runs
        .map(run => {
          const keyMetricsHtml = run.keyMetrics
            .map(metric => `<span>${escapeHtml(metric)}</span>`)
            .join('');
          const keyMetricsSection =
            run.keyMetrics.length > 0 ? `<div class="key-metrics">${keyMetricsHtml}</div>` : '';
          const metricsLink =
            run.metricTables > 0
              ? `<a class="metrics" href="/manual/${run.month}/${encodeURIComponent(run.name)}/metrics.html">View metrics (${run.metricTables})</a>`
              : '';
          return `
      <li>
        <div>
          <strong>${escapeHtml(run.name)}</strong>
          <div class="stats"><span class="passed">${run.passed} passed</span><span class="failed">${run.failed} failed</span><span>${run.skipped} skipped</span><span>${run.total} total</span></div>
          ${keyMetricsSection}
        </div>
        <div class="actions">
          ${metricsLink}
          <a href="/manual/${run.month}/${encodeURIComponent(run.name)}/">Open Allure</a>
        </div>
      </li>`;
        })
        .join('')
    : '<li><span>No manual reports available</span></li>';

fs.writeFileSync(
  path.join(manualReportsDir, 'index.html'),
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Manual Allure Reports</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; max-width: 1100px; margin: 40px auto; padding: 0 20px; background: #0f172a; color: #e2e8f0; }
    h1 { margin-bottom: 24px; }
    ul { padding: 0; list-style: none; }
    li { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 12px 0; padding: 16px 18px; background: #1e293b; border: 1px solid #334155; border-radius: 10px; }
    a { color: #93c5fd; text-decoration: none; font-weight: 600; }
    .actions { display: flex; gap: 16px; white-space: nowrap; }
    .metrics { color: #c4b5fd; }
    .stats { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; color: #94a3b8; font-size: 13px; }
    .stats .passed { color: #86efac; }
    .stats .failed { color: #fca5a5; }
    .key-metrics { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
    .key-metrics span { padding: 4px 8px; border-radius: 6px; background: #0f172a; color: #cbd5e1; font-size: 12px; }
    @media (max-width: 700px) { li { align-items: flex-start; flex-direction: column; } }
  </style>
</head>
<body>
  <h1>Manual Allure Reports</h1>
  <ul>${runCards}</ul>
</body>
</html>`
);

console.log(`Manual dashboard written with ${runs.length} run(s): ${manualReportsDir}`);
