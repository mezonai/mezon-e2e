// Example usage of ClanSetupHelper in a new test file

import { test, expect } from '@playwright/test';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { ChannelType, ChannelStatus } from '@/types/clan-page.types';

test.describe('Example Test Suite Using ClanSetupHelper', () => {
  let clanSetupHelper: ClanSetupHelper;
  let testClanName: string;
  let testClanUrl: string;
  let testChannelUrl: string;

  // Example 1: Simple clan setup (no channel)
  test.describe('Simple Clan Tests', () => {
    test.beforeAll(async ({ browser }) => {
      clanSetupHelper = new ClanSetupHelper(browser);

      const setupResult = await clanSetupHelper.setupTestClan({
        clanNamePrefix: 'SimpleClan',
        suiteName: 'Simple Tests',
      });

      testClanName = setupResult.clanName;
      testClanUrl = setupResult.clanUrl;
    });

    test.afterAll(async ({ browser }) => {
      if (clanSetupHelper) {
        await clanSetupHelper.cleanupAllClans();
      }
    });

    test('should have created a clan', async ({ page }) => {
      await page.goto(testClanUrl);
      expect(testClanUrl).toContain('chat/clans');
    });
  });

  // Example 2: Clan with channel setup
  test.describe('Clan with Channel Tests', () => {
    test.beforeAll(async ({ browser }) => {
      clanSetupHelper = new ClanSetupHelper(browser);

      const setupResult = await clanSetupHelper.setupTestClanWithChannel({
        clanNamePrefix: 'ChannelClan',
        channelNamePrefix: 'test-channel',
        channelType: ChannelType.TEXT,
        channelStatus: ChannelStatus.PUBLIC,
        suiteName: 'Channel Tests',
      });

      testClanName = setupResult.clanName;
      testClanUrl = setupResult.clanUrl;
      testChannelUrl = setupResult.clanChannelUrl!;
    });

    test.afterAll(async ({ browser }) => {
      if (clanSetupHelper) {
        await clanSetupHelper.cleanupAllClans();
      }
    });

    test('should have created a clan with channel', async ({ page }) => {
      await page.goto(testChannelUrl);
      expect(testChannelUrl).toContain('channels');
    });
  });

  // Example 3: Using predefined configurations
  test.describe('Predefined Config Tests', () => {
    test.beforeAll(async ({ browser }) => {
      clanSetupHelper = new ClanSetupHelper(browser);

      // Use predefined configuration for message tests
      const setupResult = await clanSetupHelper.setupTestClanWithChannel(
        ClanSetupHelper.configs.messageTests
      );

      testClanName = setupResult.clanName;
      testChannelUrl = setupResult.clanChannelUrl!;
    });

    test.afterAll(async ({ browser }) => {
      if (clanSetupHelper) {
        await clanSetupHelper.cleanupAllClans();
      }
    });

    test('should use message test configuration', async ({ page }) => {
      await page.goto(testChannelUrl);
      expect(testClanName).toContain('MessageTestClan');
    });
  });

  // Example 4: Manual cleanup (if needed)
  test.describe('Manual Cleanup Example', () => {
    let manualClanSetup: any;

    test.beforeAll(async ({ browser }) => {
      clanSetupHelper = new ClanSetupHelper(browser);

      manualClanSetup = await clanSetupHelper.setupTestClan({
        clanNamePrefix: 'ManualClan',
        suiteName: 'Manual Tests',
      });
    });

    test.afterAll(async ({ browser }) => {
      // Option 1: Use the cleanup function returned from setup
      if (manualClanSetup?.cleanup) {
        await manualClanSetup.cleanup();
      }

      // Option 2: Use the helper's cleanup all method
      // await clanSetupHelper.cleanupAllClans();
    });

    test('should allow manual cleanup', async ({ page }) => {
      await page.goto(manualClanSetup.clanUrl);
      expect(manualClanSetup.clanName).toContain('ManualClan');
    });
  });
});

// Example 5: Using convenience functions
test.describe('Convenience Functions Example', () => {
  let setupResult: any;

  test.beforeAll(async ({ browser }) => {
    // Using the static setup method
    setupResult = await ClanSetupHelper.setupTestClan(browser, {
      clanNamePrefix: 'ConvenienceClan',
      createChannel: true,
      channelType: ChannelType.VOICE,
      suiteName: 'Convenience Tests',
    });
  });

  test.afterAll(async ({ browser }) => {
    // Using the static cleanup method
    await ClanSetupHelper.cleanupTestClan(
      browser,
      setupResult.clanName,
      setupResult.clanUrl,
      'Convenience Tests Cleanup'
    );
  });

  test('should work with convenience functions', async ({ page }) => {
    await page.goto(setupResult.clanUrl);
    expect(setupResult.clanName).toContain('ConvenienceClan');
  });
});
