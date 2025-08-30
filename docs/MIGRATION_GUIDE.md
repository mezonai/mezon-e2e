# 🚀 Clan Management Migration Guide

## Overview

This guide provides step-by-step instructions for migrating from the legacy clan management architecture to the new refactored architecture, including code examples and best practices.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Migration Steps](#migration-steps)
3. [Code Examples](#code-examples)
4. [Legacy vs New Comparison](#legacy-vs-new-comparison)
5. [Testing Strategy](#testing-strategy)
6. [Rollback Plan](#rollback-plan)

---

## 🏗️ Architecture Overview

### Legacy Architecture

```
src/pages/
├── ClanPage.ts          # Original clan page
├── ClanPageV2.ts        # Enhanced version
└── CategoryPage.ts      # Category management

src/tests/web/
└── clan-creation-management.spec.ts  # Mixed responsibilities
```

### New Refactored Architecture

```
src/
├── actions/
│   └── ClanActions.ts           # UI interaction layer
├── services/
│   └── ClanManagementService.ts # Business logic layer
├── shared/
│   ├── factories/
│   │   └── TestDataFactory.ts   # Test data generation
│   ├── selectors/
│   │   └── ClanPageSelectors.ts # Centralized selectors
│   └── types/
│       └── operation.types.ts   # Type definitions
└── tests/web/
    └── clan-creation-management.spec.ts  # Clean test structure
```

---

## 🔄 Migration Steps

### Step 1: Install Dependencies

```typescript
// Add new imports to your test files
import { ClanActions } from '@/actions/ClanActions';
import { ClanManagementService } from '@/services/ClanManagementService';
import { TestDataFactory } from '@/shared/factories/TestDataFactory';
import { ClanCreationData } from '@/shared/types/operation.types';

// Keep legacy imports for backward compatibility
import { CategoryPage } from '@/pages/CategoryPage';
import { ClanPageV2 } from '@/pages/ClanPageV2';
```

### Step 2: Initialize New Components

```typescript
// In your test beforeEach
test.beforeEach(async ({ page }, testInfo) => {
  // Initialize new architecture components
  const clanActions = new ClanActions(page);
  const clanManagementService = new ClanManagementService(page);

  // Keep legacy initialization for fallback
  const clanPage = new ClanPageV2(page);

  // Your existing setup code remains unchanged
  await AllureReporter.initializeTest(page, testInfo, {
    suite: AllureConfig.Suites.CLAN_MANAGEMENT,
    // ... other config
  });
});
```

### Step 3: Update Test Data Generation

```typescript
// OLD WAY - Manual data creation
const clanName = `New Clan ${Date.now()}`;

// NEW WAY - Factory pattern
const clanData: ClanCreationData = TestDataFactory.createClan({
  name: `New Clan ${Date.now()}`,
  description: 'Test clan created with new architecture',
});

// Or use predefined scenarios
const gamingClan = TestDataFactory.createGamingClan();
const workspaceClan = TestDataFactory.createWorkspaceClan();
```

---

## 💻 Code Examples

### 1. Clan Creation Migration

#### Legacy Approach

```typescript
test('Create clan - Legacy', async ({ page }) => {
  const clanName = `New Clan ${Date.now()}`;
  const clanPage = new ClanPageV2(page);

  await clanPage.navigate('/chat/direct/friends');

  const createClanClicked = await clanPage.clickCreateClanButton();
  if (createClanClicked) {
    await clanPage.createNewClan(clanName);
    const isClanPresent = await clanPage.isClanPresent(clanName);
    expect(isClanPresent).toBeTruthy();
  }
});
```

#### New Architecture with Fallback

```typescript
test('Create clan - New Architecture', async ({ page }) => {
  // Generate test data using factory
  const clanData = TestDataFactory.createClan({
    name: `New Clan ${Date.now()}`,
    description: 'Test clan created with new architecture',
  });

  // Try new architecture first
  const result = await clanActions.createClan(clanData);

  if (result.success) {
    // New architecture succeeded
    expect(result.data?.clanId).toBeDefined();
    console.log(`✅ New architecture: Clan created with ID: ${result.data?.clanId}`);
  } else {
    // Fallback to legacy approach
    console.log(`⚠️ New architecture failed: ${result.error}. Using legacy fallback.`);

    const clanPage = new ClanPageV2(page);
    const createClanClicked = await clanPage.clickCreateClanButton();

    if (createClanClicked) {
      await clanPage.createNewClan(clanData.name);
      const isClanPresent = await clanPage.isClanPresent(clanData.name);
      expect(isClanPresent).toBeTruthy();
    }
  }
});
```

### 2. Channel Creation Migration

#### Legacy Approach

```typescript
test('Create channel - Legacy', async ({ page }) => {
  const channelName = `test-channel-${Date.now()}`;
  const categoryPage = new CategoryPage(page);

  await categoryPage.createCategory(channelName, 'private');
  const isCreated = await categoryPage.isCategoryPresent(channelName);
  expect(isCreated).toBeTruthy();
});
```

#### New Architecture with Fallback

```typescript
test('Create channel - New Architecture', async ({ page }) => {
  // Generate channel data using factory
  const channelData = TestDataFactory.createChannel({
    name: `test-channel-${Date.now()}`,
    type: 'text',
    description: 'Private channel for testing',
    isPrivate: true,
  });

  // Try new architecture first
  const result = await clanActions.createChannel(channelData);

  if (result.success) {
    // New architecture succeeded
    expect(result.data?.channelId).toBeDefined();
    console.log(`✅ New architecture: Channel created with ID: ${result.data?.channelId}`);
  } else {
    // Fallback to legacy approach
    console.log(`⚠️ New architecture failed: ${result.error}. Using legacy fallback.`);

    const categoryPage = new CategoryPage(page);
    await categoryPage.createCategory(
      channelData.name,
      channelData.isPrivate ? 'private' : 'public'
    );

    const isCreated = await categoryPage.isCategoryPresent(channelData.name);
    expect(isCreated).toBeTruthy();
  }
});
```

### 3. Complex Workflow Migration

#### Legacy Approach

```typescript
test('Complex setup - Legacy', async ({ page }) => {
  const clanPage = new ClanPageV2(page);
  const categoryPage = new CategoryPage(page);

  // Create clan
  await clanPage.clickCreateClanButton();
  await clanPage.createNewClan('Test Clan');

  // Create channels manually
  await categoryPage.createCategory('general', 'public');
  await categoryPage.createCategory('private-chat', 'private');

  // Send message manually
  // ... manual steps
});
```

#### New Architecture

```typescript
test('Complex setup - New Architecture', async ({ page }) => {
  // Use factory for complete scenario
  const scenario = TestDataFactory.createCompleteClanScenario();

  // Single service call handles everything
  const result = await clanManagementService.setupNewClan(
    scenario.clan,
    scenario.channels,
    'Welcome to our new clan! 🎉'
  );

  if (result.success) {
    expect(result.data?.clanId).toBeDefined();
    expect(result.data?.channelIds).toBeDefined();
    expect(result.data?.channelIds.length).toBeGreaterThan(0);

    console.log(
      `✅ Complex setup completed: ${scenario.clan.name} with ${result.data?.channelIds.length} channels`
    );
  } else {
    throw new Error(`Complex setup failed: ${result.error}`);
  }
});
```

---

## 📊 Legacy vs New Comparison

| Aspect              | Legacy Approach          | New Architecture                |
| ------------------- | ------------------------ | ------------------------------- |
| **Test Data**       | Manual string generation | Factory pattern with types      |
| **Error Handling**  | Boolean returns          | Rich result objects with errors |
| **Business Logic**  | Mixed in page objects    | Separate service layer          |
| **UI Interactions** | Direct page object calls | Action layer abstraction        |
| **Validation**      | Manual checks            | Built-in validation             |
| **Maintainability** | Low (scattered logic)    | High (separated concerns)       |
| **Testability**     | Medium                   | High (mockable services)        |
| **Type Safety**     | Basic                    | Strong typing throughout        |

### Error Handling Comparison

#### Legacy

```typescript
const isCreated = await clanPage.isClanPresent(clanName);
if (!isCreated) {
  // What went wrong? Unknown
  throw new Error('Clan creation failed');
}
```

#### New Architecture

```typescript
const result = await clanActions.createClan(clanData);
if (!result.success) {
  // Detailed error information available
  console.log(`Creation failed: ${result.error}`);
  console.log(`Error code: ${result.errorCode}`);
  console.log(`Context: ${JSON.stringify(result.context)}`);
}
```

---

## 🧪 Testing Strategy

### Phase 1: Parallel Testing

```typescript
test.describe('Migration Testing', () => {
  test('Clan creation - Both approaches', async ({ page }) => {
    const testData = TestDataFactory.createClan();

    // Test new architecture
    const newResult = await clanActions.createClan(testData);

    // Test legacy architecture
    const legacyPage = new ClanPageV2(page);
    const legacyClicked = await legacyPage.clickCreateClanButton();

    // Compare results
    expect(newResult.success || legacyClicked).toBeTruthy();
  });
});
```

### Phase 2: Feature Flags

```typescript
const USE_NEW_ARCHITECTURE = process.env.USE_NEW_ARCH === 'true';

test('Clan creation - Feature flag', async ({ page }) => {
  if (USE_NEW_ARCHITECTURE) {
    const result = await clanActions.createClan(testData);
    expect(result.success).toBeTruthy();
  } else {
    const clanPage = new ClanPageV2(page);
    // Legacy implementation
  }
});
```

### Phase 3: Gradual Rollout

```typescript
test.describe('Clan Management', () => {
  const MIGRATION_PERCENTAGE = 50; // 50% of tests use new architecture

  test('Create clan', async ({ page }) => {
    const useNewArch = Math.random() * 100 < MIGRATION_PERCENTAGE;

    if (useNewArch) {
      // New architecture
      const result = await clanActions.createClan(testData);
      if (!result.success) {
        // Fallback to legacy
        await legacyCreateClan(page, testData);
      }
    } else {
      // Legacy architecture
      await legacyCreateClan(page, testData);
    }
  });
});
```

---

## 🔄 Migration Checklist

### Pre-Migration

- [ ] Review current test coverage
- [ ] Identify critical test cases
- [ ] Set up feature flags
- [ ] Create rollback plan

### During Migration

- [ ] Update imports gradually
- [ ] Implement new architecture with legacy fallback
- [ ] Add comprehensive logging
- [ ] Monitor test stability

### Post-Migration

- [ ] Verify all tests pass
- [ ] Remove legacy code gradually
- [ ] Update documentation
- [ ] Train team on new patterns

---

## 🚨 Rollback Plan

### Immediate Rollback

```typescript
// In case of critical issues, disable new architecture immediately
const FORCE_LEGACY_MODE = true;

test.beforeEach(async ({ page }) => {
  if (FORCE_LEGACY_MODE) {
    // Skip new architecture initialization
    console.log('🚨 LEGACY MODE FORCED - Using legacy architecture only');
    return;
  }

  // Normal initialization with new architecture
});
```

### Gradual Rollback

```typescript
// Reduce adoption percentage gradually
const NEW_ARCH_ADOPTION = process.env.NEW_ARCH_PERCENTAGE || '0'; // Start with 0%

test('Clan creation', async ({ page }) => {
  const adoptionRate = parseInt(NEW_ARCH_ADOPTION);
  const useNewArch = Math.random() * 100 < adoptionRate;

  if (useNewArch) {
    // Try new architecture
  } else {
    // Use legacy
  }
});
```

---

## 📚 Additional Resources

### Type Definitions

```typescript
// Result pattern for better error handling
interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  context?: Record<string, any>;
}

// Clan creation data structure
interface ClanCreationData {
  name: string;
  description?: string;
  isPrivate?: boolean;
  tags?: string[];
}

// Channel creation data structure
interface ChannelCreationData {
  name: string;
  type: 'text' | 'voice' | 'stream';
  description?: string;
  isPrivate?: boolean;
  categoryId?: string;
}
```

### Factory Usage Examples

```typescript
// Basic clan
const basicClan = TestDataFactory.createClan();

// Gaming clan with specific attributes
const gamingClan = TestDataFactory.createGamingClan();

// Workspace clan
const workspaceClan = TestDataFactory.createWorkspaceClan();

// Custom clan
const customClan = TestDataFactory.createClan({
  name: 'My Custom Clan',
  description: 'A clan for special testing',
  isPrivate: true,
  tags: ['gaming', 'competitive'],
});

// Complete scenario
const scenario = TestDataFactory.createCompleteClanScenario();
```

---

## 🎯 Best Practices

1. **Always use factories** for test data generation
2. **Implement fallback mechanisms** during migration
3. **Add comprehensive logging** for debugging
4. **Use feature flags** for gradual rollout
5. **Monitor test stability** throughout migration
6. **Keep legacy code** until new architecture is proven stable
7. **Document breaking changes** clearly
8. **Provide training** for team members

---

## 📞 Support

For questions or issues during migration:

- Check existing test logs for error patterns
- Review factory configurations
- Verify selector mappings
- Test with feature flags disabled
- Contact the QA team for assistance

---

**Last Updated:** August 30, 2025
**Migration Status:** In Progress
**Next Review:** September 15, 2025
