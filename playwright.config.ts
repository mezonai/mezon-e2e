import type { GitHubActionOptions } from '@estruyf/github-actions-reporter';
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { ALLURE_LINK_TEMPLATES } from './src/config/allure.config';
import { getBrowserConfig, GLOBAL_CONFIG } from './src/config/environment';
dotenv.config();

const workers = parseInt(process.env.WORKERS || '1', 10) || 1;

export default defineConfig({
  testDir: './src/tests',
  grepInvert: /@dual/,
  timeout: 300 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  fullyParallel: false,
  workers,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['./libs/mezon-reporter/mezon-reporter.ts'],
    [
      'allure-playwright',
      {
        detail: true,
        outputFolder: 'allure-results',
        suiteTitle: false,
        links: ALLURE_LINK_TEMPLATES,
        environmentInfo: {
          framework: 'Playwright',
          language: 'TypeScript',
          node_version: process.version,
          test_environment: process.env.CI ? 'CI' : 'Local',
          base_url: process.env.BASE_URL || GLOBAL_CONFIG.LOCAL_BASE_URL,
          browser: 'Chromium',
          os: process.platform,
          workers: workers.toString(),
        },
      },
    ],
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
  projects: [
    {
      name: 'Chrome',
      testDir: './src/tests',
      testIgnore: [/dual-users-.*\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        ...getBrowserConfig(),
      },
      dependencies: ['setup'],
    },
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      timeout: 60 * 1000,
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
    {
      name: 'firefox',
      testDir: './src/tests',
      use: {
        ...devices['Desktop Firefox'],
        ...getBrowserConfig(),
      },
      dependencies: ['setup'],
    },
    // BDD Tests - Login flow (NO AUTH)
    // {
    //   name: 'chromium-bdd-login',
    //   testDir: defineBddConfig({
    //     features: 'src/features/userLogin.feature',
    //     steps: ['src/features/steps/*.ts', 'src/fixtures/page.fixture.ts'],
    //     outputDir: '.features-gen/login',
    //   }),
    //   use: {
    //     ...devices['Desktop Chrome'],
    //     viewport: { width: 1920, height: 1080 },
    //     // NO storageState - fresh browser for login tests
    //   },
    // },

    // BDD Tests - No Auth Required (homepage, simple)
    // {
    //   name: 'chromium-bdd-no-auth',
    //   testDir: defineBddConfig({
    //     features: ['src/features/homepage.feature', 'src/features/simple.feature'],
    //     steps: ['src/features/steps/*.ts', 'src/fixtures/page.fixture.ts'],
    //     outputDir: '.features-gen/no-auth',
    //   }),
    //   use: {
    //     ...devices['Desktop Chrome'],
    //     viewport: { width: 1920, height: 1080 },
    //     // NO storageState for fresh browser
    //   },
    // },

    // BDD Tests - Auth Required features
    // {
    //   name: 'chromium-bdd-auth',
    //   testDir: defineBddConfig({
    //     features: [
    //       'src/features/**/*.feature',
    //       '!src/features/userLogin.feature',
    //       '!src/features/homepage.feature',
    //       '!src/features/simple.feature',
    //     ],
    //     steps: ['src/features/steps/*.ts', 'src/fixtures/page.fixture.ts'],
    //     outputDir: '.features-gen/auth',
    //   }),
    //   use: {
    //     ...devices['Desktop Chrome'],
    //     viewport: { width: 1920, height: 1080 },
    //     // Use prepared auth state
    //   },
    //   dependencies: ['setup'],
    // },
  ],
});
