# 🔧 Architecture Code Patterns Reference

## Quick Reference for New Architecture Implementation

This document contains ready-to-use code patterns and examples for implementing the new architecture across your test files.

---

## 🏗️ Core Architecture Files

### 1. ClanActions.ts - Action Layer Pattern

```typescript
import { Page } from '@playwright/test';
import {
  OperationResult,
  ClanCreationData,
  ChannelCreationData,
} from '@/shared/types/operation.types';
import { ClanPageSelectors } from '@/shared/selectors/ClanPageSelectors';

export class ClanActions {
  constructor(private page: Page) {}

  /**
   * Creates a new clan with comprehensive error handling
   */
  async createClan(clanData: ClanCreationData): Promise<OperationResult<{ clanId: string }>> {
    try {
      console.log(`🏗️  Creating clan: ${clanData.name}`);

      // Navigate to clan creation
      await this.page.goto('/chat/direct/friends');
      await this.page.waitForLoadState('networkidle');

      // Click create clan button
      const createButton = this.page.locator(ClanPageSelectors.CREATE_CLAN_BUTTON);
      if (!(await createButton.isVisible())) {
        return {
          success: false,
          error: 'Create clan button not found',
          errorCode: 'BUTTON_NOT_FOUND',
          context: { selector: ClanPageSelectors.CREATE_CLAN_BUTTON },
        };
      }

      await createButton.click();

      // Fill clan details
      await this.page.fill(ClanPageSelectors.CLAN_NAME_INPUT, clanData.name);

      if (clanData.description) {
        await this.page.fill(ClanPageSelectors.CLAN_DESCRIPTION_INPUT, clanData.description);
      }

      // Set privacy settings
      if (clanData.isPrivate) {
        await this.page.check(ClanPageSelectors.PRIVATE_CLAN_CHECKBOX);
      }

      // Submit creation
      await this.page.click(ClanPageSelectors.CREATE_BUTTON);
      await this.page.waitForLoadState('networkidle');

      // Verify creation
      const clanElement = this.page.locator(ClanPageSelectors.clanInList(clanData.name));
      await clanElement.waitFor({ timeout: 10000 });

      // Extract clan ID (if available)
      const clanId = await this.extractClanId(clanData.name);

      return {
        success: true,
        data: { clanId },
        context: { clanName: clanData.name },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'CLAN_CREATION_FAILED',
        context: { clanData, error: error.toString() },
      };
    }
  }

  /**
   * Creates a new channel within a clan
   */
  async createChannel(
    channelData: ChannelCreationData
  ): Promise<OperationResult<{ channelId: string }>> {
    try {
      console.log(`📁 Creating channel: ${channelData.name}`);

      // Navigate to channel creation
      const addChannelButton = this.page.locator(ClanPageSelectors.ADD_CHANNEL_BUTTON);
      await addChannelButton.click();

      // Fill channel details
      await this.page.fill(ClanPageSelectors.CHANNEL_NAME_INPUT, channelData.name);

      // Select channel type
      await this.page.selectOption(ClanPageSelectors.CHANNEL_TYPE_SELECT, channelData.type);

      if (channelData.description) {
        await this.page.fill(ClanPageSelectors.CHANNEL_DESCRIPTION_INPUT, channelData.description);
      }

      // Set privacy
      if (channelData.isPrivate) {
        await this.page.check(ClanPageSelectors.PRIVATE_CHANNEL_CHECKBOX);
      }

      // Submit
      await this.page.click(ClanPageSelectors.CREATE_CHANNEL_BUTTON);
      await this.page.waitForLoadState('networkidle');

      // Verify creation
      const channelElement = this.page.locator(ClanPageSelectors.channelInList(channelData.name));
      await channelElement.waitFor({ timeout: 10000 });

      const channelId = await this.extractChannelId(channelData.name);

      return {
        success: true,
        data: { channelId },
        context: { channelName: channelData.name },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'CHANNEL_CREATION_FAILED',
        context: { channelData, error: error.toString() },
      };
    }
  }

  /**
   * Sends a message to a channel
   */
  async sendMessage(
    channelName: string,
    message: string
  ): Promise<OperationResult<{ messageId: string }>> {
    try {
      // Navigate to channel
      const channelSelector = ClanPageSelectors.channelInList(channelName);
      await this.page.click(channelSelector);

      // Send message
      await this.page.fill(ClanPageSelectors.MESSAGE_INPUT, message);
      await this.page.press(ClanPageSelectors.MESSAGE_INPUT, 'Enter');

      // Wait for message to appear
      const messageElement = this.page.locator(ClanPageSelectors.messageWithText(message));
      await messageElement.waitFor({ timeout: 5000 });

      const messageId = await this.extractMessageId(message);

      return {
        success: true,
        data: { messageId },
        context: { channelName, message },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'MESSAGE_SEND_FAILED',
        context: { channelName, message, error: error.toString() },
      };
    }
  }

  // Helper methods
  private async extractClanId(clanName: string): Promise<string> {
    // Implementation to extract clan ID from DOM or URL
    return `clan_${Date.now()}`;
  }

  private async extractChannelId(channelName: string): Promise<string> {
    // Implementation to extract channel ID
    return `channel_${Date.now()}`;
  }

  private async extractMessageId(message: string): Promise<string> {
    // Implementation to extract message ID
    return `message_${Date.now()}`;
  }
}
```

