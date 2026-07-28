import * as fs from 'fs';
import * as path from 'path';

const LANGUAGES_DIR = path.resolve(process.cwd(), 'libs/languages');
const REPORT_DIR = path.resolve(process.cwd(), 'language-check-report');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

type FlattenedKeys = Record<string, string>;

function flattenKeys(obj: unknown, prefix = ''): FlattenedKeys {
  const result: FlattenedKeys = {};
  if (typeof obj !== 'object' || obj === null) {
    result[prefix] = String(obj);
    return result;
  }
  if (Array.isArray(obj)) {
    result[prefix] = JSON.stringify(obj);
    return result;
  }
  for (const [key, value] of Object.entries(obj)) {
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    Object.assign(result, flattenKeys(value, newPrefix));
  }
  return result;
}

function extractPlaceholders(value: string): string[] {
  const matches = value.match(/\{\{\w+\}\}/g);
  return matches ? matches.map(m => m.replace(/[{}]/g, '')) : [];
}

interface FileResult {
  missing: string[];
  extra: string[];
  placeholderMismatch: { key: string; enPlaceholders: string[]; langPlaceholders: string[] }[];
}

interface LangReport {
  lang: string;
  files: {
    name: string;
    status: 'ok' | 'missing_file' | 'issues';
    missing: string[];
    extra: string[];
    placeholderMismatch: { key: string; enPlaceholders: string[]; langPlaceholders: string[] }[];
    extraFile?: boolean;
  }[];
  summary: {
    missingFiles: number;
    extraFiles: number;
    missingKeys: number;
    extraKeys: number;
    placeholderMismatches: number;
  };
}

function compareFiles(enFile: string, langFile: string): FileResult {
  const enContent = JSON.parse(fs.readFileSync(enFile, 'utf-8'));
  const langContent = JSON.parse(fs.readFileSync(langFile, 'utf-8'));

  const enFlat = flattenKeys(enContent);
  const langFlat = flattenKeys(langContent);

  const enKeys = new Set(Object.keys(enFlat));
  const langKeys = new Set(Object.keys(langFlat));

  const missing: string[] = [];
  const extra: string[] = [];
  const placeholderMismatch: FileResult['placeholderMismatch'] = [];

  for (const key of Array.from(enKeys)) {
    if (!langKeys.has(key)) {
      missing.push(key);
    } else {
      const enPlaceholders = extractPlaceholders(enFlat[key]);
      const langPlaceholders = extractPlaceholders(langFlat[key]);
      if (
        enPlaceholders.length > 0 &&
        JSON.stringify([...enPlaceholders].sort()) !== JSON.stringify([...langPlaceholders].sort())
      ) {
        placeholderMismatch.push({
          key,
          enPlaceholders,
          langPlaceholders,
        });
      }
    }
  }

  for (const key of Array.from(langKeys)) {
    if (!enKeys.has(key)) {
      extra.push(key);
    }
  }

  return { missing, extra, placeholderMismatch };
}

