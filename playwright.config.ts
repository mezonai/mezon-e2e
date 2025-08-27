import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { OrtoniReportConfig } from 'ortoni-report';
import type { GitHubActionOptions } from '@estruyf/github-actions-reporter';
import dotenv from 'dotenv';
import { getBrowserConfig } from './src/config/environment';
dotenv.config();

const workers = parseInt(process.env.WORKERS || '1', 10) || 1;
const reportConfig: OrtoniReportConfig = {
  logo: '',
  open: process.env.CI ? 'never' : 'always',
  folderPath: 'ortoni-reports',
  filename: 'index.html',
  title: 'Mezon Automation Test Report',
  showProject: true,
  projectName: 'Mezon-Automation',
  testType: 'e2e',
  authorName: 'mezoner',
  base64Image: false,
  stdIO: false,
  preferredTheme: 'light',
  chartType: 'doughnut',
  meta: {
    project: 'Mezon Automation',
    version: '1.0.0',
    description: 'Playwright E2E test report for Mezon platform',
    testCycle: 'Main',
    release: '1.0.0',
    environment: process.env.BASE_URL as string,
  },
};

export default defineConfig({
  testDir: './src/tests',
  // testIgnore: ['**/*.auth.spec.ts', '**/homepage.spec.ts'],
  timeout: 300 * 1000,

  expect: {
    timeout: 10 * 1000,
  },

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  fullyParallel: true,
  workers,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'results.json' }],
    ['ortoni-report', reportConfig],
    [
      '@estruyf/github-actions-reporter',
      <GitHubActionOptions>{
        title: 'Mezon Automation Test Results',
        useDetails: true,
        showError: true,
        showTags: true,
        showAnnotations: true,
        includeResults: ['pass', 'skipped', 'fail', 'flaky'],
        showArtifactsLink: true,
      },
    ],
  ],

  // Global setup and teardown - disabled to let auth.setup.ts handle auth
  // globalSetup: './src/config/global.setup.ts',
  // globalTeardown: './src/config/global.teardown.ts',
  outputDir: 'test-results/',

  use: {
    baseURL: process.env.BASE_URL as string,
    trace: process.env.CI ? 'retain-on-failure' : 'on',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      testDir: './src/tests',
      use: {
        ...devices['Desktop Chrome'],
        ...getBrowserConfig(),
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      testDir: './src/tests',
      use: {
        ...devices['Desktop Chrome'],
        ...getBrowserConfig(),
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      timeout: 60 * 1000, // 1 minute for setup
    },

    {
      name: 'chromium-no-bdd',
      testDir: './src/tests',
      testIgnore: [/dual-users-.*\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        ...getBrowserConfig(),
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'chromium-dual-user',
      testDir: './src/tests',
      testMatch: /dual-users-.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: undefined,
      },
    },

    // BDD Tests - Login flow (NO AUTH)
    {
      name: 'chromium-bdd-login',
      testDir: defineBddConfig({
        features: 'src/features/userLogin.feature',
        steps: ['src/features/steps/*.ts', 'src/fixtures/page.fixture.ts'],
        outputDir: '.features-gen/login',
      }),
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // NO storageState - fresh browser for login tests
      },
    },

    // BDD Tests - No Auth Required (homepage, simple)
    {
      name: 'chromium-bdd-no-auth',
      testDir: defineBddConfig({
        features: ['src/features/homepage.feature', 'src/features/simple.feature'],
        steps: ['src/features/steps/*.ts', 'src/fixtures/page.fixture.ts'],
        outputDir: '.features-gen/no-auth',
      }),
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // NO storageState for fresh browser
      },
    },

    // BDD Tests - Auth Required features
    {
      name: 'chromium-bdd-auth',
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
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Use prepared auth state
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: 'playwright/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },

    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     storageState: 'playwright/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },

    // Mobile browsers
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //     storageState: 'playwright/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },

    // {
    //   name: 'Mobile Safari',
    //   use: {
    //     ...devices['iPhone 12'],
    //     storageState: 'playwright/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },

    // Microsoft Edge
    // {
    //   name: 'Microsoft Edge',
    //   use: {
    //     ...devices['Desktop Edge'],
    //     channel: 'msedge',
    //     storageState: 'playwright/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },
  ],

  // Development server (if needed)
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
