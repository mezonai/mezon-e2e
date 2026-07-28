import { Page, expect } from '@playwright/test';
import { loadLanguage, changeLanguage, SupportedLang } from './language-helper';

export async function verifyPageTranslation(page: Page, targetLang: SupportedLang) {
  const enDict = loadLanguage('en');
  const targetDict = loadLanguage(targetLang);

  // Build reverse map: English text → translation key
  const textToKey: Record<string, string> = {};
  for (const [key, value] of Object.entries(enDict)) {
    textToKey[value] = key;
  }

  // Scan all visible text on current page
  const visibleTexts = await page.evaluate(() => {
    const texts = new Set<string>();
    const allNodes = Array.from(document.body.querySelectorAll('*'));
    for (const el of allNodes) {
      if (el.children.length === 0 && el.textContent) {
        const text = el.textContent.trim();
        if (text && text.length >= 2 && text.length <= 200) {
          texts.add(text);
        }
      }
    }
    return Array.from(texts);
  });

  // Match against EN dictionary → get keys
  const foundKeys: string[] = [];
  for (const text of visibleTexts) {
    const key = textToKey[text];
    if (key && !foundKeys.includes(key)) foundKeys.push(key);
  }

  if (foundKeys.length === 0) {
    return {
      checked: 0,
      passed: 0,
      failed: [],
      message: 'No matching translation keys found on page',
    };
  }

  // Switch language
  await changeLanguage(page, targetLang);

  // Verify each translation
  const passed: string[] = [];
  const failed: Array<{ key: string; enText: string; expected: string }> = [];

  for (const key of foundKeys) {
    const enText = enDict[key];
    const targetText = targetDict[key];

    if (!targetText || targetText === enText) {
      // No translation available, skip
      continue;
    }

    // Check translated text appears (partial match to handle wrapping)
    try {
      await expect(page.getByText(targetText, { exact: false }).first()).toBeVisible({
        timeout: 3000,
      });
      passed.push(key);
    } catch {
      failed.push({ key, enText, expected: targetText });
    }
  }

  return {
    checked: foundKeys.length,
    passed: passed.length,
    failed,
    message:
      failed.length > 0
        ? `${failed.length}/${foundKeys.length} keys failed translation check`
        : `All ${passed.length} keys translated correctly`,
  };
}