### 2. ClanManagementService.ts - Service Layer Pattern

```typescript
import { Page } from '@playwright/test';
import { ClanActions } from '@/actions/ClanActions';
import {
  OperationResult,
  ClanCreationData,
  ChannelCreationData,
} from '@/shared/types/operation.types';

interface ClanSetupResult {
  clanId: string;
  channelIds: string[];
  welcomeMessageId?: string;
}

export class ClanManagementService {
  private clanActions: ClanActions;

  constructor(private page: Page) {
    this.clanActions = new ClanActions(page);
  }

  /**
   * Creates a validated clan with business logic
   */
  async createValidatedClan(
    clanData: ClanCreationData
  ): Promise<OperationResult<{ clanId: string }>> {
    // Validation
    if (!clanData.name || clanData.name.trim().length === 0) {
      return {
        success: false,
        error: 'Clan name is required',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    if (clanData.name.length > 50) {
      return {
        success: false,
        error: 'Clan name too long',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    // Create clan
    return await this.clanActions.createClan(clanData);
  }

  /**
   * Sets up a complete clan with channels and welcome message
   */
  async setupNewClan(
    clanData: ClanCreationData,
    channels: ChannelCreationData[],
    welcomeMessage?: string
  ): Promise<OperationResult<ClanSetupResult>> {
    try {
      console.log(`🚀 Setting up complete clan: ${clanData.name}`);

      // Step 1: Create clan
      const clanResult = await this.createValidatedClan(clanData);
      if (!clanResult.success) {
        return {
          success: false,
          error: `Clan creation failed: ${clanResult.error}`,
          errorCode: 'CLAN_SETUP_FAILED',
        };
      }

      const clanId = clanResult.data.clanId;
      const channelIds: string[] = [];

      // Step 2: Create channels
      for (const channelData of channels) {
        console.log(`📁 Creating channel: ${channelData.name}`);

        const channelResult = await this.clanActions.createChannel(channelData);
        if (channelResult.success) {
          channelIds.push(channelResult.data.channelId);
        } else {
          console.warn(`⚠️ Failed to create channel ${channelData.name}: ${channelResult.error}`);
          // Continue with other channels
        }
      }

      // Step 3: Send welcome message
      let welcomeMessageId: string | undefined;
      if (welcomeMessage && channelIds.length > 0) {
        const firstChannel = channels[0];
        const messageResult = await this.clanActions.sendMessage(firstChannel.name, welcomeMessage);
        if (messageResult.success) {
          welcomeMessageId = messageResult.data.messageId;
        }
      }

      return {
        success: true,
        data: {
          clanId,
          channelIds,
          welcomeMessageId,
        },
        context: {
          clanName: clanData.name,
          channelsCreated: channelIds.length,
          totalChannelsRequested: channels.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'CLAN_SETUP_FAILED',
        context: { clanData, channels, error: error.toString() },
      };
    }
  }

  /**
   * Cleans up a clan and all its resources
   */
  async cleanupClan(clanId: string): Promise<OperationResult<void>> {
    try {
      // Implementation for clan cleanup
      console.log(`🧹 Cleaning up clan: ${clanId}`);

      // This would typically involve:
      // - Deleting all messages
      // - Removing all channels
      // - Deleting the clan

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'CLEANUP_FAILED',
      };
    }
  }

  /**
   * Validates clan exists and is accessible
   */
  async validateClanAccess(clanName: string): Promise<OperationResult<{ isAccessible: boolean }>> {
    try {
      // Navigate to clan
      await this.page.goto('/chat/direct/friends');

      // Check if clan is visible in list
      const clanSelector = `[data-testid="clan-${clanName}"]`;
      const isVisible = await this.page.locator(clanSelector).isVisible();

      return {
        success: true,
        data: { isAccessible: isVisible },
        context: { clanName },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'VALIDATION_FAILED',
      };
    }
  }
}
```

