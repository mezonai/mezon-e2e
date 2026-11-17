import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { MezonCredentials } from '@/types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupConfig } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { Browser, Page, test } from '@playwright/test';

export default class TestSuiteHelper {
  static getWorkerCredentials(credentials: MezonCredentials): MezonCredentials {
    try {
      const parallelIndex =
        process.env.TEST_PARALLEL_INDEX !== undefined
          ? parseInt(process.env.TEST_PARALLEL_INDEX, 10)
          : process.env.TEST_WORKER_INDEX !== undefined
            ? parseInt(process.env.TEST_WORKER_INDEX, 10)
            : (() => {
                try {
                  return test.info().parallelIndex;
                } catch {
                  return 0;
                }
              })();

      // Only map to isolated worker accounts if WORKER_ACCOUNT_ISOLATION is enabled
      if (process.env.WORKER_ACCOUNT_ISOLATION === 'true' && parallelIndex > 0) {
        if (credentials.email === AccountCredentials.account1.email) {
          const workerPool = [
            AccountCredentials.account1,
            AccountCredentials.account4,
            AccountCredentials.account6,
            AccountCredentials.account8,
          ];
          return workerPool[parallelIndex % workerPool.length];
        }

        if (credentials.email === AccountCredentials.account2.email) {
          const workerPool = [
            AccountCredentials.account2,
            AccountCredentials.account4,
            AccountCredentials.account6,
            AccountCredentials.account8,
          ];
          return workerPool[parallelIndex % workerPool.length];
        }
      }
    } catch {
      // Fallback to provided credentials
    }
    return credentials;
  }

  static async setupBeforeAll({
    browser,
    clanFactory,
    configs,
    credentials,
  }: {
    browser: Browser;
    clanFactory: ClanFactory;
    configs: ClanSetupConfig;
    credentials: MezonCredentials;
  }) {
    const workerCreds = this.getWorkerCredentials(credentials);
    const context = await browser.newContext();
    const page = await context.newPage();

    await AuthHelper.setupAuthWithEmailPassword(page, workerCreds);
    await clanFactory.setupClan(configs, page);

    clanFactory.setClanUrl(
      joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, splitDomainAndPath(clanFactory.getClanUrl()).path)
    );
    await AuthHelper.logout(page, false);
    await context.close();
  }

  static async setupBeforeEach({
    page,
    clanFactory,
    credentials,
  }: {
    page: Page;
    clanFactory: ClanFactory;
    credentials: MezonCredentials;
  }) {
    const workerCreds = this.getWorkerCredentials(credentials);
    const clanUrl = clanFactory.getClanUrl();
    const _credentials = await AuthHelper.setupAuthWithEmailPassword(page, workerCreds, clanUrl);
    await AuthHelper.prepareBeforeTest(page, clanUrl, _credentials);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await AllureReporter.addParameter('clanName', clanFactory.getClanName());
  }
  static async onAfterAll({
    browser,
    clanFactory,
    credentials,
  }: {
    browser: Browser;
    clanFactory: ClanFactory;
    credentials: MezonCredentials;
  }) {
    if (clanFactory.isClanReused()) {
      return;
    }
    const workerCreds = this.getWorkerCredentials(credentials);
    const context = await browser.newContext();
    const page = await context.newPage();
    const clanUrl = clanFactory.getClanUrl();
    const _credentials = await AuthHelper.setupAuthWithEmailPassword(page, workerCreds, clanUrl);
    await AuthHelper.prepareBeforeTest(page, clanUrl, _credentials);
    await clanFactory.cleanupClan(page);
    await AuthHelper.logout(page, false);
    await context.close();
  }
}
