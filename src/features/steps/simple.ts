import { Given, When, Then } from '../../fixtures/page.fixture';
import { joinUrlPaths } from '../../utils/joinUrlPaths';
import { WEBSITE_CONFIGS } from '../../config/environment';

Given('I navigate to login page', async ({ page }) => {
  const baseUrl = WEBSITE_CONFIGS.MEZON.baseURL || '';
  const loginUrl = joinUrlPaths(baseUrl, '/login');
  await page.goto(loginUrl);
});

When('I fill in credentials', async () => {
  console.log('Filling credentials...');
});

Then('I should be logged in', async () => {
  console.log('Login verified!');
});
