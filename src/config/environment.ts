import { EnvironmentConfig } from '@/config/types';
import dotenv from 'dotenv';
dotenv.config();

// Multiple persistent auth configurations
export const persistentAuthConfigs = {
  account1: {
    loadingStatus: '"loaded"',
    session:
      '{"1964889885160509400":{"created":true,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI3YTFiYTE2NC0wNzJmLTRjZTUtODA2NS1mNmQ0MWZkOWIzYjQiLCJ1aWQiOjE5NjQ4ODk4ODUxNjA1MDk0NDAsInVzbiI6ImRhdC5oYXF1b2MrMDEiLCJleHAiOjE3NTczMDE4OTR9.GZWpmhHZhWSN5EjenwWAaE8lB8EoCY4gv2_wKBBJqvw","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI3YTFiYTE2NC0wNzJmLTRjZTUtODA2NS1mNmQ0MWZkOWIzYjQiLCJ1aWQiOjE5NjQ4ODk4ODUxNjA1MDk0NDAsInVzbiI6ImRhdC5oYXF1b2MrMDEiLCJleHAiOjE3NTc5MDYwOTR9.7MVxJxGNuIM-Rb0vGOcazVzYU6lhTixcjufqnV1wGU4","created_at":1757301294,"is_remember":false,"refresh_expires_at":1757906094,"expires_at":1757301894,"username":"dat.haquoc+01","user_id":1964889885160509400}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1964889885160509400"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  account2: {
    loadingStatus: '"loaded"',
    session:
      '{"1964890088861077500":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJjY2Y5YzgwOS02YzFlLTRhNzAtOWVjNy0xMGQ4YjBhZjdiZTEiLCJ1aWQiOjE5NjQ4OTAwODg4NjEwNzc1MDQsInVzbiI6ImRhdC5oYXF1b2MrMDIiLCJleHAiOjE3NTc3MzM1ODF9.W2fEA0gz8wLGzbUQ3o602bzjmDInh3m-BRS1tpk6Wkc","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJjY2Y5YzgwOS02YzFlLTRhNzAtOWVjNy0xMGQ4YjBhZjdiZTEiLCJ1aWQiOjE5NjQ4OTAwODg4NjEwNzc1MDQsInVzbiI6ImRhdC5oYXF1b2MrMDIiLCJleHAiOjE3NTgyNTE5ODF9.BnAU_kqlOi3iI9kmuEYA9PuyFR4A6SVEWHTwgci98Q8","created_at":1757647181,"is_remember":false,"refresh_expires_at":1758251981,"expires_at":1757733581,"username":"dat.haquoc+02","user_id":1964890088861077500}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1964890088861077500"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  account3: {
    loadingStatus: '"loaded"',
    session:
      '{"1964937944108109800":{"created":true,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJkNDdjM2VmZi1iNjZjLTQwMzctOGE4MC0xYjIyYzQ4MmE0YzIiLCJ1aWQiOjE5NjQ5Mzc5NDQxMDgxMDk4MjQsInVzbiI6ImRhdC5oYXF1b2MrMDMiLCJleHAiOjE3NTczMTMyOTF9.X2snBtzhSPkNDBRDzolw6ZJjRuGFzJm7w50UoS7SkSc","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJkNDdjM2VmZi1iNjZjLTQwMzctOGE4MC0xYjIyYzQ4MmE0YzIiLCJ1aWQiOjE5NjQ5Mzc5NDQxMDgxMDk4MjQsInVzbiI6ImRhdC5oYXF1b2MrMDMiLCJleHAiOjE3NTc5MTc0OTF9.BQB7IeathOuczBiZVpboAb5alVKagVzZA4kzN_B80ts","created_at":1757312691,"is_remember":false,"refresh_expires_at":1757917491,"expires_at":1757313291,"username":"dat.haquoc+03","user_id":1964937944108109800}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1964937944108109800"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  account4: {
    loadingStatus: '"loaded"',
    session:
      '{"1964952630786527200":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJiZWVhMjk1OS1iMDhhLTQzODktYTQyZS0zYmYyNzU2ZDk4NmMiLCJ1aWQiOjE5NjQ5NTI2MzA3ODY1MjcyMzIsInVzbiI6ImRhdC5oYXF1b2MrMDQiLCJleHAiOjE3NTc0MTEwOTB9.NX4QkLPaUk4cPhdjrK1RkHVbJk_l35VhQPh5nvTnSsM","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJiZWVhMjk1OS1iMDhhLTQzODktYTQyZS0zYmYyNzU2ZDk4NmMiLCJ1aWQiOjE5NjQ5NTI2MzA3ODY1MjcyMzIsInVzbiI6ImRhdC5oYXF1b2MrMDQiLCJleHAiOjE3NTgwMTUyOTB9.NiMgWU8OPhgkcw5WNzIleher7eqP_kbN5kkshcSbLsQ","created_at":1757410489,"is_remember":false,"refresh_expires_at":1758015290,"expires_at":1757411090,"username":"dat.haquoc+04","user_id":1964952630786527200}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1964952630786527200"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  account5: {
    loadingStatus: '"loaded"',
    session:
      '{"1964953116990247000":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJkYzdiMjI3Zi04YTFjLTRhOWQtYjRhMC1jNjIyMjQ5MTc0MjciLCJ1aWQiOjE5NjQ5NTMxMTY5OTAyNDY5MTIsInVzbiI6ImRhdC5oYXF1b2MrMDUiLCJleHAiOjE3NTc3MzMyNTV9.Hak8o5AaGAUPzIGN5W3rOfkxShrTmjIFHb9SfZCrjqc","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJkYzdiMjI3Zi04YTFjLTRhOWQtYjRhMC1jNjIyMjQ5MTc0MjciLCJ1aWQiOjE5NjQ5NTMxMTY5OTAyNDY5MTIsInVzbiI6ImRhdC5oYXF1b2MrMDUiLCJleHAiOjE3NTgyNTE2NTV9.inUtKhbDKkeP3rd0g-NrEvpCnoOXy81_7QcIBviocSg","created_at":1757646855,"is_remember":false,"refresh_expires_at":1758251655,"expires_at":1757733255,"username":"dat.haquoc+05","user_id":1964953116990247000}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1964953116990247000"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  account6: {
    loadingStatus: '"loaded"',
    session:
      '{"1964953606733959200":{"created":true,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJjNWE5Y2FmMy1iNzllLTQ0ODQtYjY1NS00NWMxMDllMDVkNTciLCJ1aWQiOjE5NjQ5NTM2MDY3MzM5NTkxNjgsInVzbiI6ImRhdC5oYXF1b2MrMDYiLCJleHAiOjE3NTc0MDI4MjF9.2oNydWQKkJ_YpKr-RA52KftdiIiWQPBiIjbaFzRCuOU","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJjNWE5Y2FmMy1iNzllLTQ0ODQtYjY1NS00NWMxMDllMDVkNTciLCJ1aWQiOjE5NjQ5NTM2MDY3MzM5NTkxNjgsInVzbiI6ImRhdC5oYXF1b2MrMDYiLCJleHAiOjE3NTc5MjEyMjF9.vbMHHfwaKOYWA-rLllS8rwOFPjLNEDZqP9Vpf4GzuVQ","created_at":1757316421,"is_remember":false,"refresh_expires_at":1757921221,"expires_at":1757402821,"username":"dat.haquoc+06","user_id":1964953606733959200}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1964953606733959200"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
};

// Backward compatibility - keeping original persistentConfig
const persistentConfig = persistentAuthConfigs.account1;

// Function to get auth config by account key
export const getAuthConfig = (accountKey: keyof typeof persistentAuthConfigs) => {
  return persistentAuthConfigs[accountKey] || persistentAuthConfigs.account1;
};

// Function to get auth config by suite name
export const getAuthConfigBySuite = (suiteName: string) => {
  const suiteToAccountMap: Record<string, keyof typeof persistentAuthConfigs> = {
    'Channel Management': 'account1',
    'Channel Message': 'account2',
    'Clan Management': 'account3',
    'Direct Message': 'account4',
    'Onboarding Guide': 'account5',
    'User Profile': 'account6',
  };

  const accountKey = suiteToAccountMap[suiteName] || 'account1';
  return { config: getAuthConfig(accountKey), accountKey };
};

// Get available account keys
export const getAvailableAccounts = () => Object.keys(persistentAuthConfigs);

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

// Function to get auth data for specific account
export const getLocalAuthData = (accountKey: keyof typeof persistentAuthConfigs) => {
  return {
    persist: {
      key: 'persist:auth',
      value: getAuthConfig(accountKey),
    },
    mezonSession: {
      key: 'mezon_session',
      value: JSON.stringify(getSessionConfig()),
    },
  };
};

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
