import { EnvironmentConfig } from '@/config/types';
import dotenv from 'dotenv';
dotenv.config();

// Multiple persistent auth configurations
export const persistentAuthConfigs = {
  account1: {
    loadingStatus: '"loaded"',
    session:
      '{"1964889885160509400":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJiNTBiNDViYy0yY2VlLTQ4ZjYtYmUxYS0zNzZiNDk4YmRmMTciLCJ1aWQiOjE5NjQ4ODk4ODUxNjA1MDk0NDAsInVzbiI6ImRhdC5oYXF1b2MrMDEiLCJleHAiOjE3NTc3MzU0MzR9.pcfVzGnPcTltjI2qt8R6rsiry8xF6_qcCnbL0zCN0TU","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJiNTBiNDViYy0yY2VlLTQ4ZjYtYmUxYS0zNzZiNDk4YmRmMTciLCJ1aWQiOjE5NjQ4ODk4ODUxNjA1MDk0NDAsInVzbiI6ImRhdC5oYXF1b2MrMDEiLCJleHAiOjE3NTgyNTM4MzR9.BFrunyhUzYmONkBtL_OINsM2GANJmHGxQTjG6DHs9vo","created_at":1757649034,"is_remember":false,"refresh_expires_at":1758253834,"expires_at":1757735434,"username":"dat.haquoc+01","user_id":1964889885160509400}}',
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
      '{"1964937944108109800":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI1MGM2YTA1Mi1hNjdiLTRiYWUtODM0YS02MzNkYTE1OWJmMTgiLCJ1aWQiOjE5NjQ5Mzc5NDQxMDgxMDk4MjQsInVzbiI6ImRhdC5oYXF1b2MrMDMiLCJleHAiOjE3NTc3MzU2MDh9.sPGn8LfOKDwj_NzgQwE7BlSnDoEEIv_8yeL7tzraAPo","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI1MGM2YTA1Mi1hNjdiLTRiYWUtODM0YS02MzNkYTE1OWJmMTgiLCJ1aWQiOjE5NjQ5Mzc5NDQxMDgxMDk4MjQsInVzbiI6ImRhdC5oYXF1b2MrMDMiLCJleHAiOjE3NTgyNTQwMDh9.YEWkit_0XHyPCoiI4nj9LFeVtjp5LhMyMo8Fb-8S3bQ","created_at":1757649207,"is_remember":false,"refresh_expires_at":1758254008,"expires_at":1757735608,"username":"dat.haquoc+03","user_id":1964937944108109800}}',
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
      '{"1964952630786527200":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI0NTU4ZGRlOC0wODMzLTQ3ZjItYjlmMy1hNDUzMzdmOWFlZTkiLCJ1aWQiOjE5NjQ5NTI2MzA3ODY1MjcyMzIsInVzbiI6ImRhdC5oYXF1b2MrMDQiLCJleHAiOjE3NTc3MzU2NTd9.U2zEH11HY9q8t_aO0k4VRnApy0Qo-ROqmFGe8T_z1aQ","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI0NTU4ZGRlOC0wODMzLTQ3ZjItYjlmMy1hNDUzMzdmOWFlZTkiLCJ1aWQiOjE5NjQ5NTI2MzA3ODY1MjcyMzIsInVzbiI6ImRhdC5oYXF1b2MrMDQiLCJleHAiOjE3NTgyNTQwNTd9.4SLhFl_L-KyP--hez8B3zmjIHxunVU9ENEovxId1Ytk","created_at":1757649256,"is_remember":false,"refresh_expires_at":1758254057,"expires_at":1757735657,"username":"dat.haquoc+04","user_id":1964952630786527200}}',
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
      '{"1964953116990247000":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJlYWYxMWFmMC1kNDVkLTQwYTQtYTYzZC05ODNmMjY4ZGI1MTgiLCJ1aWQiOjE5NjQ5NTMxMTY5OTAyNDY5MTIsInVzbiI6ImRhdC5oYXF1b2MrMDUiLCJleHAiOjE3NTc3MzU2OTh9.wR79G5Pf7v55dOybWWLVVB9gY7qqb2iv82OzBOm1sj8","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJlYWYxMWFmMC1kNDVkLTQwYTQtYTYzZC05ODNmMjY4ZGI1MTgiLCJ1aWQiOjE5NjQ5NTMxMTY5OTAyNDY5MTIsInVzbiI6ImRhdC5oYXF1b2MrMDUiLCJleHAiOjE3NTgyNTQwOTh9.f4N75OfiWscChix0mdkNAqrTxTBA89N9DS1ZZxX_oZ0","created_at":1757649298,"is_remember":false,"refresh_expires_at":1758254098,"expires_at":1757735698,"username":"dat.haquoc+05","user_id":1964953116990247000}}',
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
      '{"1964953606733959200":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJmZDM1ODI0MS1hODQ1LTQ1OTItYjQ5Yi1jNGZiMmNjZGJmMDAiLCJ1aWQiOjE5NjQ5NTM2MDY3MzM5NTkxNjgsInVzbiI6ImRhdC5oYXF1b2MrMDYiLCJleHAiOjE3NTc3MzU3NDF9.qIE9aoV6sDPXNSqCRqIJ0g7oD1tpezogVRiytxLoaa8","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJmZDM1ODI0MS1hODQ1LTQ1OTItYjQ5Yi1jNGZiMmNjZGJmMDAiLCJ1aWQiOjE5NjQ5NTM2MDY3MzM5NTkxNjgsInVzbiI6ImRhdC5oYXF1b2MrMDYiLCJleHAiOjE3NTgyNTQxNDF9.AnaSXwSEnkY94HHfk90V1iipB38FdeP3nMuVpKJm3zQ","created_at":1757649341,"is_remember":false,"refresh_expires_at":1758254141,"expires_at":1757735741,"username":"dat.haquoc+06","user_id":1964953606733959200}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1964953606733959200"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  'account2-1': {
    loadingStatus: '"loaded"',
    session:
      '{"1967441732656173000":{"created":true,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI3YjlmYmQyZC1hYTc4LTQ3MWMtOWZjYi1mOWUwNjc5NDlhMDgiLCJ1aWQiOjE5Njc0NDE3MzI2NTYxNzMwNTYsInVzbiI6ImRhdC5oYXF1b2MrMDItMSIsImV4cCI6MTc1Nzk5NjAzN30.ij6HleQt_63iiludFYmBEWaa9uxPdQxyaVOSAWunkUI","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI3YjlmYmQyZC1hYTc4LTQ3MWMtOWZjYi1mOWUwNjc5NDlhMDgiLCJ1aWQiOjE5Njc0NDE3MzI2NTYxNzMwNTYsInVzbiI6ImRhdC5oYXF1b2MrMDItMSIsImV4cCI6MTc1ODUxNDQzN30.7ZqQXhtCDFIY7SE27uDcJxmV4Qy04ZECTkitD4UYw-0","created_at":1757909637,"is_remember":false,"refresh_expires_at":1758514437,"expires_at":1757996037,"username":"dat.haquoc+02-1","user_id":1967441732656173000}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1967441732656173000"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  'account2-2': {
    loadingStatus: '"loaded"',
    session:
      '{"1967442215051464700":{"created":true,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJmYWZjMWQxMC1hZjljLTQxM2EtYmM1My1hYmU4OTU0ODFmM2QiLCJ1aWQiOjE5Njc0NDIyMTUwNTE0NjQ3MDQsInVzbiI6ImRhdC5oYXF1b2MrMDItMiIsImV4cCI6MTc1Nzk5NjE1Mn0.LljIxHrmugt-0cPVENRHEhom-RQ_dCMweOj-DAx08ZI","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJmYWZjMWQxMC1hZjljLTQxM2EtYmM1My1hYmU4OTU0ODFmM2QiLCJ1aWQiOjE5Njc0NDIyMTUwNTE0NjQ3MDQsInVzbiI6ImRhdC5oYXF1b2MrMDItMiIsImV4cCI6MTc1ODUxNDU1Mn0.uUiyaTgYo4Ib07qSB1ts8NyhIb1qqghcTOo7uKbJWP4","created_at":1757909751,"is_remember":false,"refresh_expires_at":1758514552,"expires_at":1757996152,"username":"dat.haquoc+02-2","user_id":1967442215051464700}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1967442215051464700"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  'account2-3': {
    loadingStatus: '"loaded"',
    session:
      '{"1967442542983123000":{"created":true,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJmNmE4MTlkNC05YTEwLTRkMWQtOGVjYS1jYTUyMTU0NjI1ODMiLCJ1aWQiOjE5Njc0NDI1NDI5ODMxMjI5NDQsInVzbiI6ImRhdC5oYXF1b2MrMDItMyIsImV4cCI6MTc1Nzk5NjIzMH0.CKwRf555ROYBsE-tX1Czsxe0ZlQxNFIC2qpzwT5QIrQ","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJmNmE4MTlkNC05YTEwLTRkMWQtOGVjYS1jYTUyMTU0NjI1ODMiLCJ1aWQiOjE5Njc0NDI1NDI5ODMxMjI5NDQsInVzbiI6ImRhdC5oYXF1b2MrMDItMyIsImV4cCI6MTc1ODUxNDYzMH0.f1vnhSgxvpNqNJxfMAiHnby74f-zGV186gnDd4uAMBw","created_at":1757909830,"is_remember":false,"refresh_expires_at":1758514630,"expires_at":1757996230,"username":"dat.haquoc+02-3","user_id":1967442542983123000}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1967442542983123000"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  'account2-4': {
    loadingStatus: '"loaded"',
    session:
      '{"1967442871149662200":{"created":true,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJhYjEzZWE4NS0wZDAxLTRlNDctYWY3Zi02NGY3NGQ4MmJhOTQiLCJ1aWQiOjE5Njc0NDI4NzExNDk2NjIyMDgsInVzbiI6ImRhdC5oYXF1b2MrMDItNCIsImV4cCI6MTc1Nzk5NjMwOH0.zG3eFlv1FLgLmAh-OVAFJjxuZIKsMDAXGp8XeJNjFB0","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJhYjEzZWE4NS0wZDAxLTRlNDctYWY3Zi02NGY3NGQ4MmJhOTQiLCJ1aWQiOjE5Njc0NDI4NzExNDk2NjIyMDgsInVzbiI6ImRhdC5oYXF1b2MrMDItNCIsImV4cCI6MTc1ODUxNDcwOH0.wM39f3thcLGZbt9KQ1UVzEyoWCwFWqn0mCv2yD3gaCM","created_at":1757909908,"is_remember":false,"refresh_expires_at":1758514708,"expires_at":1757996308,"username":"dat.haquoc+02-4","user_id":1967442871149662200}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1967442871149662200"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  'account2-5': {
    loadingStatus: '"loaded"',
    session:
      '{"1967443118043172900":{"created":true,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiIwNDQ4Y2U1Ni1hNTQ0LTQxZjMtYTMzOC0xMGE4ZGUwYTlmZjEiLCJ1aWQiOjE5Njc0NDMxMTgwNDMxNzI4NjQsInVzbiI6ImRhdC5oYXF1b2MrMDItNSIsImV4cCI6MTc1Nzk5NjM2N30.FrVPvoXqQ5cjc1Ikbdn-oltaycEa5YG0Y3I4qT9KvJ0","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiIwNDQ4Y2U1Ni1hNTQ0LTQxZjMtYTMzOC0xMGE4ZGUwYTlmZjEiLCJ1aWQiOjE5Njc0NDMxMTgwNDMxNzI4NjQsInVzbiI6ImRhdC5oYXF1b2MrMDItNSIsImV4cCI6MTc1ODUxNDc2N30.s4756AF0GIQx1OJo1tvwAeZX0Xu7AYJapoax2CZfV2I","created_at":1757909967,"is_remember":false,"refresh_expires_at":1758514767,"expires_at":1757996367,"username":"dat.haquoc+02-5","user_id":1967443118043172900}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1967443118043172900"',
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
    'Channel Message_1': 'account2-1',
    'Channel Message_2': 'account2-2',
    'Channel Message_3': 'account2-3',
    'Channel Message_4': 'account2-4',
    'Channel Message_5': 'account2-5',
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
