import { Browser, BrowserContext, Page } from '@playwright/test';
import { DualUserTestHelpers } from './dualUserTestHelpers';
import { MEZON_TEST_USERS } from '../data/static/TestUsers';

export interface DualUserConfig {
  userA: {
    email: string;
    otp?: string;
    isAutoOtp?: boolean;
  };
  userB: {
    email: string;
    otp?: string;
    isAutoOtp?: boolean;
  };
  viewport?: {
    width: number;
    height: number;
  };
}

export interface DualUserSession {
  primaryContext: BrowserContext;
  secondaryContext: BrowserContext;
  primaryPage: Page;
  secondaryPage: Page;
  primaryUser: DualUserTestHelpers;
  secondaryUser: DualUserTestHelpers;
  cleanup: () => Promise<void>;
}

export class DualUserSetup {
  static readonly DEFAULT_CONFIG: DualUserConfig = {
    userA: {
      email: MEZON_TEST_USERS.MAIN_USER.email,
      otp: MEZON_TEST_USERS.MAIN_USER.otp,
      isAutoOtp: true,
    },
    userB: {
      email: MEZON_TEST_USERS.member.email,
      isAutoOtp: false,
    },
    viewport: {
      width: 1280,
      height: 720,
    },
  };

  static async createDualUserSession(
    browser: Browser,
    config?: Partial<DualUserConfig>
  ): Promise<DualUserSession> {
    const finalConfig = this.mergeConfig(config);

    const ctxA = await browser.newContext({
      viewport: finalConfig.viewport!,
    });
    const ctxB = await browser.newContext({
      viewport: finalConfig.viewport!,
    });

    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    const userA = new DualUserTestHelpers(pageA);
    const userB = new DualUserTestHelpers(pageB);

    await Promise.allSettled([
      userA.loginWithEmail(
        finalConfig.userA.email,
        finalConfig.userA.otp,
        finalConfig.userA.isAutoOtp
      ),
      userB.loginWithEmail(
        finalConfig.userB.email,
        finalConfig.userB.otp,
        finalConfig.userB.isAutoOtp
      ),
    ]);

    await pageA.waitForTimeout(3000);
    await pageB.waitForTimeout(3000);

    const cleanup = async () => {
      await ctxA.close();
      await ctxB.close();
    };

    return {
      primaryContext: ctxA,
      secondaryContext: ctxB,
      primaryPage: pageA,
      secondaryPage: pageB,
      primaryUser: userA,
      secondaryUser: userB,
      cleanup,
    };
  }

  static async setupForClanChat(
    browser: Browser,
    clanChannelUrl: string,
    config?: Partial<DualUserConfig>
  ): Promise<DualUserSession> {
    const session = await this.createDualUserSession(browser, config);

    await session.primaryUser.ensureInClan(clanChannelUrl);
    await session.secondaryUser.ensureInClan(clanChannelUrl);

    await session.primaryPage.waitForTimeout(2000);
    await session.secondaryPage.waitForTimeout(2000);

    return session;
  }

  static async setupWithCustomUsers(
    browser: Browser,
    userAEmail: string,
    userBEmail: string,
    userAOtp?: string
  ): Promise<DualUserSession> {
    const config: Partial<DualUserConfig> = {
      userA: {
        email: userAEmail,
        otp: userAOtp,
        isAutoOtp: !!userAOtp,
      },
      userB: {
        email: userBEmail,
        isAutoOtp: false,
      },
    };

    return this.createDualUserSession(browser, config);
  }

  private static mergeConfig(config?: Partial<DualUserConfig>): DualUserConfig {
    if (!config) return this.DEFAULT_CONFIG;

    return {
      userA: { ...this.DEFAULT_CONFIG.userA, ...config.userA },
      userB: { ...this.DEFAULT_CONFIG.userB, ...config.userB },
      viewport: { ...this.DEFAULT_CONFIG.viewport, ...(config.viewport || {}) } as {
        width: number;
        height: number;
      },
    };
  }
}