function writeReport(
  reports: LangReport[],
  summary: { totalIssues: number },
): void {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const jsonPath = path.join(REPORT_DIR, `report-${TIMESTAMP}.json`);
  const mdPath = path.join(REPORT_DIR, `report-${TIMESTAMP}.md`);

  // JSON
  fs.writeFileSync(jsonPath, JSON.stringify({ generatedAt: TIMESTAMP, summary, reports }, null, 2));

  // Markdown
  const lines: string[] = [];
  lines.push('# Language Key Check Report');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|------:|`);
  lines.push(`| Languages checked | ${reports.length} |`);
  lines.push(`| Total issues | ${summary.totalIssues} |`);
  lines.push('');

  for (const report of reports) {
    const s = report.summary;
    const totalFileIssues = s.missingFiles + s.extraFiles;
    const totalKeyIssues = s.missingKeys + s.extraKeys + s.placeholderMismatches;
    const total = totalFileIssues + totalKeyIssues;
    if (total === 0) continue;

    lines.push(`## ${report.lang.toUpperCase()}`);
    lines.push('');
    lines.push(`| Category | Count |`);
    lines.push(`|----------|------:|`);
    lines.push(`| Missing files | ${s.missingFiles} |`);
    lines.push(`| Extra files | ${s.extraFiles} |`);
    lines.push(`| Missing keys | ${s.missingKeys} |`);
    lines.push(`| Extra keys | ${s.extraKeys} |`);
    lines.push(`| Placeholder mismatches | ${s.placeholderMismatches} |`);
    lines.push(`| **Total** | **${total}** |`);
    lines.push('');

    for (const file of report.files) {
      if (file.status === 'ok') continue;

      if (file.status === 'missing_file') {
        lines.push(`### ❌ \`${file.name}\``);
        lines.push(`- **File missing** (exists in EN but not in ${report.lang})`);
        lines.push('');
        continue;
      }
      if (file.extraFile) {
        lines.push(`### ⚠️ \`${file.name}\``);
        lines.push(`- **Extra file** (exists in ${report.lang} but not in EN)`);
        lines.push('');
        continue;
      }

      if (file.missing.length > 0 || file.extra.length > 0 || file.placeholderMismatch.length > 0) {
        lines.push(`### \`${file.name}\``);
        lines.push('');

        if (file.missing.length > 0) {
          lines.push(`**Missing keys (${file.missing.length}):**`);
          lines.push('```');
          file.missing.forEach(k => lines.push(k));
          lines.push('```');
          lines.push('');
        }

        if (file.extra.length > 0) {
          lines.push(`**Extra keys (${file.extra.length}):**`);
          lines.push('```');
          file.extra.forEach(k => lines.push(k));
          lines.push('```');
          lines.push('');
        }

        if (file.placeholderMismatch.length > 0) {
          lines.push(`**Placeholder mismatches (${file.placeholderMismatch.length}):**`);
          lines.push('');
          lines.push('| Key | EN placeholders | Lang placeholders |');
          lines.push('|-----|-----------------|-------------------|');
          for (const pm of file.placeholderMismatch) {
            lines.push(`| \`${pm.key}\` | \`${pm.enPlaceholders.join(', ')}\` | \`${pm.langPlaceholders.join(', ')}\` |`);
          }
          lines.push('');
        }
      }
    }
  }

  fs.writeFileSync(mdPath, lines.join('\n'));
  console.log(`\n📄 Report saved: ${mdPath}`);
  console.log(`📄 JSON report: ${jsonPath}\n`);
}

function main(): void {
  const languages = fs.readdirSync(LANGUAGES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  const enDir = path.join(LANGUAGES_DIR, 'en');
  const enFiles = fs.readdirSync(enDir).filter(f => f.endsWith('.json')).sort();

  const reports: LangReport[] = [];
  let grandTotal = 0;

  for (const lang of languages) {
    if (lang === 'en') continue;

    const langDir = path.join(LANGUAGES_DIR, lang);
    if (!fs.existsSync(langDir)) continue;

    const report: LangReport = {
      lang,
      files: [],
      summary: { missingFiles: 0, extraFiles: 0, missingKeys: 0, extraKeys: 0, placeholderMismatches: 0 },
    };

    // Check each EN file
    for (const file of enFiles) {
      const enFile = path.join(enDir, file);
      const langFile = path.join(langDir, file);

      if (!fs.existsSync(langFile)) {
        report.files.push({ name: file, status: 'missing_file', missing: [], extra: [], placeholderMismatch: [] });
        report.summary.missingFiles++;
        grandTotal++;
        continue;
      }

      const result = compareFiles(enFile, langFile);
      const hasIssues = result.missing.length > 0 || result.extra.length > 0 || result.placeholderMismatch.length > 0;

      report.files.push({
        name: file,
        status: hasIssues ? 'issues' : 'ok',
        ...result,
      });

      report.summary.missingKeys += result.missing.length;
      report.summary.extraKeys += result.extra.length;
      report.summary.placeholderMismatches += result.placeholderMismatch.length;
      grandTotal += result.missing.length + result.extra.length + result.placeholderMismatch.length;
    }

    // Check for extra files
    const langFiles = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));
    for (const file of langFiles) {
      if (!enFiles.includes(file)) {
        report.files.push({ name: file, status: 'issues', missing: [], extra: [], placeholderMismatch: [], extraFile: true });
        report.summary.extraFiles++;
        grandTotal++;
      }
    }

    reports.push(report);
  }

  writeReport(reports, { totalIssues: grandTotal });

  // Console summary
  console.log(`\nChecked ${reports.length} languages against EN reference (${enFiles.length} files).`);
  for (const r of reports) {
    const s = r.summary;
    const total = s.missingFiles + s.extraFiles + s.missingKeys + s.extraKeys + s.placeholderMismatches;
    const icon = total === 0 ? '✅' : '❌';
    console.log(`  ${icon} ${r.lang.toUpperCase().padEnd(5)}: ${total} issues (${s.missingKeys} missing keys, ${s.extraKeys} extra keys, ${s.placeholderMismatches} placeholder mismatches, ${s.missingFiles} missing files, ${s.extraFiles} extra files)`);
  }
  console.log(`\nTotal: ${grandTotal} issue(s)\n`);
}

main();
