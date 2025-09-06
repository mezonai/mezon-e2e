import { type Locator, type Page } from '@playwright/test';

/**
 * Wait Helper Utilities
 * Common wait strategies and helper functions
 */

/**
 * Wait for element to be visible and return locator
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<Locator> {
  const locator = page.locator(selector);
  await locator.waitFor({ state: 'visible', timeout });
  return locator;
}

/**
 * Wait for element to be hidden
 */
export async function waitForElementToHide(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<void> {
  const locator = page.locator(selector);
  await locator.waitFor({ state: 'hidden', timeout });
}

/**
 * Wait for element to be attached to DOM
 */
export async function waitForElementToAttach(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<Locator> {
  const locator = page.locator(selector);
  await locator.waitFor({ state: 'attached', timeout });
  return locator;
}

/**
 * Wait for element to be detached from DOM
 */
export async function waitForElementToDetach(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<void> {
  const locator = page.locator(selector);
  await locator.waitFor({ state: 'detached', timeout });
}

/**
 * Wait for page to fully load
 */
export async function waitForPageLoad(
  page: Page,
  state: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle'
): Promise<void> {
  await page.waitForLoadState(state);
}

/**
 * Wait for URL to contain specific path
 */
export async function waitForURL(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 30000
): Promise<void> {
  await page.waitForURL(urlPattern, { timeout });
}

/**
 * Wait for specific text to appear on page
 */
export async function waitForText(
  page: Page,
  text: string,
  timeout: number = 10000
): Promise<Locator> {
  const locator = page.locator(`text=${text}`);
  await locator.waitFor({ state: 'visible', timeout });
  return locator;
}

/**
 * Wait for specific text to disappear from page
 */
export async function waitForTextToDisappear(
  page: Page,
  text: string,
  timeout: number = 10000
): Promise<void> {
  const locator = page.locator(`text=${text}`);
  await locator.waitFor({ state: 'hidden', timeout });
}

export async function waitForClickable(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<Locator> {
  const locator = page.locator(selector);
  await locator.waitFor({ state: 'visible', timeout });
  await locator.waitFor({ state: 'attached', timeout });

  // Wait for element to be enabled
  await page.waitForFunction(
    sel => {
      const element = document.querySelector(sel);
      return element && !element.hasAttribute('disabled');
    },
    selector,
    { timeout }
  );

  return locator;
}

export async function waitForLoadingToComplete(
  page: Page,
  loadingSelector: string = '.loading, .spinner, [data-loading]',
  timeout: number = 30000
): Promise<void> {
  try {
    await waitForElementToHide(page, loadingSelector, timeout);
  } catch {}
}

export async function waitForCondition(
  page: Page,
  condition: () => Promise<boolean> | boolean,
  timeout: number = 10000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const result = await condition();
      if (result) {
        return;
      }
    } catch {
      // Ignore errors
      // Continue waiting
    }

    await page.waitForTimeout(interval);
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

export async function waitForElementCount(
  page: Page,
  selector: string,
  expectedCount: number,
  timeout: number = 10000
): Promise<void> {
  await page.waitForFunction(
    ({ selector, expectedCount }) => {
      const elements = document.querySelectorAll(selector);
      return elements.length === expectedCount;
    },
    { selector, expectedCount },
    { timeout }
  );
}

export async function waitForAjaxRequests(page: Page, timeout: number = 30000): Promise<void> {
  await page.waitForFunction(
    () => {
      // Check if jQuery is available
      if (typeof (window as any).jQuery !== 'undefined') {
        return (window as any).jQuery.active === 0;
      }

      // Fallback: check for common loading states
      const loadingElements = document.querySelectorAll(
        '.loading, .spinner, [data-loading="true"]'
      );
      return loadingElements.length === 0;
    },
    {},
    { timeout }
  );
}

export async function smartWait(
  page: Page,
  options: {
    element?: string;
    text?: string;
    url?: string | RegExp;
    loadState?: 'load' | 'domcontentloaded' | 'networkidle';
    timeout?: number;
  }
): Promise<void> {
  const timeout = options.timeout || 30000;

  const promises: Promise<any>[] = [];

  if (options.loadState) {
    promises.push(waitForPageLoad(page, options.loadState));
  }

  if (options.element) {
    promises.push(waitForElement(page, options.element, timeout));
  }

  if (options.text) {
    promises.push(waitForText(page, options.text, timeout));
  }

  if (options.url) {
    promises.push(waitForURL(page, options.url, timeout));
  }

  if (promises.length === 0) {
    await waitForPageLoad(page);
  } else {
    await Promise.all(promises);
  }
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Ignore errors
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