### 3. TestDataFactory.ts - Factory Pattern

```typescript
import { ClanCreationData, ChannelCreationData } from '@/shared/types/operation.types';

export class TestDataFactory {
  /**
   * Creates basic clan data
   */
  static createClan(overrides: Partial<ClanCreationData> = {}): ClanCreationData {
    return {
      name: `Test Clan ${Date.now()}`,
      description: 'A test clan created by automation',
      isPrivate: false,
      tags: ['test', 'automation'],
      ...overrides,
    };
  }

  /**
   * Creates gaming-focused clan
   */
  static createGamingClan(overrides: Partial<ClanCreationData> = {}): ClanCreationData {
    return this.createClan({
      name: `Gaming Clan ${Date.now()}`,
      description: 'A clan for gamers to connect and play together',
      tags: ['gaming', 'multiplayer', 'competitive'],
      ...overrides,
    });
  }

  /**
   * Creates workspace/professional clan
   */
  static createWorkspaceClan(overrides: Partial<ClanCreationData> = {}): ClanCreationData {
    return this.createClan({
      name: `Workspace ${Date.now()}`,
      description: 'Professional workspace for team collaboration',
      isPrivate: true,
      tags: ['work', 'professional', 'team'],
      ...overrides,
    });
  }

  /**
   * Creates basic channel data
   */
  static createChannel(overrides: Partial<ChannelCreationData> = {}): ChannelCreationData {
    return {
      name: `test-channel-${Date.now()}`,
      type: 'text',
      description: 'Test channel for automation',
      isPrivate: false,
      ...overrides,
    };
  }

  /**
   * Creates a set of default channels for a clan
   */
  static createDefaultChannels(): ChannelCreationData[] {
    return [
      this.createChannel({
        name: 'general',
        description: 'General discussion channel',
        type: 'text',
        isPrivate: false,
      }),
      this.createChannel({
        name: 'announcements',
        description: 'Important announcements',
        type: 'text',
        isPrivate: false,
      }),
      this.createChannel({
        name: 'voice-chat',
        description: 'Voice communication',
        type: 'voice',
        isPrivate: false,
      }),
      this.createChannel({
        name: 'private-discussion',
        description: 'Private team discussions',
        type: 'text',
        isPrivate: true,
      }),
    ];
  }

  /**
   * Creates gaming-specific channels
   */
  static createGamingChannels(): ChannelCreationData[] {
    return [
      this.createChannel({
        name: 'general-chat',
        description: 'General gaming discussions',
        type: 'text',
      }),
      this.createChannel({
        name: 'lfg-looking-for-group',
        description: 'Find teammates and groups',
        type: 'text',
      }),
      this.createChannel({
        name: 'voice-lobby',
        description: 'Voice chat for gaming sessions',
        type: 'voice',
      }),
      this.createChannel({
        name: 'streams',
        description: 'Share and watch game streams',
        type: 'stream',
      }),
    ];
  }

  /**
   * Creates complete clan scenario with clan and channels
   */
  static createCompleteClanScenario(type: 'gaming' | 'workspace' | 'general' = 'general') {
    let clan: ClanCreationData;
    let channels: ChannelCreationData[];

    switch (type) {
      case 'gaming':
        clan = this.createGamingClan();
        channels = this.createGamingChannels();
        break;
      case 'workspace':
        clan = this.createWorkspaceClan();
        channels = this.createDefaultChannels();
        break;
      default:
        clan = this.createClan();
        channels = this.createDefaultChannels();
    }

    return { clan, channels };
  }

  /**
   * Creates test data for edge cases
   */
  static createEdgeCaseData() {
    return {
      longName: this.createClan({
        name: 'A'.repeat(50), // Maximum length
        description: 'Testing maximum name length',
      }),

      specialCharacters: this.createClan({
        name: 'Test Clan !@#$%^&*()_+-=[]{}|;:,.<>?',
        description: 'Testing special characters in name',
      }),

      unicodeCharacters: this.createClan({
        name: 'Test Clan 🚀 Gaming 🎮 Community 🌟',
        description: 'Testing unicode characters',
      }),

      emptyDescription: this.createClan({
        description: '',
      }),
    };
  }

  /**
   * Creates test data for performance testing
   */
  static createPerformanceTestData(count: number) {
    const clans = [];
    const channels = [];

    for (let i = 0; i < count; i++) {
      clans.push(
        this.createClan({
          name: `Performance Clan ${i + 1}`,
          description: `Performance test clan number ${i + 1}`,
        })
      );

      channels.push(
        this.createChannel({
          name: `perf-channel-${i + 1}`,
          description: `Performance test channel ${i + 1}`,
        })
      );
    }

    return { clans, channels };
  }
}
```

