import { ClanActions } from '@/actions/ClanActions';
import { AllureConfig, TestSetups } from '@/config/allure.config';
import { ClanManagementService } from '@/services/ClanManagementService';
import { TestDataFactory } from '@/shared/factories/TestDataFactory';
import { ClanCreationData } from '@/shared/types/operation.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { expect, test } from '@playwright/test';

// Legacy imports for backward compatibility
import { CategoryPage } from '@/pages/CategoryPage';
import { ClanPageV2 } from '@/pages/ClanPageV2';

test.describe('Clan Management', () => {
  let clanActions: ClanActions;
  let clanManagementService: ClanManagementService;

  test.describe('Create Clan', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      await AllureReporter.initializeTest(page, testInfo, {
        suite: AllureConfig.Suites.CLAN_MANAGEMENT,
        subSuite: AllureConfig.SubSuites.CLAN_CREATION,
        story: AllureConfig.Stories.CLAN_SETUP,
        severity: AllureConfig.Severity.BLOCKER,
        testType: AllureConfig.TestTypes.E2E,
      });

      await TestSetups.clanTest({
        subSuite: AllureConfig.SubSuites.CLAN_CREATION,
        operation: 'Clan Creation',
      });

      // Initialize new architecture components
      clanActions = new ClanActions(page);
      clanManagementService = new ClanManagementService(page);

      // Legacy navigation (preserved for compatibility)
      const clanPage = new ClanPageV2(page);
      await AllureReporter.step('Navigate to direct friends page', async () => {
        await clanPage.navigate('/chat/direct/friends');
        await page.waitForTimeout(2000);
      });
    });

    test('Verify that I can create a Clan', async ({ page }) => {
      await AllureReporter.addTestParameters({
        testType: AllureConfig.TestTypes.E2E,
        userType: AllureConfig.UserTypes.AUTHENTICATED,
        severity: AllureConfig.Severity.BLOCKER,
      });

      await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new clan.
      
      **Test Steps:**
      1. Generate unique clan data using TestDataFactory
      2. Create clan using new ClanActions architecture
      3. Verify clan creation success with proper error handling
      4. Fallback to legacy approach if needed for compatibility
      
      **Expected Result:** New clan is created and visible in the user's clan list.
    `);

      await AllureReporter.addLabels({
        tag: ['clan-creation', 'core-functionality', 'refactored-architecture'],
      });

      // Generate test data using new factory pattern
      const clanData: ClanCreationData = TestDataFactory.createClan({
        name: `New Clan ${Date.now()}`,
        description: 'Test clan created with new architecture',
      });

      await AllureReporter.addParameter('clanName', clanData.name);
      await AllureReporter.addParameter('architecture', 'New ClanActions + Legacy Fallback');

      // Try new architecture first
      await AllureReporter.step('Attempt clan creation with new architecture', async () => {
        const result = await clanActions.createClan(clanData);

        if (result.success) {
          await AllureReporter.step('Verify clan creation success', async () => {
            expect(result.data?.clanId).toBeDefined();
            console.log(
              `Successfully created clan: ${clanData.name} with ID: ${result.data?.clanId}`
            );
          });
          await AllureReporter.attachScreenshot(page, 'Clan Created with New Architecture');
        } else {
          console.log(`New architecture failed: ${result.error}. Falling back to legacy approach.`);

          // Fallback to legacy approach for compatibility
          await AllureReporter.step('Fallback to legacy clan creation', async () => {
            const clanPage = new ClanPageV2(page);

            const createClanClicked = await clanPage.clickCreateClanButton();

            if (createClanClicked) {
              console.log('Successfully clicked create clan button (legacy)');

              await clanPage.createNewClan(clanData.name);

              const isClanPresent = await clanPage.isClanPresent(clanData.name);

              if (isClanPresent) {
                console.log(`Successfully created clan with legacy approach: ${clanData.name}`);
                await AllureReporter.attachScreenshot(page, 'Clan Created with Legacy Approach');
              } else {
                console.log(`Could not complete clan creation: ${clanData.name}`);
                await AllureReporter.attachScreenshot(page, 'Clan Creation Failed');
                throw new Error(`Failed to create clan: ${clanData.name}`);
              }
            } else {
              console.log('Failed to find or click create clan button');
              await AllureReporter.attachScreenshot(page, 'Failed to Create Clan');
              throw new Error('Failed to access clan creation UI');
            }
          });
        }
      });
    });

    test('Verify that I can create a Clan with validation (New Architecture)', async ({ page }) => {
      await AllureReporter.addTestParameters({
        testType: AllureConfig.TestTypes.E2E,
        userType: AllureConfig.UserTypes.AUTHENTICATED,
        severity: AllureConfig.Severity.CRITICAL,
      });

      await AllureReporter.addDescription(`
      **Test Objective:** Verify clan creation with data validation using new architecture.
      
      **Test Steps:**
      1. Generate valid clan data
      2. Use ClanManagementService for validated clan creation
      3. Verify successful creation with proper validation
      
      **Expected Result:** Clan is created with proper validation and success confirmation.
    `);

      await AllureReporter.addLabels({
        tag: ['clan-creation', 'validation', 'new-architecture'],
      });

      // Use factory for gaming clan scenario
      const clanData = TestDataFactory.createGamingClan();

      await AllureReporter.addParameter('clanName', clanData.name);
      await AllureReporter.addParameter('clanType', 'Gaming');

      const result = await clanManagementService.createValidatedClan(clanData);

      await AllureReporter.step('Verify validated clan creation', async () => {
        expect(result.success).toBeTruthy();
        expect(result.data?.clanId).toBeDefined();

        if (result.success) {
          console.log(`Validated clan created successfully: ${clanData.name}`);
          await AllureReporter.attachScreenshot(page, 'Validated Clan Created');
        } else {
          throw new Error(`Validation failed: ${result.error}`);
        }
      });
    });
  });

  test.describe('Create Category', () => {
    let clanData: ClanCreationData;

    test.beforeEach(async ({ page }, testInfo) => {
      await AllureReporter.initializeTest(page, testInfo, {
        suite: AllureConfig.Suites.CLAN_MANAGEMENT,
        subSuite: AllureConfig.SubSuites.CATEGORY_MANAGEMENT,
        story: AllureConfig.Stories.CHANNEL_ORGANIZATION,
        severity: AllureConfig.Severity.CRITICAL,
        testType: AllureConfig.TestTypes.E2E,
      });

      await TestSetups.clanTest({
        subSuite: AllureConfig.SubSuites.CATEGORY_MANAGEMENT,
        operation: 'Category Creation',
      });

      // Initialize new architecture components
      clanActions = new ClanActions(page);
      clanManagementService = new ClanManagementService(page);

      // Generate test clan data using factory
      clanData = TestDataFactory.createClan({
        name: `Test Clan ${Date.now()}`,
        description: 'Clan for category testing',
      });

      const clanPage = new ClanPageV2(page);

      await AllureReporter.step('Navigate to direct friends page', async () => {
        await clanPage.navigate('/chat/direct/friends');
      });

      await AllureReporter.step('Create test clan for category testing', async () => {
        // Try new architecture first, fallback to legacy
        const result = await clanActions.createClan(clanData);

        if (!result.success) {
          console.log('New architecture failed, using legacy approach for setup');
          await clanPage.clickCreateClanButton();
          await clanPage.createNewClan(clanData.name);
        }
      });

      await AllureReporter.addParameter('clanName', clanData.name);
    });

    test.afterEach(async ({ page }, testInfo) => {
      const clanPage = new ClanPageV2(page);

      await AllureReporter.step('Clean up: Delete test clan', async () => {
        // Try new architecture cleanup first
        const cleanupResult = await clanManagementService.cleanupClan(clanData.name);

        if (!cleanupResult.success) {
          console.log('New architecture cleanup failed, using legacy approach');
          const deletedClan = await clanPage.deleteClan(clanData.name);
          if (deletedClan) {
            console.log(`Successfully deleted clan: ${clanData.name}`);
          } else {
            console.log(`Failed to delete clan: ${clanData.name}`);
            await AllureReporter.attachScreenshot(page, 'Cleanup Failed - Delete Clan');
          }
        } else {
          console.log(`Successfully cleaned up clan: ${clanData.name}`);
        }
      });

      if (testInfo.status === 'failed') {
        await AllureReporter.attachScreenshot(page, 'Test Failed - Final Screenshot');
      }
    });

    test('Verify that I can create a private category', async ({ page }) => {
      await AllureReporter.addTestParameters({
        testType: AllureConfig.TestTypes.E2E,
        userType: AllureConfig.UserTypes.AUTHENTICATED,
        severity: AllureConfig.Severity.CRITICAL,
      });

      await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new private category within a clan.
      
      **Test Steps:**
      1. Generate unique category data using TestDataFactory
      2. Create private channel using new ClanActions architecture
      3. Verify category creation success with proper error handling
      4. Fallback to legacy approach if needed for compatibility
      
      **Expected Result:** Private category is created and visible in the clan's category list.
    `);

      await AllureReporter.addLabels({
        tag: ['category-creation', 'private-category', 'refactored-architecture'],
      });

      // Generate channel data using factory
      const channelData = TestDataFactory.createChannel({
        name: `category-private-${Date.now()}`,
        type: 'text',
        description: 'Private category for testing',
        isPrivate: true,
      });

      await AllureReporter.addParameter('categoryName', channelData.name);
      await AllureReporter.addParameter('categoryType', 'private');

      // Try new architecture first
      await AllureReporter.step(
        `Create private category with new architecture: ${channelData.name}`,
        async () => {
          const result = await clanActions.createChannel(channelData);

          if (result.success) {
            await AllureReporter.step('Verify channel creation success', async () => {
              expect(result.data?.channelId).toBeDefined();
              console.log(
                `Successfully created private channel: ${channelData.name} with ID: ${result.data?.channelId}`
              );
            });
            await AllureReporter.attachScreenshot(
              page,
              'Private Category Created with New Architecture'
            );
          } else {
            console.log(
              `New architecture failed: ${result.error}. Falling back to legacy approach.`
            );

            // Fallback to legacy approach
            await AllureReporter.step('Fallback to legacy category creation', async () => {
              const categoryPage = new CategoryPage(page);
              await categoryPage.createCategory(channelData.name, 'private');

              const isCreatedCategory = await categoryPage.isCategoryPresent(channelData.name);
              expect(isCreatedCategory).toBeTruthy();

              await AllureReporter.attachScreenshot(
                page,
                `Private Category Created (Legacy) - ${channelData.name}`
              );
            });
          }
        }
      );
    });

    test('Verify that I can create a public category', async ({ page }) => {
      await AllureReporter.addTestParameters({
        testType: AllureConfig.TestTypes.E2E,
        userType: AllureConfig.UserTypes.AUTHENTICATED,
        severity: AllureConfig.Severity.CRITICAL,
      });

      await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new public category within a clan.
      
      **Test Steps:**
      1. Generate unique category data using TestDataFactory
      2. Create public channel using new ClanActions architecture
      3. Verify category creation success with proper error handling
      4. Fallback to legacy approach if needed for compatibility
      
      **Expected Result:** Public category is created and visible in the clan's category list.
    `);

      await AllureReporter.addLabels({
        tag: ['category-creation', 'public-category', 'refactored-architecture'],
      });

      // Generate channel data using factory
      const channelData = TestDataFactory.createChannel({
        name: `category-public-${Date.now()}`,
        type: 'text',
        description: 'Public category for testing',
        isPrivate: false,
      });

      await AllureReporter.addParameter('categoryName', channelData.name);
      await AllureReporter.addParameter('categoryType', 'public');

      // Try new architecture first
      await AllureReporter.step(
        `Create public category with new architecture: ${channelData.name}`,
        async () => {
          const result = await clanActions.createChannel(channelData);

          if (result.success) {
            await AllureReporter.step('Verify channel creation success', async () => {
              expect(result.data?.channelId).toBeDefined();
              console.log(
                `Successfully created public channel: ${channelData.name} with ID: ${result.data?.channelId}`
              );
            });
            await AllureReporter.attachScreenshot(
              page,
              'Public Category Created with New Architecture'
            );
          } else {
            console.log(
              `New architecture failed: ${result.error}. Falling back to legacy approach.`
            );

            // Fallback to legacy approach
            await AllureReporter.step('Fallback to legacy category creation', async () => {
              const categoryPage = new CategoryPage(page);
              await categoryPage.createCategory(channelData.name, 'public');

              const isCreatedCategory = await categoryPage.isCategoryPresent(channelData.name);
              expect(isCreatedCategory).toBeTruthy();

              await AllureReporter.attachScreenshot(
                page,
                `Public Category Created (Legacy) - ${channelData.name}`
              );
            });
          }
        }
      );
    });

    test('Verify complex clan setup workflow (New Architecture)', async ({ page }) => {
      await AllureReporter.addTestParameters({
        testType: AllureConfig.TestTypes.E2E,
        userType: AllureConfig.UserTypes.AUTHENTICATED,
        severity: AllureConfig.Severity.NORMAL,
      });

      await AllureReporter.addDescription(`
      **Test Objective:** Verify complete clan setup workflow using new ClanManagementService.
      
      **Test Steps:**
      1. Create clan with multiple channels
      2. Send welcome message
      3. Verify complete setup
      
      **Expected Result:** Complex clan setup is completed successfully with all components.
    `);

      await AllureReporter.addLabels({
        tag: ['clan-setup', 'workflow', 'new-architecture'],
      });

      // Use factory for complete scenario
      const scenario = TestDataFactory.createCompleteClanScenario();

      await AllureReporter.addParameter('scenarioType', 'Complete Clan Setup');
      await AllureReporter.addParameter('channelCount', scenario.channels.length);

      const result = await clanManagementService.setupNewClan(
        scenario.clan,
        scenario.channels,
        'Welcome to our new clan! 🎉'
      );

      await AllureReporter.step('Verify complex setup completion', async () => {
        expect(result.success).toBeTruthy();

        if (result.success) {
          expect(result.data?.clanId).toBeDefined();
          expect(result.data?.channelIds).toBeDefined();
          expect(result.data?.channelIds.length).toBeGreaterThan(0);

          console.log(
            `Complex setup completed: Clan ${scenario.clan.name} with ${result.data?.channelIds.length} channels`
          );
          await AllureReporter.attachScreenshot(page, 'Complex Clan Setup Completed');
        } else {
          throw new Error(`Complex setup failed: ${result.error}`);
        }
      });
    });
  });
});
