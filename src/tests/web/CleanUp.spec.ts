import { test } from '@playwright/test';

import { AllureConfig } from '@/config/allure.config';
import { AllureReporter } from '@/utils/allureHelpers';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';

test.describe('Manual Cleanup - Account 1', () => {
  test.use({ storageState: 'playwright/.auth/account1.json' });

  test('Clean all clans from account1', async ({ browser }) => {
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
      await clanSetupHelper.cleanupAllClans(browser, 'Channel Management');
    });
  });
});

test.describe('Manual Cleanup - Account 2-1', () => {
  test.use({ storageState: 'playwright/.auth/account2-1.json' });

  test('Clean all clans from account2-1', async ({ browser }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Manual cleanup to delete all clans from account2-1.
      
      **Test Steps:**
      1. Authenticate with account2-1
      2. Use ClanSetupHelper to clean all clans
      
      **Expected Result:** All clans should be deleted successfully.
    `);

    await AllureReporter.addLabels({
      tag: ['manual-cleanup', 'clan-deletion', 'account2-1'],
    });

    const clanSetupHelper = new ClanSetupHelper(browser);

    await AllureReporter.step('Clean all clans from account2-1', async () => {
      await clanSetupHelper.cleanupAllClans(browser, 'Channel Message - Module 1');
    });
  });
});

test.describe('Manual Cleanup - Account 2-2', () => {
  test.use({ storageState: 'playwright/.auth/account2-2.json' });

  test('Clean all clans from account2-2', async ({ browser }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Manual cleanup to delete all clans from account2-2.
      
      **Test Steps:**
      1. Authenticate with account2-2
      2. Use ClanSetupHelper to clean all clans
      
      **Expected Result:** All clans should be deleted successfully.
    `);

    await AllureReporter.addLabels({
      tag: ['manual-cleanup', 'clan-deletion', 'account2-2'],
    });

    const clanSetupHelper = new ClanSetupHelper(browser);

    await AllureReporter.step('Clean all clans from account2-2', async () => {
      await clanSetupHelper.cleanupAllClans(browser, 'Channel Message - Module 2');
    });
  });
});

test.describe('Manual Cleanup - Account 2-3', () => {
  test.use({ storageState: 'playwright/.auth/account2-3.json' });

  test('Clean all clans from account2-3', async ({ browser }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Manual cleanup to delete all clans from account2-3.
      
      **Test Steps:**
      1. Authenticate with account2-3
      2. Use ClanSetupHelper to clean all clans
      
      **Expected Result:** All clans should be deleted successfully.
    `);

    await AllureReporter.addLabels({
      tag: ['manual-cleanup', 'clan-deletion', 'account2-3'],
    });

    const clanSetupHelper = new ClanSetupHelper(browser);

    await AllureReporter.step('Clean all clans from account2-3', async () => {
      await clanSetupHelper.cleanupAllClans(browser, 'Channel Message - Module 3');
    });
  });
});

test.describe('Manual Cleanup - Account 2-4', () => {
  test.use({ storageState: 'playwright/.auth/account2-4.json' });

  test('Clean all clans from account2-4', async ({ browser }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Manual cleanup to delete all clans from account2-4.
      
      **Test Steps:**
      1. Authenticate with account2-4
      2. Use ClanSetupHelper to clean all clans
      
      **Expected Result:** All clans should be deleted successfully.
    `);

    await AllureReporter.addLabels({
      tag: ['manual-cleanup', 'clan-deletion', 'account2-4'],
    });

    const clanSetupHelper = new ClanSetupHelper(browser);

    await AllureReporter.step('Clean all clans from account2-4', async () => {
      await clanSetupHelper.cleanupAllClans(browser, 'Channel Message - Module 4');
    });
  });
});

test.describe('Manual Cleanup - Account 2-5', () => {
  test.use({ storageState: 'playwright/.auth/account2-5.json' });

  test('Clean all clans from account2-5', async ({ browser }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Manual cleanup to delete all clans from account2-5.
      
      **Test Steps:**
      1. Authenticate with account2-5
      2. Use ClanSetupHelper to clean all clans
      
      **Expected Result:** All clans should be deleted successfully.
    `);

    await AllureReporter.addLabels({
      tag: ['manual-cleanup', 'clan-deletion', 'account2-5'],
    });

    const clanSetupHelper = new ClanSetupHelper(browser);

    await AllureReporter.step('Clean all clans from account2-5', async () => {
      await clanSetupHelper.cleanupAllClans(browser, 'Channel Message - Module 5');
    });
  });
});

test.describe('Manual Cleanup - Account 3', () => {
  test.use({ storageState: 'playwright/.auth/account3.json' });

  test('Clean all clans from account3', async ({ browser }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Manual cleanup to delete all clans from account3.
      
      **Test Steps:**
      1. Authenticate with account3
      2. Use ClanSetupHelper to clean all clans
      
      **Expected Result:** All clans should be deleted successfully.
    `);

    await AllureReporter.addLabels({
      tag: ['manual-cleanup', 'clan-deletion', 'account3'],
    });

    const clanSetupHelper = new ClanSetupHelper(browser);

    await AllureReporter.step('Clean all clans from account3', async () => {
      await clanSetupHelper.cleanupAllClans(browser, 'Clan Management');
    });
  });
});

