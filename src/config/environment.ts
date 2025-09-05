import dotenv from 'dotenv';
dotenv.config();

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

const persistentConfig = {
  loadingStatus: '"loaded"',
  session:
    '{"1958389436492288000":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJmMTU1NDU2ZC03MDRjLTRlYjUtOWM2MS0zODczOGFhODE0MTYiLCJ1aWQiOjE5NTgzODk0MzY0OTIyODgwMDAsInVzbiI6InRka2llbi45OS52biIsImV4cCI6MTc1Njk2Njg5MH0.5m7o0S9d-eRou2hUVYszA-8SlGRWZ_etDHXiqPqcFFE","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJmMTU1NDU2ZC03MDRjLTRlYjUtOWM2MS0zODczOGFhODE0MTYiLCJ1aWQiOjE5NTgzODk0MzY0OTIyODgwMDAsInVzbiI6InRka2llbi45OS52biIsImV4cCI6MTc1NzQ4NTI5MH0.JUGfgLhnCdfD3rduFGCumpO0WUhmGZ9921IIJvMt4kE","created_at":1756880490,"is_remember":false,"refresh_expires_at":1757485290,"expires_at":1756966890,"username":"tdkien.99.vn","user_id":1958389436492288000}}',
  isLogin: 'true',
  isRegistering: '"not loaded"',
  loadingStatusEmail: '"not loaded"',
  redirectUrl: 'null',
  activeAccount: '"1958389436492288000"',
  _persist: '{"version":-1,"rehydrated":true}',
};
export const GLOBAL_CONFIG = {
  LOCAL_BASE_URL: process.env.BASE_URL || '',
  DEV_BASE_URL: process.env.DEV_BASE_URL,
  API_URL: process.env.API_URL,
  SKIP_LOGIN: process.env.SKIP_LOGIN === 'true',
} as const;

export const WEBSITE_CONFIGS = {
  MEZON: {
    baseURL: process.env.BASE_URL,
    name: 'Mezon Development',
  },
} as const;

export const SESSION_CONFIGS = {
  MEZON_SESSION: {
    host: process.env.MEZON_SESSION_HOST || 'dev-mezon.nccsoft.vn',
    port: process.env.MEZON_SESSION_PORT || '7305',
    ssl: process.env.MEZON_SESSION_SSL !== 'false' || true,
  },
} as const;

export const getSessionConfig = () => {
  return {
    host: process.env.MEZON_SESSION_HOST || 'dev-mezon.nccsoft.vn',
    port: process.env.MEZON_SESSION_PORT || '7305',
    ssl: true,
  };
};

export const LOCAL_CONFIG = {
  isLocal: process.env.NODE_ENV === 'development',
  skipLogin: process.env.SKIP_LOGIN === 'true' || process.env.NODE_ENV === 'development',
} as const;

export const LOCAL_AUTH_DATA = {
  persist: {
    key: 'persist:auth',
    value: persistentConfig,
  },
  mezonSession: {
    key: 'mezon_session',
    value: JSON.stringify(getSessionConfig()),
  },
} as const;

function getEnvironmentConfig(): EnvironmentConfig {
  const env = process.env.NODE_ENV || 'development';
  const website = process.env.WEBSITE || 'MEZON';
  const websiteConfig =
    WEBSITE_CONFIGS[website as keyof typeof WEBSITE_CONFIGS] || WEBSITE_CONFIGS.MEZON;

  const baseConfig: EnvironmentConfig = {
    baseURL: (process.env.BASE_URL || websiteConfig.baseURL) as string,
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
        baseURL: (process.env.BASE_URL || websiteConfig.baseURL) as string,
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
        baseURL: (process.env.BASE_URL || websiteConfig.baseURL) as string,
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

export const ENV_CONFIG = getEnvironmentConfig();

export const isProduction = () => process.env.NODE_ENV === 'production';
export const isCI = () => !!process.env.CI;

export const getBrowserConfig = () => ({
  headless: ENV_CONFIG.browser.headless,
  slowMo: ENV_CONFIG.browser.slowMo,
  args: isCI()
    ? ['--disable-dev-shm-usage', '--no-sandbox']
    : [
        '--disable-clipboard-read-write',
        '--disable-permissions-api',
        '--disable-features=ClipboardReadWrite',
        '--disable-clipboard-sanitization',
      ],
});

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