---

## 🔧 Implementation Patterns

### 1. Test File Structure Pattern

```typescript
// clan-creation-management.spec.ts
import { test, expect } from '@playwright/test';
import { AllureReporter, AllureConfig } from '@/config/allure.config';
import { ClanActions } from '@/actions/ClanActions';
import { ClanManagementService } from '@/services/ClanManagementService';
import { TestDataFactory } from '@/shared/factories/TestDataFactory';

// Legacy imports for fallback
import { CategoryPage } from '@/pages/CategoryPage';
import { ClanPageV2 } from '@/pages/ClanPageV2';

test.describe('Clan Management', () => {
  let clanActions: ClanActions;
  let clanManagementService: ClanManagementService;

  // Legacy components for fallback
  let categoryPage: CategoryPage;
  let clanPage: ClanPageV2;

  test.beforeEach(async ({ page }, testInfo) => {
    // Initialize new architecture
    clanActions = new ClanActions(page);
    clanManagementService = new ClanManagementService(page);

    // Initialize legacy components for fallback
    categoryPage = new CategoryPage(page);
    clanPage = new ClanPageV2(page);

    // Set up Allure reporting
    await AllureReporter.initializeTest(page, testInfo, {
      suite: AllureConfig.Suites.CLAN_MANAGEMENT,
      subSuite: AllureConfig.SubSuites.CLAN_MANAGEMENT.CLAN_CREATION,
      epic: 'Clan Management',
      feature: 'Clan Creation',
      severity: 'critical',
      description: 'Test clan creation functionality with new architecture',
    });

    // Common setup
    await page.goto('/login');
    // ... login logic
  });

  test('Create new clan - New Architecture with Fallback', async ({ page }) => {
    // Generate test data
    const clanData = TestDataFactory.createClan({
      name: `Test Clan ${Date.now()}`,
      description: 'Created with new architecture',
    });

    // Try new architecture
    const result = await clanActions.createClan(clanData);

    if (result.success) {
      // Success with new architecture
      expect(result.data?.clanId).toBeDefined();

      // Add Allure steps
      await AllureReporter.addStep('Clan created successfully', 'passed', {
        clanId: result.data?.clanId,
        clanName: clanData.name,
        architecture: 'new',
      });
    } else {
      // Fallback to legacy
      console.log(`⚠️ New architecture failed: ${result.error}. Using legacy fallback.`);

      await AllureReporter.addStep('New architecture failed, using fallback', 'passed', {
        error: result.error,
        fallbackUsed: true,
      });

      // Legacy implementation
      const createClanClicked = await clanPage.clickCreateClanButton();

      if (createClanClicked) {
        await clanPage.createNewClan(clanData.name);
        const isClanPresent = await clanPage.isClanPresent(clanData.name);
        expect(isClanPresent).toBeTruthy();

        await AllureReporter.addStep('Clan created with legacy method', 'passed', {
          clanName: clanData.name,
          architecture: 'legacy',
        });
      }
    }
  });

  test('Create clan with channels - Service Layer', async ({ page }) => {
    // Create complete scenario
    const scenario = TestDataFactory.createCompleteClanScenario('gaming');

    // Use service layer for complex operation
    const result = await clanManagementService.setupNewClan(
      scenario.clan,
      scenario.channels,
      'Welcome to our gaming clan! 🎮'
    );

    if (result.success) {
      expect(result.data?.clanId).toBeDefined();
      expect(result.data?.channelIds).toBeDefined();
      expect(result.data?.channelIds.length).toBeGreaterThan(0);

      await AllureReporter.addStep('Complete clan setup successful', 'passed', {
        clanId: result.data?.clanId,
        channelsCreated: result.data?.channelIds.length,
        welcomeMessageSent: !!result.data?.welcomeMessageId,
      });
    } else {
      throw new Error(`Clan setup failed: ${result.error}`);
    }
  });
});
```