test.describe('Manual Cleanup - Account 4', () => {
  test.use({ storageState: 'playwright/.auth/account4.json' });

  test('Clean all clans from account4', async ({ browser }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Manual cleanup to delete all clans from account4.
      
      **Test Steps:**
      1. Authenticate with account4
      2. Use ClanSetupHelper to clean all clans
      
      **Expected Result:** All clans should be deleted successfully.
    `);

    await AllureReporter.addLabels({
      tag: ['manual-cleanup', 'clan-deletion', 'account4'],
    });

    const clanSetupHelper = new ClanSetupHelper(browser);

    await AllureReporter.step('Clean all clans from account4', async () => {
      await clanSetupHelper.cleanupAllClans(browser, 'Direct Message');
    });
  });
});

test.describe('Manual Cleanup - Account 5', () => {
  test.use({ storageState: 'playwright/.auth/account5.json' });

  test('Clean all clans from account5', async ({ browser }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Manual cleanup to delete all clans from account5.
      
      **Test Steps:**
      1. Authenticate with account5
      2. Use ClanSetupHelper to clean all clans
      
      **Expected Result:** All clans should be deleted successfully.
    `);

    await AllureReporter.addLabels({
      tag: ['manual-cleanup', 'clan-deletion', 'account5'],
    });

    const clanSetupHelper = new ClanSetupHelper(browser);

    await AllureReporter.step('Clean all clans from account5', async () => {
      await clanSetupHelper.cleanupAllClans(browser, 'Onboarding Guide');
    });
  });
});

test.describe('Manual Cleanup - Account 6', () => {
  test.use({ storageState: 'playwright/.auth/account6.json' });

  test('Clean all clans from account6', async ({ browser }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Manual cleanup to delete all clans from account6.
      
      **Test Steps:**
      1. Authenticate with account6
      2. Use ClanSetupHelper to clean all clans
      
      **Expected Result:** All clans should be deleted successfully.
    `);

    await AllureReporter.addLabels({
      tag: ['manual-cleanup', 'clan-deletion', 'account6'],
    });

    const clanSetupHelper = new ClanSetupHelper(browser);

    await AllureReporter.step('Clean all clans from account6', async () => {
      await clanSetupHelper.cleanupAllClans(browser, 'User Profile');
    });
  });
});

test.describe('Manual Cleanup - Account 7', () => {
  test.use({ storageState: 'playwright/.auth/account7.json' });

  test('Clean all clans from account7', async ({ browser }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Manual cleanup to delete all clans from account7.
      
      **Test Steps:**
      1. Authenticate with account7
      2. Use ClanSetupHelper to clean all clans
      
      **Expected Result:** All clans should be deleted successfully.
    `);

    await AllureReporter.addLabels({
      tag: ['manual-cleanup', 'clan-deletion', 'account7'],
    });

    const clanSetupHelper = new ClanSetupHelper(browser);

    await AllureReporter.step('Clean all clans from account7', async () => {
      await clanSetupHelper.cleanupAllClans(browser, 'Thread Management');
    });
  });
});

test.describe('Manual Cleanup - Account 8', () => {
  test.use({ storageState: 'playwright/.auth/account8.json' });

  test('Clean all clans from account8', async ({ browser }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Manual cleanup to delete all clans from account8.
      
      **Test Steps:**
      1. Authenticate with account8
      2. Use ClanSetupHelper to clean all clans
      
      **Expected Result:** All clans should be deleted successfully.
    `);

    await AllureReporter.addLabels({
      tag: ['manual-cleanup', 'clan-deletion', 'account8'],
    });

    const clanSetupHelper = new ClanSetupHelper(browser);

    await AllureReporter.step('Clean all clans from account8', async () => {
      await clanSetupHelper.cleanupAllClans(browser, 'Standalone - Clan Management');
    });
  });
});

test.describe('Manual Cleanup - Account 9', () => {
  test.use({ storageState: 'playwright/.auth/account9.json' });

  test('Clean all clans from account9', async ({ browser }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Manual cleanup to delete all clans from account9.
      
      **Test Steps:**
      1. Authenticate with account9
      2. Use ClanSetupHelper to clean all clans
      
      **Expected Result:** All clans should be deleted successfully.
    `);

    await AllureReporter.addLabels({
      tag: ['manual-cleanup', 'clan-deletion', 'account9'],
    });

    const clanSetupHelper = new ClanSetupHelper(browser);

    await AllureReporter.step('Clean all clans from account9', async () => {
      await clanSetupHelper.cleanupAllClans(browser, 'Upload File');
    });
  });
});
