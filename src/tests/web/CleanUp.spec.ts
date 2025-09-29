import { test } from '@playwright/test';

import { AllureConfig } from '@/config/allure.config';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';

test.describe('Manual Cleanup - Account 1', () => {
  test('Clean all clans from account1', async ({ browser, page }) => {
    // Set authentication for the suite
    await AuthHelper.setAuthForSuite(
      page,
      ClanSetupHelper.configs.channelManagement.suiteName || ''
    );
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
        ClanSetupHelper.configs.channelManagement.suiteName || ''
      );
    });
  });
});

test.describe('Manual Cleanup - Account 2-1', () => {
  test('Clean all clans from account2-1', async ({ browser, page }) => {
    // Set authentication for the suite
    await AuthHelper.setAuthForSuite(page, ClanSetupHelper.configs.channelMessage1.suiteName || '');
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
      await clanSetupHelper.cleanupAllClans(
        browser,
        ClanSetupHelper.configs.channelMessage1.suiteName || ''
      );
    });
  });
});

test.describe('Manual Cleanup - Account 2-2', () => {
  test('Clean all clans from account2-2', async ({ browser, page }) => {
    // Set authentication for the suite
    await AuthHelper.setAuthForSuite(page, ClanSetupHelper.configs.channelMessage2.suiteName || '');
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
      await clanSetupHelper.cleanupAllClans(
        browser,
        ClanSetupHelper.configs.channelMessage2.suiteName || ''
      );
    });
  });
});

test.describe('Manual Cleanup - Account 2-3', () => {
  test('Clean all clans from account2-3', async ({ browser, page }) => {
    // Set authentication for the suite
    await AuthHelper.setAuthForSuite(page, ClanSetupHelper.configs.channelMessage3.suiteName || '');
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
      await clanSetupHelper.cleanupAllClans(
        browser,
        ClanSetupHelper.configs.channelMessage3.suiteName || ''
      );
    });
  });
});

test.describe('Manual Cleanup - Account 2-4', () => {
  test('Clean all clans from account2-4', async ({ browser, page }) => {
    // Set authentication for the suite
    await AuthHelper.setAuthForSuite(page, ClanSetupHelper.configs.channelMessage4.suiteName || '');
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
      await clanSetupHelper.cleanupAllClans(
        browser,
        ClanSetupHelper.configs.channelMessage4.suiteName || ''
      );
    });
  });
});

test.describe('Manual Cleanup - Account 2-5', () => {
  test('Clean all clans from account2-5', async ({ browser, page }) => {
    // Set authentication for the suite
    await AuthHelper.setAuthForSuite(page, ClanSetupHelper.configs.channelMessage5.suiteName || '');
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
      await clanSetupHelper.cleanupAllClans(
        browser,
        ClanSetupHelper.configs.channelMessage5.suiteName || ''
      );
    });
  });
});

test.describe('Manual Cleanup - Account 3', () => {
  test('Clean all clans from account3', async ({ browser, page }) => {
    // Set authentication for the suite
    await AuthHelper.setAuthForSuite(page, ClanSetupHelper.configs.clanManagement.suiteName || '');
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
      await clanSetupHelper.cleanupAllClans(
        browser,
        ClanSetupHelper.configs.clanManagement.suiteName || ''
      );
    });
  });
});

test.describe('Manual Cleanup - Account 4', () => {
  test('Clean all clans from account4', async ({ browser, page }) => {
    // Set authentication for the suite
    await AuthHelper.setAuthForSuite(page, ClanSetupHelper.configs.directMessage.suiteName || '');
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
      await clanSetupHelper.cleanupAllClans(
        browser,
        ClanSetupHelper.configs.directMessage.suiteName || ''
      );
    });
  });
});

test.describe('Manual Cleanup - Account 5', () => {
  test('Clean all clans from account5', async ({ browser, page }) => {
    // Set authentication for the suite
    await AuthHelper.setAuthForSuite(page, ClanSetupHelper.configs.onboarding.suiteName || '');
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
      await clanSetupHelper.cleanupAllClans(
        browser,
        ClanSetupHelper.configs.onboarding.suiteName || ''
      );
    });
  });
});

test.describe('Manual Cleanup - Account 6', () => {
  test('Clean all clans from account6', async ({ browser, page }) => {
    // Set authentication for the suite
    await AuthHelper.setAuthForSuite(page, ClanSetupHelper.configs.userProfile.suiteName || '');
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
      await clanSetupHelper.cleanupAllClans(
        browser,
        ClanSetupHelper.configs.userProfile.suiteName || ''
      );
    });
  });
});

test.describe('Manual Cleanup - Account 7', () => {
  test('Clean all clans from account7', async ({ browser, page }) => {
    // Set authentication for the suite
    await AuthHelper.setAuthForSuite(
      page,
      ClanSetupHelper.configs.threadManagement.suiteName || ''
    );
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
      await clanSetupHelper.cleanupAllClans(
        browser,
        ClanSetupHelper.configs.threadManagement.suiteName || ''
      );
    });
  });
});

test.describe('Manual Cleanup - Account 8', () => {
  test('Clean all clans from account8', async ({ browser, page }) => {
    // Set authentication for the suite
    await AuthHelper.setAuthForSuite(
      page,
      ClanSetupHelper.configs.standaloneClanManagement.suiteName || ''
    );
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
      await clanSetupHelper.cleanupAllClans(
        browser,
        ClanSetupHelper.configs.standaloneClanManagement.suiteName || ''
      );
    });
  });
});

test.describe('Manual Cleanup - Account 9', () => {
  test('Clean all clans from account9', async ({ browser, page }) => {
    // Set authentication for the suite
    await AuthHelper.setAuthForSuite(page, ClanSetupHelper.configs.uploadFile.suiteName || '');
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
      await clanSetupHelper.cleanupAllClans(
        browser,
        ClanSetupHelper.configs.uploadFile.suiteName || ''
      );
    });
  });
});
