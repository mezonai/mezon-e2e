import { ClanPageV2 } from '@/pages/ClanPageV2';
import { ClanSetupConfig } from '@/utils/clanSetupHelper';
import generateRandomString from '@/utils/randomString';
import { Page } from '@playwright/test';

export class ClanFactory {
  private clanName: string = '';
  private clanUrl: string = '';

  constructor() {}

  getClanName() {
    return this.clanName;
  }

  setClanName(clanName: string) {
    this.clanName = clanName;
  }

  getClanUrl() {
    return this.clanUrl;
  }

  setClanUrl(clanUrl: string) {
    this.clanUrl = clanUrl;
  }

  async setupClan(config: ClanSetupConfig = {}, page: Page) {
    const { clanNamePrefix = 'TestClan' } = config;

    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const timestamp = now.getTime();
    const clanName = `${clanNamePrefix}_${generateRandomString(10)}_${timestamp}`;

    const clanPage = new ClanPageV2(page);
    const createClanClicked = await clanPage.clickCreateClanButton();
    if (!createClanClicked) {
      throw new Error('Failed to click create clan button');
    }

    await clanPage.createNewClan(clanName);

    const clanExists = await clanPage.isClanPresent(clanName);
    if (!clanExists) {
      throw new Error(`Failed to create clan: ${clanName}`);
    }

    this.clanUrl = page.url();
    this.clanName = clanName;
  }

  async cleanupClan(page: Page) {
    const clanPage = new ClanPageV2(page);
    await clanPage.deleteClan(this.clanName);
  }
}
