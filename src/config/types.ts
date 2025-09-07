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
