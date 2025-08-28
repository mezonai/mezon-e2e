# Allure Reporting Setup for Mezon E2E Tests

This document describes the Allure reporting integration for the Mezon E2E test suite, including setup, configuration, and usage guidelines.

## Overview

Allure reporting has been integrated to provide:

- **Rich Test Reports**: Detailed test execution reports with steps, screenshots, and attachments
- **Parameterized Testing**: Support for data-driven tests with unique identifiers
- **History Tracking**: Test execution history across multiple runs
- **Categorization**: Organized test results by Epic, Feature, Story, and Severity
- **CI/CD Integration**: Automated report generation and history preservation

## Quick Start

### 1. Run Tests with Allure Reporting

```bash
# Run all tests (Allure results will be generated automatically)
npm run test

# Run specific test categories
npm run test:smoke
npm run test:regression
npm run test:bdd
```

### 2. Generate and View Allure Report

```bash
# Generate static report
npm run allure:generate

# Serve report with live server
npm run allure:serve

# Open existing report
npm run allure:open
```

### 3. Clean Up

```bash
# Clean all Allure artifacts
npm run allure:clean

# Clean general test artifacts
npm run clean
```

## Project Structure

```
src/
├── config/
│   └── allure.config.ts          # Allure configuration and constants
├── utils/
│   └── allureHelpers.ts          # Allure reporting utilities
├── data/
│   └── TestDataFactory.ts       # Test data generation for parameterized tests
├── tests/
│   ├── e2e/
│   │   ├── direct-message.spec.ts         # Updated with Allure integration
│   │   ├── clan-creation-management.spec.ts # Updated with Allure integration
│   │   └── parameterized-chat.spec.ts     # Example parameterized tests
└── ...

allure-results/                   # Generated test results (JSON files)
├── executor.json                 # CI/CD execution context
├── environment.properties        # Test environment information
└── categories.json              # Test failure categorization

allure-report/                    # Generated HTML reports
└── history/                     # Historical data for trend analysis
```

## Key Features

### 1. Test Parameterization

Tests can be parameterized with different data sets while maintaining unique identifiers for history tracking:

```typescript
// Example: Test with different user roles
const testUsers = TestDataFactory.getTestUsers();

for (const user of testUsers) {
  test(`Chat access verification for ${user.role} user`, async ({ page }) => {
    await TestDataFactory.setupParameterizedTest(
      'chat_access_verification',
      {
        userRole: user.role,
        userType: user.role,
        testUser: user.username,
      },
      {
        epic: 'User Management',
        feature: 'Role-Based Access',
        severity: 'critical',
      }
    );
    // Test implementation...
  });
}
```

### 2. Rich Test Metadata

Each test automatically includes:

- **Environment Parameters**: Browser, OS, viewport, etc. (excluded from history)
- **Test Parameters**: User type, test scenario, data set, etc. (included in history)
- **Labels**: Epic, Feature, Story, Owner, Tags
- **Links**: JIRA issues, Test Rail cases, documentation
- **Severity**: Blocker, Critical, Normal, Minor, Trivial

### 3. Step-by-Step Execution

Tests are broken down into logical steps with timing and attachments:

```typescript
await AllureReporter.step('Navigate to chat interface', async () => {
  await homePage.navigate();
});

await AllureReporter.step('Send message', async () => {
  await messagePage.sendMessage(messageContent);
  await AllureReporter.attachScreenshot(page, 'Message Sent');
});
```

### 4. Automatic Screenshots and Attachments

- Screenshots are automatically attached on failures
- Manual screenshots can be added at any point
- Video recordings and trace files are attached when available
- Test artifacts are properly organized

### 5. History Tracking

- Test results are linked across multiple runs using unique identifiers
- Trend graphs show test stability over time
- History is preserved automatically in CI/CD pipelines
- Failed tests can be tracked to identify patterns

## Configuration

### Playwright Configuration

The Allure reporter is configured in `playwright.config.ts`:

```typescript
reporter: [
  ['list'],
  ['html', { open: 'never' }],
  ['json', { outputFile: 'results.json' }],
  [
    'allure-playwright',
    {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: true,
      environmentInfo: {
        framework: 'Playwright',
        language: 'TypeScript',
        // ... other environment details
      },
    },
  ],
],
```

### Test Organization

Tests are organized using a hierarchical structure:

- **Epic**: High-level business functionality (e.g., "Chat Platform")
- **Feature**: Specific feature areas (e.g., "Direct Messaging")
- **Story**: User stories or scenarios (e.g., "Text Messaging")
- **Severity**: Business impact (Blocker, Critical, Normal, Minor, Trivial)

