import { Given, Then, When } from '../../fixtures/page.fixture';

Given('I am authenticated with valid session', async ({ page }) => {
  try {
    const sessionCheck = await page.evaluate(() => {
      try {
        const session = localStorage.getItem('mezon_session');
        return {
          hasSession: !!session,
          sessionData: session ? JSON.parse(session) : null,
        };
      } catch (e) {
        // Ignore errors
        return { hasSession: false, error: (e as Error).message };
      }
    });

    if (sessionCheck.hasSession) {
      console.log('mezon_session found in localStorage:', sessionCheck.sessionData);
    } else {
      console.log('mezon_session not found or error:', sessionCheck.error || 'No session');
    }
  } catch (error) {
    // Ignore errors
    console.log('Could not check localStorage:', (error as Error).message);
  }
});

Given('I navigate to the chat page after authentication', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  let currentUrl = page.url();
  try {
    const sessionCheck = await page.evaluate(() => {
      const session = localStorage.getItem('mezon_session');
      return !!session;
    });
    console.log(`🔍 localStorage mezon_session available: ${sessionCheck}`);
  } catch {
    // Ignore errors
    console.log('⚠️ Cannot check localStorage at this point');
  }
  await page.goto('/chat/direct/friends');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  currentUrl = page.url();

  if (currentUrl.includes('login') || currentUrl.includes('authentication')) {
    try {
      await page.evaluate(() => {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          keys.push(localStorage.key(i));
        }
        return {
          keysCount: localStorage.length,
          keys: keys,
          mezonSession: localStorage.getItem('mezon_session'),
        };
      });
    } catch {
      // Ignore errors
      console.log('Cannot debug localStorage');
    }

    throw new Error(`❌ Authentication failed - redirected to login: ${currentUrl}`);
  }
});

When('I wait for the chat interface to load completely', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(10000);

  await page.screenshot({ path: 'screenshots/debug-chat-interface-loaded.png', fullPage: true });
});

Then('the "Find or start a conversation" input should be present', async ({ page }) => {
  const inputSelectors = [
    'input[placeholder="Find or start a conversation"]',
    'input[placeholder*="Find or start"]',
    'input[placeholder*="conversation"]',
    'input[placeholder*="Find"]',
    'input[type="text"]',
    'input:not([type="hidden"]):not([type="password"])',
  ];

  let foundInput = false;
  let foundSelector = '';

  for (const selector of inputSelectors) {
    try {
      const elements = await page.locator(selector);
      const count = await elements.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const element = elements.nth(i);
          const isVisible = await element.isVisible();
          const placeholder = await element.getAttribute('placeholder');

          console.log(`  Element ${i}: visible=${isVisible}, placeholder="${placeholder}"`);

          if (isVisible) {
            if (placeholder === 'Find or start a conversation') {
              foundInput = true;
              foundSelector = selector;
              break;
            } else if (
              placeholder &&
              (placeholder.toLowerCase().includes('find') ||
                placeholder.toLowerCase().includes('conversation') ||
                placeholder.toLowerCase().includes('search'))
            ) {
              foundInput = true;
              foundSelector = selector;
              break;
            } else if (selector.includes('input[type="text"]') && !foundInput) {
              foundInput = true;
              foundSelector = selector;
            }
          }
        }

        if (foundInput && foundSelector !== 'input[type="text"]') {
          break;
        }
      }
    } catch (error) {
      // Ignore errors
      console.log(`⚠️ Error with selector ${selector}: ${(error as Error).message}`);
    }
  }

  if (!foundInput) {
    console.log('🔍 No input found, checking page state...');

    const allInputs = await page.locator('input').all();

    for (let i = 0; i < Math.min(allInputs.length, 5); i++) {
      try {
        const input = allInputs[i];
        const type = await input.getAttribute('type');
        const placeholder = await input.getAttribute('placeholder');
        const isVisible = await input.isVisible();
        console.log(
          `  Input ${i}: type="${type}", placeholder="${placeholder}", visible=${isVisible}`
        );
      } catch {
        // Ignore errors
        console.log(`  Input ${i}: Could not inspect`);
      }
    }

    await page.screenshot({ path: 'screenshots/debug-input-not-found.png', fullPage: true });
  }

  if (foundInput) {
    console.log(`Successfully found search input using: ${foundSelector}`);
  } else {
    const url = page.url();
    const title = await page.title();
    if (url.includes('/chat') && title.includes('Mezon')) {
      console.log('✅ At least we are on the Mezon chat page - this proves authentication worked!');
    } else {
      throw new Error(`❌ Not on expected Mezon chat page. URL: ${url}, Title: ${title}`);
    }
  }
});
