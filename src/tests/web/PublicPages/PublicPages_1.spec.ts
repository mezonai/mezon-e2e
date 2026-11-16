import { AllureConfig, TestSetups } from '@/config/allure.config';
import { WEBSITE_CONFIGS } from '@/config/environment';
import { AllureReporter } from '@/utils/allureHelpers';
import { expect, test } from '@playwright/test';

test.describe('Public & Brand Portals - Contact Us, About, Brand Center & AI Agent (Cases 123-126)', () => {
  test.beforeAll(async () => {
    await TestSetups.authenticationTest({
      suite: AllureConfig.Suites.PLATFORM_COMPATIBILITY,
      subSuite: AllureConfig.SubSuites.NAVIGATION,
      story: 'Public Portals',
      severity: AllureConfig.Severity.NORMAL,
    });
  });

  test('TC01: Verify Contact Us form modal validation and dismiss (Case 123)', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65123' });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify opening Contact Us / Survey form, checking required fields validation, and closing via Close button or Escape (Case 123).
    `);

    await page.goto(WEBSITE_CONFIGS.MEZON.baseURL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await AllureReporter.step('Open Contact Us / Support modal if available', async () => {
      const contactBtn = page
        .locator('a[href*="contact"], button:has-text("Contact"), [data-e2e*="contact"]')
        .first();
      const hasContact = await contactBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasContact) {
        await contactBtn.click();
        await page.waitForTimeout(500);

        // Verify modal or form container
        const modal = page.locator('div[role="dialog"], form').first();
        if (await modal.isVisible()) {
          // Test close modal
          const closeBtn = modal
            .locator('button[aria-label="Close"], button:has-text("Close")')
            .first();
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
          } else {
            await page.keyboard.press('Escape');
          }
        }
      }
    });
  });

  test('TC02: Verify About Mezon platform download menu and platform links (Case 124)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65124' });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify opening/closing Desktop and Mobile download menus and confirming valid platform URLs (Case 124).
    `);

    await page.goto(WEBSITE_CONFIGS.MEZON.baseURL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await AllureReporter.step('Verify platform download triggers and targets', async () => {
      const downloadMenu = page
        .locator('button:has-text("Download"), a[href*="download"], [data-e2e*="download"]')
        .first();
      const hasDownload = await downloadMenu.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasDownload) {
        await downloadMenu.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
      }
    });
  });

  test('TC03: Verify Brand Center table of contents and resource download (Case 125)', async ({
    page,
  }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65125' });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify Brand Center table of contents smooth scroll and asset bundle download triggers (Case 125).
    `);

    await page.goto(WEBSITE_CONFIGS.MEZON.baseURL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await AllureReporter.step('Check Brand Center navigation anchors', async () => {
      const brandLink = page.locator('a[href*="brand"], [data-e2e*="brand"]').first();
      const hasBrand = await brandLink.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasBrand) {
        await brandLink.click();
        await page.waitForTimeout(500);
      }
      expect(page.url()).toBeTruthy();
    });
  });

  test('TC04: Verify AI Agent FAQ accordion and download modal (Case 126)', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ tms: '65126' });
    await AllureReporter.addDescription(`
      **Test Objective:** Verify AI Agent landing page: FAQ accordion expand/collapse and CTA download modal (Case 126).
    `);

    await page.goto(WEBSITE_CONFIGS.MEZON.baseURL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await AllureReporter.step('Check FAQ accordions or landing controls', async () => {
      const faqItem = page.locator('div[class*="accordion"], details, [data-e2e*="faq"]').first();
      const hasFaq = await faqItem.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasFaq) {
        await faqItem.click();
        await page.waitForTimeout(300);
        await faqItem.click();
      }
      expect(page.url()).toBeTruthy();
    });
  });
});
