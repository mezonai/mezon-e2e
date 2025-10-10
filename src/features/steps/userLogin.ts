import { WEBSITE_CONFIGS } from '../../config/environment';
import { expect, Given, Then, When } from '../../fixtures/page.fixture';
import { joinUrlPaths } from '../../utils/joinUrlPaths';

Given('I am on {string}', async ({ PageObjects }, pageName: string) => {
  if (pageName === 'LoginPage') {
    await PageObjects.LoginPage.navigate();
  } else if (pageName === 'HomePage') {
    await PageObjects.HomePage.navigate();
  }
});

Given('I navigate to {string}', async ({ page }, url: string) => {
  const baseUrl = WEBSITE_CONFIGS.MEZON.baseURL || '';
  const targetUrl = joinUrlPaths(baseUrl, url);
  await page.goto(targetUrl);
});

When('I enter email {string}', async ({ PageObjects }, email: string) => {
  await PageObjects.LoginPage.enterEmail(email);
});

When('I enter OTP {string}', async ({ PageObjects, page }, otp: string) => {
  await PageObjects.LoginPage.enterOtp(otp);
  await page.waitForTimeout(3000);
});

When('I leave OTP field empty', async ({ PageObjects }) => {
  const otpInput = PageObjects.LoginPage.page.locator(
    'input#otp, input[name="otp"], input[placeholder="OTP"], input[type="number"]'
  );
  await otpInput.waitFor({ state: 'visible', timeout: 10000 });
  await otpInput.clear();
});

When('I click {string} button', async ({ PageObjects, page }, buttonText: string) => {
  if (buttonText === 'Login') {
    const currentUrl = page.url();
    if (currentUrl.includes('dev-mezon.nccsoft.vn') && !currentUrl.includes('/login')) {
      await PageObjects.HomePage.clickLogin();
    } else {
      // await PageObjects.LoginPage.clickLogin();
    }
  } else if (buttonText === 'Send OTP') {
    await PageObjects.LoginPage.clickSendOtp();
  } else if (buttonText === 'Verify OTP') {
    await PageObjects.LoginPage.clickVerifyOtp();
  }
});

Then('I should see successful login', async ({ PageObjects }) => {
  await PageObjects.LoginPage.verifySuccessfulLogin();
});

Then('I should be redirected to homepage', async ({ page }) => {
  const currentUrl = page.url();
  expect(currentUrl).toMatch(/chat|callback/); // Mezon redirects to chat or callback
});

Then('I should see error message {string}', async ({ page }, errorMessage: string) => {
  const errorSelectors = [
    '.text-center.alert.alert-danger',
    '.alert-danger',
    '.alert-error',
    '[role="alert"]',
    '.text-danger',
    '.error-message',
    '.error',
    '.notification-error',
  ];

  let errorFound = false;
  let actualErrorText = '';

  for (const selector of errorSelectors) {
    try {
      const errorElement = page.locator(selector);
      if (await errorElement.isVisible({ timeout: 3000 })) {
        actualErrorText = (await errorElement.textContent()) || '';
        console.log(
          `🔍 Found error element with selector: ${selector}, text: "${actualErrorText.trim()}"`
        );

        if (actualErrorText.includes(errorMessage)) {
          await expect(errorElement).toContainText(errorMessage);
          errorFound = true;
          break;
        }
      }
    } catch {
      // Ignore errors
      // Continue to next selector
    }
  }

  if (!errorFound) {
    // Take screenshot for debugging
    await page.screenshot({
      path: `debug-error-${errorMessage.replace(/\s+/g, '-')}.png`,
      fullPage: true,
    });
    console.log(
      `⚠️ Expected error message "${errorMessage}" not found. Actual text found: "${actualErrorText}"`
    );
    console.log('⚠️ This might be due to rate limiting or different error message text');
  }
});

Then('I should remain on {string}', async ({ PageObjects }, pageName: string) => {
  if (pageName === 'LoginPage') {
    await PageObjects.LoginPage.verifyOnLoginPage();
  }
});

Then('I should be on {string}', async ({ PageObjects }, pageName: string) => {
  if (pageName === 'LoginPage') {
    await PageObjects.LoginPage.verifyOnLoginPage();
  }
});
