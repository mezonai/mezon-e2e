import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment Configuration
 * Centralized configuration for different environments
 */
export interface EnvironmentConfig {
  baseURL: string;
  timeout: {
    default: number;
    navigation: number;
    action: number;
  };
  browser: {
    headless: boolean;
    slowMo: number;
  };
  screenshots: {
    mode: 'off' | 'only-on-failure' | 'on';
    path: string;
  };
  video: {
    mode: 'off' | 'on' | 'retain-on-failure' | 'on-first-retry';
    path: string;
  };
  trace: {
    mode: 'off' | 'on' | 'retain-on-failure' | 'on-first-retry';
    path: string;
  };
  retries: number;
  workers: number;
}

/**
 * Website configurations for different test targets
 */
export const WEBSITE_CONFIGS = {
  MEZON: {
    baseURL: 'https://dev-mezon.nccsoft.vn',
    name: 'Mezon Development',
  },
} as const;

/**
 * Session configurations for localStorage
 */
export const SESSION_CONFIGS = {
  MEZON_SESSION: {
    host: process.env.MEZON_SESSION_HOST || 'dev-mezon.nccsoft.vn',
    port: process.env.MEZON_SESSION_PORT || '7305',
    ssl: process.env.MEZON_SESSION_SSL !== 'false' || true,
  },
} as const;

/**
 * Get environment configuration based on NODE_ENV
 */
function getEnvironmentConfig(): EnvironmentConfig {
  const env = process.env.NODE_ENV || 'development';
  const website = process.env.WEBSITE || 'MEZON';
  const websiteConfig = WEBSITE_CONFIGS[website as keyof typeof WEBSITE_CONFIGS] || WEBSITE_CONFIGS.MEZON;
  
  const baseConfig: EnvironmentConfig = {
    baseURL: process.env.BASE_URL || websiteConfig.baseURL,
    timeout: {
      default: parseInt(process.env.DEFAULT_TIMEOUT || '30000'),
      navigation: parseInt(process.env.NAVIGATION_TIMEOUT || '30000'),
      action: parseInt(process.env.ACTION_TIMEOUT || '10000'),
    },
    browser: {
      headless: process.env.HEADLESS !== 'false',
      slowMo: parseInt(process.env.SLOW_MO || '0'),
    },
    screenshots: {
      mode: (process.env.SCREENSHOT_MODE as any) || 'only-on-failure',
      path: process.env.SCREENSHOT_PATH || 'test-results/screenshots',
    },
    video: {
      mode: (process.env.VIDEO_MODE as any) || 'retain-on-failure',
      path: process.env.VIDEO_PATH || 'test-results/videos',
    },
    trace: {
      mode: (process.env.TRACE_MODE as any) || 'on-first-retry',
      path: process.env.TRACE_PATH || 'test-results/traces',
    },
    retries: parseInt(process.env.RETRIES || (process.env.CI ? '2' : '0')),
    workers: parseInt(process.env.WORKERS || (process.env.CI ? '1' : '4')),
  };

  // Environment-specific overrides
  switch (env) {
    case 'production':
      return {
        ...baseConfig,
        baseURL: process.env.BASE_URL || websiteConfig.baseURL,
        browser: {
          ...baseConfig.browser,
          headless: true,
          slowMo: 0,
        },
        retries: 3,
        workers: 2,
      };

    case 'staging':
      return {
        ...baseConfig,
        baseURL: process.env.BASE_URL || websiteConfig.baseURL,
        retries: 2,
        workers: 2,
      };

    case 'test':
    case 'ci':
      return {
        ...baseConfig,
        browser: {
          ...baseConfig.browser,
          headless: true,
          slowMo: 0,
        },
        screenshots: {
          ...baseConfig.screenshots,
          mode: 'on',
        },
        video: {
          ...baseConfig.video,
          mode: 'on',
        },
        retries: 2,
        workers: 1,
      };

    case 'development':
    default:
      return {
        ...baseConfig,
        browser: {
          ...baseConfig.browser,
          headless: false,
          slowMo: 100,
        },
        retries: 0,
        workers: 4,
      };
  }
}

// Export the current environment configuration
export const ENV_CONFIG = getEnvironmentConfig();

/**
 * Utility functions for environment checks
 */
export const isProduction = () => process.env.NODE_ENV === 'production';
export const isStaging = () => process.env.NODE_ENV === 'staging';
export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isCI = () => !!process.env.CI;
export const isDebugMode = () => process.env.DEBUG === 'true';

/**
 * Browser configuration helper
 */
export const getBrowserConfig = () => ({
  headless: ENV_CONFIG.browser.headless,
  slowMo: ENV_CONFIG.browser.slowMo,
  args: isCI() ? ['--disable-dev-shm-usage', '--no-sandbox'] : [],
});

/**
 * Test configuration helper
 */
export const getTestConfig = () => ({
  timeout: ENV_CONFIG.timeout.default,
  retries: ENV_CONFIG.retries,
  workers: ENV_CONFIG.workers,
  use: {
    baseURL: ENV_CONFIG.baseURL,
    actionTimeout: ENV_CONFIG.timeout.action,
    navigationTimeout: ENV_CONFIG.timeout.navigation,
    screenshot: ENV_CONFIG.screenshots.mode,
    video: ENV_CONFIG.video.mode,
    trace: ENV_CONFIG.trace.mode,
  },
});

/**
 * Logging configuration
 */
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

export const getLogLevel = (): number => {
  const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
  return LOG_LEVELS[level as keyof typeof LOG_LEVELS] ?? LOG_LEVELS.INFO;
};