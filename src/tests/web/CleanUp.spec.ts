import { test } from '@playwright/test';

import { AllureConfig } from '@/config/allure.config';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';

test.describe('Manual Cleanup - All Clans', () => {
  test('Clean all clans from 1 account', async ({ browser }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Manual cleanup to delete all clans from account1.
      
      **Test Steps:**
      1. Authenticate with account1
      2. Use ClanSetupHelper to clean all clans
      
      **Expected Result:** All clans should be deleted successfully.
      
      **Note:** This test runs separately from main test suite using 'yarn test:cleanup' command.
    `);

    await AllureReporter.addLabels({
      tag: ['manual-cleanup', 'clan-deletion', 'account1'],
    });

    const clanSetupHelper = new ClanSetupHelper(browser);

    await AllureReporter.step('Clean all clans from account1', async () => {
      await clanSetupHelper.cleanupAllClans(
        browser,
        ClanSetupHelper.configs.clanManagement.suiteName
      );
    });
  });

  test('Clean all clans from all accounts', async ({ browser }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.BLOCKER,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Manual cleanup to delete all clans from all configured accounts.
      
      **Test Steps:**
      1. Loop through all configured accounts
      2. For each account, use ClanSetupHelper to clean all clans
      
      **Expected Result:** All clans from all accounts should be deleted successfully.
      
      **Note:** This test runs separately from main test suite using 'yarn test:cleanup' command.
      **Warning:** This will delete ALL clans from ALL accounts. Use with caution!
    `);

    await AllureReporter.addLabels({
      tag: ['manual-cleanup', 'clan-deletion', 'all-accounts', 'danger'],
    });

    const clanSetupHelper = new ClanSetupHelper(browser);
    const suites = Object.keys(ClanSetupHelper.configs) as Array<
      keyof typeof ClanSetupHelper.configs
    >;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < suites.length; i++) {
      const suiteName = ClanSetupHelper.configs[suites[i]].suiteName;

      try {
        await AllureReporter.step(`Cleanup account: ${suiteName}`, async () => {
          await clanSetupHelper.cleanupAllClans(browser, suiteName);
          successCount++;
        });
      } catch (error) {
        failCount++;
      }
    }

    await AllureReporter.addParameter('totalAccounts', suites.length);
    await AllureReporter.addParameter('successfulCleanups', successCount);
    await AllureReporter.addParameter('failedCleanups', failCount);
  });
});
