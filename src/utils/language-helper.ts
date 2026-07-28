import * as fs from 'fs';
import * as path from 'path';
import { Page } from '@playwright/test';

const LANGUAGES_DIR = path.resolve(process.cwd(), 'libs/languages');
const I18N_KEY = 'i18nextLng';

const cache: Record<string, Record<string, string>> = {};

function flattenKeys(obj: unknown, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  if (typeof obj !== 'object' || obj === null) {
    result[prefix] = String(obj);
    return result;
  }
  if (Array.isArray(obj)) {
    result[prefix] = JSON.stringify(obj);
    return result;
  }
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    Object.assign(result, flattenKeys(value, newPrefix));
  }
  return result;
}

export function loadLanguage(lang: string): Record<string, string> {
  if (cache[lang]) return cache[lang];

  const langDir = path.join(LANGUAGES_DIR, lang);
  if (!fs.existsSync(langDir)) {
    throw new Error(`Language directory not found: ${langDir}`);
  }

  const merged: Record<string, string> = {};
  const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const content = JSON.parse(fs.readFileSync(path.join(langDir, file), 'utf-8'));
    const prefix = file.replace('.json', '');
    Object.assign(merged, flattenKeys(content, prefix));
  }

  cache[lang] = merged;
  return merged;
}

export function getText(lang: string, key: string): string {
  const dict = loadLanguage(lang);
  const value = dict[key];
  if (value === undefined) {
    throw new Error(`Translation key not found: "${key}" for language "${lang}"`);
  }
  return value;
}

export function t(key: string, lang = 'en'): string {
  return getText(lang, key);
}

export async function changeLanguage(page: Page, lang: string): Promise<void> {
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, value);
      window.location.reload();
    },
    { key: I18N_KEY, value: lang }
  );
  await page.waitForLoadState('networkidle');
}

export const SUPPORTED_LANGUAGES = [
  'en',
  'vi',
  'de',
  'fr',
  'es',
  'ru',
  'jpn',
  'kr',
  'tt',
  'ukr',
  'nl',
  'pl',
  'pt',
  'blr',
  'it',
  'swe',
] as const;

export type SupportedLang = (typeof SUPPORTED_LANGUAGES)[number];
