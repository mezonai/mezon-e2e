import { WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { MezonCredentials } from '@/types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupConfig } from '@/utils/clanSetupHelper';
import { splitDomainAndPath } from '@/utils/domain';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { Browser, Page } from '@playwright/test';

export default class TestSuiteHelper {
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
    const context = await browser.newContext();
    const page = await context.newPage();

    await AuthHelper.setupAuthWithEmailPassword(page, credentials);
    await clanFactory.setupClan(configs, page);

    clanFactory.setClanUrl(
      joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, splitDomainAndPath(clanFactory.getClanUrl()).path)
    );
    await AuthHelper.logout(page);
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
    const _credentials = await AuthHelper.setupAuthWithEmailPassword(page, credentials);
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), _credentials);
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
    const context = await browser.newContext();
    const page = await context.newPage();
    const _credentials = await AuthHelper.setupAuthWithEmailPassword(page, credentials);
    await AuthHelper.prepareBeforeTest(page, clanFactory.getClanUrl(), _credentials);
    await clanFactory.cleanupClan(page);
    await AuthHelper.logout(page);
    await context.close();
  }
}