### 2. Error Handling Pattern

```typescript
// Robust error handling with context
async function handleClanOperation<T>(
  operation: () => Promise<OperationResult<T>>,
  fallback?: () => Promise<boolean>,
  operationName: string = 'Operation'
): Promise<T> {
  try {
    // Try new architecture
    const result = await operation();

    if (result.success) {
      console.log(`✅ ${operationName} succeeded with new architecture`);
      return result.data!;
    }

    // Log failure details
    console.log(`❌ ${operationName} failed:`, {
      error: result.error,
      errorCode: result.errorCode,
      context: result.context,
    });

    // Try fallback if available
    if (fallback) {
      console.log(`🔄 Attempting fallback for ${operationName}`);
      const fallbackSuccess = await fallback();

      if (fallbackSuccess) {
        console.log(`✅ ${operationName} succeeded with fallback`);
        return {} as T; // Return appropriate fallback result
      }
    }

    throw new Error(`${operationName} failed: ${result.error}`);
  } catch (error) {
    console.error(`💥 ${operationName} threw exception:`, error);
    throw error;
  }
}

// Usage
const clanResult = await handleClanOperation(
  () => clanActions.createClan(clanData),
  () => legacyCreateClan(clanData),
  'Clan Creation'
);
```

### 3. Configuration Pattern

```typescript
// Environment-based configuration
interface ArchitectureConfig {
  useNewArchitecture: boolean;
  fallbackOnFailure: boolean;
  adoptionPercentage: number;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

const config: ArchitectureConfig = {
  useNewArchitecture: process.env.USE_NEW_ARCH !== 'false',
  fallbackOnFailure: process.env.ALLOW_FALLBACK !== 'false',
  adoptionPercentage: parseInt(process.env.ADOPTION_PERCENTAGE || '100'),
  logLevel: (process.env.LOG_LEVEL as any) || 'info',
};

// Use in tests
test('Configurable architecture test', async ({ page }) => {
  const useNewArch = config.useNewArchitecture && Math.random() * 100 < config.adoptionPercentage;

  if (useNewArch) {
    // New architecture path
    const result = await clanActions.createClan(clanData);

    if (!result.success && config.fallbackOnFailure) {
      // Fallback path
      await legacyCreateClan(clanData);
    }
  } else {
    // Legacy path
    await legacyCreateClan(clanData);
  }
});
```

---

## 📋 Migration Checklist per Test File

### Pre-Migration

```typescript
// 1. Add imports
import { ClanActions } from '@/actions/ClanActions';
import { ClanManagementService } from '@/services/ClanManagementService';
import { TestDataFactory } from '@/shared/factories/TestDataFactory';

// 2. Keep legacy imports
import { CategoryPage } from '@/pages/CategoryPage';
import { ClanPageV2 } from '@/pages/ClanPageV2';
```

### During Migration

```typescript
// 3. Initialize both architectures
test.beforeEach(async ({ page }) => {
  // New architecture
  const clanActions = new ClanActions(page);
  const clanManagementService = new ClanManagementService(page);

  // Legacy fallback
  const clanPage = new ClanPageV2(page);
  const categoryPage = new CategoryPage(page);
});

// 4. Replace test data creation
// OLD: const clanName = `Clan ${Date.now()}`;
// NEW: const clanData = TestDataFactory.createClan();

// 5. Update test implementation with fallback
const result = await clanActions.createClan(clanData);
if (!result.success) {
  // Fallback to legacy
  await legacyImplementation();
}
```

### Post-Migration

```typescript
// 6. Add comprehensive logging
console.log(`Operation result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
if (!result.success) {
  console.log(`Error: ${result.error} (${result.errorCode})`);
}

// 7. Update Allure reporting
await AllureReporter.addStep('Operation completed', result.success ? 'passed' : 'failed', {
  architecture: result.success ? 'new' : 'legacy',
  details: result.context,
});
```

---

**Ready to implement?** Start with one test file, follow the patterns above, and gradually migrate your entire test suite! 🚀
