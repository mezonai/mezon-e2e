# BDD Setup and Re-enablement Guide

## 📋 Overview

This document contains instructions for re-enabling BDD (Behavior Driven Development) functionality in the Mezon E2E test framework. BDD scripts have been temporarily commented out to streamline the testing workflow, but all configurations and dependencies remain intact for future use.

## 🚀 Quick Re-enablement

To quickly re-enable BDD functionality:

1. **Restore BDD Scripts in `package.json`:**

   ```bash
   # Remove the underscore prefix from all _test:bdd* scripts
   # Remove the underscore prefix from _bddgen and _watch:bdd scripts
   # Update the main "test" script back to "npm run test:all"
   ```

2. **Verify BDD Dependencies:**

   ```bash
   npm list playwright-bdd
   # Should show: playwright-bdd@8.3.1
   ```

3. **Test BDD Setup:**
   ```bash
   npm run bddgen  # Generate BDD test files
   npm run test:bdd  # Run BDD tests
   ```

## 📦 Currently Commented BDD Scripts

The following scripts are temporarily disabled (prefixed with `_`):

### Core BDD Scripts

- `_test:bdd` - Run all BDD tests
- `_test:all` - Run both E2E and BDD tests
- `_bddgen` - Generate BDD test files from feature files
- `_watch:bdd` - Watch and auto-regenerate BDD files

### BDD Test Execution

- `_test:bdd:headed` - Run BDD tests in headed mode
- `_test:bdd:debug` - Run BDD tests in debug mode
- `_test:bdd:ui` - Run BDD tests with UI mode
- `_test:bdd:login` - Run BDD login tests only
- `_test:bdd:user` - Run BDD tests tagged with @user

## 🔧 Current Active Scripts

The following scripts remain active for E2E testing:

```json
{
  "test": "npm run test:e2e",
  "test:e2e": "npx playwright test --project chromium-no-bdd",
  "test:e2e:headed": "npx playwright test --project chromium-no-bdd --headed",
  "test:e2e:debug": "npx playwright test --project chromium-no-bdd --debug",
  "test:e2e:ui": "npx playwright test --project chromium-no-bdd --ui"
}
```

## 📁 BDD File Structure

BDD-related files are preserved in the project:

```
src/
├── features/           # Gherkin feature files
│   ├── homepage.feature
│   ├── simple.feature
│   └── userLogin.feature
├── steps/              # Step definition files
│   └── *.ts files
└── fixtures/
    └── page.fixture.ts
```

## ⚙️ Playwright Configuration for BDD

BDD projects are still configured in `playwright.config.ts`:

```typescript
// BDD Projects (currently configured but not actively used)
{
  name: 'chromium-bdd-login',
  use: { ...devices['Desktop Chrome'] },
  testDir: defineBddConfig({
    features: 'src/features/userLogin.feature',
    steps: ['src/features/steps/*.ts', 'src/fixtures/page.fixture.ts'],
    outputDir: '.features-gen/login',
  }),
  dependencies: ['setup'],
},
{
  name: 'chromium-bdd-no-auth',
  use: { ...devices['Desktop Chrome'] },
  testDir: defineBddConfig({
    features: ['src/features/homepage.feature', 'src/features/simple.feature'],
    steps: ['src/features/steps/*.ts', 'src/fixtures/page.fixture.ts'],
    outputDir: '.features-gen/no-auth',
  }),
},
{
  name: 'chromium-bdd-auth',
  use: { ...devices['Desktop Chrome'], storageState: 'auth.json' },
  testDir: defineBddConfig({
    features: [
      'src/features/**/*.feature',
      '!src/features/userLogin.feature',
      '!src/features/homepage.feature',
      '!src/features/simple.feature',
    ],
    steps: ['src/features/steps/*.ts', 'src/fixtures/page.fixture.ts'],
    outputDir: '.features-gen/auth',
  }),
  dependencies: ['setup'],
}
```

## 🔄 Step-by-Step Re-enablement

### Step 1: Update package.json Scripts

Replace the commented scripts by removing the `_` prefix:

```bash
# Example: Change from
"_test:bdd": "npx bddgen && npx playwright test --project chromium-bdd-login..."

# To:
"test:bdd": "npx bddgen && npx playwright test --project chromium-bdd-login..."
```

### Step 2: Update Main Test Script

```json
{
  "test": "npm run test:all"
}
```

### Step 3: Verify BDD Generation

```bash
npm run bddgen
```

This should generate test files in:

- `.features-gen/login/`
- `.features-gen/no-auth/`
- `.features-gen/auth/`

### Step 4: Test BDD Projects

```bash
# Test individual BDD projects
npm run test:bdd:login
npm run test:bdd:no-auth  # (you'll need to restore this script)
npm run test:bdd:auth     # (you'll need to restore this script)

# Test all BDD
npm run test:bdd
```

## 🛠️ Dependencies

BDD functionality requires these packages (already installed):

```json
{
  "playwright-bdd": "^8.3.1",
  "nodemon": "^3.1.10"
}
```

## 📝 Additional BDD Scripts to Restore

When re-enabling, you may want to add these additional scripts:

```json
{
  "test:bdd:no-auth": "npx bddgen && npx playwright test --project chromium-bdd-no-auth",
  "test:bdd:auth": "npx bddgen && npx playwright test --project chromium-bdd-auth",
  "test:bdd:watch": "npm run watch:bdd",
  "test:all:headed": "npx bddgen && npx playwright test --headed"
}
```

## 🎯 Testing Strategy

When BDD is re-enabled, the testing strategy will be:

1. **E2E Tests** (`chromium-no-bdd`) - Direct TypeScript test files
2. **BDD Tests** (`chromium-bdd-*`) - Gherkin-based feature tests
3. **Dual User Tests** (`chromium-dual-user`) - Multi-user scenarios
4. **Setup Tests** (`setup`) - Authentication and environment setup

## 📊 Allure Reporting

BDD tests will integrate with Allure reporting just like E2E tests:

```bash
# Generate Allure report including BDD results
npm run allure:generate

# Serve Allure report
npm run allure:serve
```

## 🔍 Troubleshooting

### Common Issues When Re-enabling BDD:

1. **BDD Generation Fails:**

   ```bash
   npm run bddgen
   # Check for syntax errors in .feature files
   ```

2. **Missing Step Definitions:**

   ```bash
   # Ensure step definition files exist in src/features/steps/
   ```

3. **Import Errors:**
   ```bash
   # Verify that step definition imports are correct
   ```

## 📚 Resources

- [Playwright BDD Documentation](https://vitalets.github.io/playwright-bdd/)
- [Gherkin Syntax Reference](https://cucumber.io/docs/gherkin/reference/)
- [Cucumber Best Practices](https://cucumber.io/docs/guides/10-minute-tutorial/)

---

**Note:** This configuration preserves all BDD functionality while temporarily simplifying the development workflow. Re-enabling BDD is a matter of uncommenting scripts and running the generation command.
