import { Page } from '@playwright/test';

export default async function pressEsc(page: Page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
}
