import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    timeout: 30 * 1000,
    expect: {
        timeout: 5 * 1000,
    },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,

    reporter: [
        ['html'],
        ['@mezon/playwright-reporter'], // Add Mezon reporter
    ],

    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
    },

    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome']
            },
        },
    ],
});

// Environment variables to configure:
// MEZON_WEBHOOK_URL=https://webhook.mezon.ai/webhooks/your-webhook-url
// MEZON_NOTIFICATIONS=true
// MEZON_MENTION_USER_ID=your-user-id (optional)
// NODE_ENV=production (optional)
