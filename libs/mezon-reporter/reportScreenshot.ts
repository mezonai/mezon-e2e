import { chromium } from '@playwright/test';

export interface ScreenshotResult {
  url: string;
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  filename: string;
  filetype: string;
}

export async function captureReportScreenshot(
  targetUrl: string = 'https://mezon-automation.io.vn/'
): Promise<ScreenshotResult | null> {
  const width = 1280;
  const height = 800;
  const filename = `report_${Date.now()}.jpg`;
  const filetype = 'image/jpeg';

  console.log(`📸 [Screenshot] Launching Playwright to capture ${targetUrl}...`);

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1.5,
    });

    const page = await context.newPage();

    await page.goto(targetUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(2500);

    const screenshotBuffer = await page.screenshot({
      type: 'jpeg',
      quality: 85,
      fullPage: false,
    });

    console.log(
      `📸 [Screenshot] Successfully captured ${targetUrl} (${screenshotBuffer.length} bytes in memory)`
    );

    const base64DataUri = `data:${filetype};base64,${screenshotBuffer.toString('base64')}`;

    return {
      url: base64DataUri,
      buffer: screenshotBuffer,
      width,
      height,
      size: screenshotBuffer.length,
      filename,
      filetype,
    };
  } catch (error) {
    console.error('❌ [Screenshot] Error capturing report screenshot with Playwright:', error);
    return null;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }
}