### Environment Configuration

Environment details are automatically captured and can be customized in:

- `allure-results/environment.properties`
- Playwright configuration environment settings
- Test-specific environment parameters

## Writing Tests with Allure

### Basic Test Setup

```typescript
import { test, expect } from '@playwright/test';
import { AllureReporter } from '@/utils/allureHelpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await AllureReporter.initializeTest(page, testInfo, {
      epic: 'Your Epic',
      feature: 'Your Feature',
      story: 'Your Story',
      severity: 'critical',
      testType: 'e2e',
      userType: 'authenticated',
    });

    await AllureReporter.addDescription('Test description...');
  });

  test('Test name', async ({ page }) => {
    await AllureReporter.step('Step description', async () => {
      // Test implementation
    });
  });
});
```

### Parameterized Tests

```typescript
const testData = [
  { scenario: 'scenario1', param1: 'value1', param2: 'value2' },
  { scenario: 'scenario2', param1: 'value3', param2: 'value4' },
];

for (const data of testData) {
  test(`Test with ${data.scenario}`, async ({ page }) => {
    await TestDataFactory.setupParameterizedTest('test_name', {
      scenario: data.scenario,
      param1: data.param1,
      param2: data.param2,
    });
    // Test implementation...
  });
}
```

### Adding Custom Metadata

```typescript
// Add test parameters
await AllureReporter.addParameter('customParam', 'value');

// Add links
await AllureReporter.addLinks({
  jira: 'JIRA-123',
  documentation: 'https://docs.example.com',
});

// Add labels
await AllureReporter.addLabels({
  tag: ['smoke', 'regression'],
  owner: 'QA Team',
});

// Attach screenshots
await AllureReporter.attachScreenshot(page, 'Custom Screenshot');
```

## Best Practices

### 1. Test Organization

- Use consistent Epic/Feature/Story hierarchy
- Group related tests in describe blocks
- Use meaningful test names that describe the scenario

### 2. Parameterization

- Use parameters for data that affects test behavior
- Exclude environment-specific parameters from history comparison
- Include test-specific parameters in history comparison

### 3. Steps and Documentation

- Break tests into logical steps
- Add descriptions for complex test scenarios
- Attach screenshots at key validation points

### 4. Error Handling

- Use appropriate severity levels
- Add context through parameters when tests fail
- Attach debugging artifacts (screenshots, logs, traces)

### 5. History Management

- Use consistent test identifiers across runs
- Exclude volatile parameters (timestamps, random values)
- Include stable parameters that define test variants

## Troubleshooting

### Common Issues

1. **Missing Test Results**: Ensure tests are running with the Allure reporter enabled
2. **History Not Working**: Check that history files are being preserved between runs
3. **Screenshots Not Attached**: Verify page object is available and accessible
4. **Categorization Issues**: Review categories.json configuration

### Debug Commands

```bash
# Check Allure installation
allure --version

# Validate test results
ls -la allure-results/

# Check report generation
npm run allure:generate -- --verbose

# View Allure logs
npm run allure:serve -- --verbose
```

### Log Locations

- Test execution logs: Console output during test runs
- Allure generation logs: Output from `allure generate` command
- Report server logs: Output from `allure serve` command

## NPM Scripts Reference

| Script                    | Description                               |
| ------------------------- | ----------------------------------------- |
| `npm run allure:generate` | Generate static HTML report               |
| `npm run allure:serve`    | Start live report server                  |
| `npm run allure:open`     | Open existing report                      |
| `npm run allure:clean`    | Clean all Allure artifacts                |
| `npm run allure:history`  | Generate report with history preservation |

## Integration with Existing Workflow

The Allure integration is designed to work seamlessly with your existing test workflow:

1. **No Changes Required**: Existing tests work without modification
2. **Gradual Migration**: Tests can be enhanced with Allure features incrementally
3. **Backward Compatibility**: All existing reports (Playwright HTML, JSON) continue to work
4. **CI/CD Ready**: GitHub Actions workflow includes Allure report generation and history

## Next Steps

1. **Enhance Existing Tests**: Add Allure metadata to existing test files
2. **Create Parameterized Tests**: Use TestDataFactory for data-driven testing
3. **Customize Categories**: Modify categories.json for your failure patterns
4. **Set Up CI/CD**: Configure automated report deployment and history preservation

For more information about Allure features, visit the [official documentation](https://allurereport.org/docs/).
