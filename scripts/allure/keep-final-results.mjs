#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const resultsDir = path.resolve(process.argv[2] || 'allure-results');
const dryRun = process.argv.includes('--dry-run');

if (!fs.existsSync(resultsDir)) {
  console.log(`[allure] No results directory found at ${resultsDir}; nothing to filter.`);
  process.exit(0);
}

const resultFiles = fs
  .readdirSync(resultsDir)
  .filter(file => file.endsWith('-result.json'))
  .sort();

const latestByTest = new Map();
const invalidFiles = [];

for (const file of resultFiles) {
  const filePath = path.join(resultsDir, file);
  let result;

  try {
    result = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    invalidFiles.push(file);
    console.warn(`[allure] Ignoring invalid result ${file}: ${error.message}`);
    continue;
  }

  // Dynamic Allure parameters are included in historyId, so retries of the
  // same Playwright test can have different historyIds. testCaseId remains
  // stable across those attempts. Include the Playwright project so Web and
  // Multi results cannot collapse into each other in the combined report.
  const project =
    result.parameters?.find(parameter => parameter.name === 'Project')?.value || 'unknown-project';
  const testIdentity =
    result.testCaseId || result.historyId || result.fullName || result.uuid || file;
  const identity = `${project}:${testIdentity}`;
  const finishedAt = Number(result.stop || result.start || 0);
  const current = latestByTest.get(identity);

  if (
    !current ||
    finishedAt > current.finishedAt ||
    (finishedAt === current.finishedAt && file > current.file)
  ) {
    latestByTest.set(identity, { file, finishedAt, status: result.status || 'unknown' });
  }
}

const filesToKeep = new Set([...latestByTest.values()].map(result => result.file));
const filesToRemove = resultFiles.filter(file => !filesToKeep.has(file));
const finalStatuses = {};

for (const result of latestByTest.values()) {
  finalStatuses[result.status] = (finalStatuses[result.status] || 0) + 1;
}

if (!dryRun) {
  for (const file of filesToRemove) {
    fs.unlinkSync(path.join(resultsDir, file));
  }
}

console.log(
  `[allure] ${dryRun ? 'Would keep' : 'Kept'} ${filesToKeep.size} final test results; ` +
    `${dryRun ? 'would remove' : 'removed'} ${filesToRemove.length} superseded/invalid results ` +
    `(${invalidFiles.length} invalid).`
);
console.log(`[allure] Final statuses: ${JSON.stringify(finalStatuses)}`);
