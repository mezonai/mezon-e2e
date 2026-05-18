import { MezonCredentials } from '@/types';
import { AuthHelper } from '@/utils/authHelper';
import { Page } from '@playwright/test';
import { DualProvider } from '../fixtures/dual.fixture';

export function getUsernamesFromEmails(emails: string[]): string[] {
  return emails.map(email => email.split('@')[0]);
}

type DualUserSetupOptions = {
  delayBeforeMs?: number;
};

type DualUsersSetupOptions = {
  delayBeforeAMs?: number;
  delayBeforeBMs?: number;
};

export async function setupDualUser(
  page: Page,
  account: MezonCredentials,
  url: string,
  options: DualUserSetupOptions = {}
) {
  if (options.delayBeforeMs) {
    await page.waitForTimeout(options.delayBeforeMs);
  }

  const credentials = await AuthHelper.setupAuthWithEmailPassword(page, account);
  await AuthHelper.prepareBeforeTest(page, url, credentials);
}

export async function setupDualUsersSequentially(
  dual: DualProvider,
  accountA: MezonCredentials,
  accountB: MezonCredentials,
  url: string,
  options: DualUsersSetupOptions = {}
) {
  await setupDualUser(dual.pageA, accountA, url, { delayBeforeMs: options.delayBeforeAMs });
  await setupDualUser(dual.pageB, accountB, url, { delayBeforeMs: options.delayBeforeBMs });
}

export async function setupDualUsersInParallel(
  dual: DualProvider,
  accountA: MezonCredentials,
  accountB: MezonCredentials,
  url: string,
  options: DualUsersSetupOptions = {}
) {
  await dual.parallel({
    A: async () => {
      await setupDualUser(dual.pageA, accountA, url, {
        delayBeforeMs: options.delayBeforeAMs,
      });
    },
    B: async () => {
      await setupDualUser(dual.pageB, accountB, url, {
        delayBeforeMs: options.delayBeforeBMs,
      });
    },
  });
}
