import { ClanPage } from '@/pages/Clan/ClanPage';
import { ClanSetupConfig } from '@/utils/clanSetupHelper';
import generateRandomString from '@/utils/randomString';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';
import { AuthHelper } from '@/utils/authHelper';
import ClanSelector from '../selectors/ClanSelector';

export class ClanFactory {
  private clanName: string = '';
  private clanUrl: string = '';
  private isReused: boolean = false;

  constructor() {}

  getClanName() {
    return this.clanName;
  }

  getClanUrl() {
    return this.clanUrl;
  }

  isClanReused(): boolean {
    return this.isReused;
  }

  getClanExcludeDomain() {
    const url = new URL(this.clanUrl);
    return url.pathname;
  }

  setClanUrl(clanUrl: string) {
    this.clanUrl = clanUrl;
  }

  async setupClan(config: ClanSetupConfig = {}, page: Page) {
    const selector = new ClanSelector(page);
    try {
      if (await selector.permissionModal.isVisible(2000)) {
        await selector.permissionModal.cancel.first().click();
      }
    } catch {}

    const { clanNamePrefix = 'TestClan' } = config;

    const shouldReuse = process.env.REUSE_EXISTING_CLAN !== 'false';
    const workerIndex = AuthHelper.getWorkerIndex();

    if (shouldReuse) {
      const clanWithPrefix = page.locator(
        `[data-e2e="clan_page-side_bar-clan_item"][title*="${clanNamePrefix}"]`
      );
      const prefixCount = await clanWithPrefix.count().catch(() => 0);

      // Only reuse if there is a dedicated clan available for this worker index
      if (prefixCount > workerIndex) {
        const targetClan = clanWithPrefix.nth(workerIndex);
        const title = (await targetClan.getAttribute('title').catch(() => '')) || 'ReusedClan';
        await targetClan.click({ force: true }).catch(() => {});
        await page.waitForTimeout(1500);

        // Click a text channel in the clan to ensure we land on a chat view
        const channelItem = page
          .locator(generateE2eSelector('clan_page.channel_list.item.name'))
          .or(page.locator(generateE2eSelector('clan_page.channel_list.item')))
          .or(page.locator('[data-e2e*="channel_list-item"]'))
          .first();
        try {
          await channelItem.waitFor({ state: 'visible', timeout: 5000 });
          await channelItem.click();
          await page.waitForTimeout(1000);
        } catch {}

        this.clanName = title;
        this.clanUrl = page.url();
        this.isReused = true;
        console.log(
          `[ClanFactory] Reusing existing clan for worker ${workerIndex}: "${this.clanName}" (${this.clanUrl})`
        );
        return;
      }

      // Fallback: If no clan matching this prefix exists, reuse ANY existing test clan sharded by worker
      const allTestClans = page.locator(
        '[data-e2e="clan_page-side_bar-clan_item"][title*="Test"], [data-e2e="clan_page-side_bar-clan_item"][title*="_"]'
      );
      const totalTestClans = await allTestClans.count().catch(() => 0);
      if (totalTestClans > workerIndex) {
        const targetClan = allTestClans.nth(workerIndex);
        const title = (await targetClan.getAttribute('title').catch(() => '')) || 'ReusedClan';
        await targetClan.click({ force: true }).catch(() => {});
        await page.waitForTimeout(1500);

        const channelItem = page
          .locator(generateE2eSelector('clan_page.channel_list.item.name'))
          .or(page.locator(generateE2eSelector('clan_page.channel_list.item')))
          .or(page.locator('[data-e2e*="channel_list-item"]'))
          .first();
        try {
          await channelItem.waitFor({ state: 'visible', timeout: 5000 });
          await channelItem.click();
          await page.waitForTimeout(1000);
        } catch {}

        this.clanName = title;
        this.clanUrl = page.url();
        this.isReused = true;
        console.log(
          `[ClanFactory] Fallback reusing existing test clan for worker ${workerIndex}: "${this.clanName}" (${this.clanUrl})`
        );
        return;
      }
    }

    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const timestamp = now.getTime();
    const clanName = `${clanNamePrefix}_w${workerIndex}_${generateRandomString(6)}_${timestamp}`;

    const clanPage = new ClanPage(page);
    const createClanClicked = await clanPage.clickCreateClanButton();
    if (!createClanClicked) {
      throw new Error('Failed to click create clan button');
    }

    const createMyOwnClicked = await clanPage.clickCreateMyOwnClan();
    if (!createMyOwnClicked) {
      throw new Error('Failed to click create my own clan option');
    }

    await clanPage.createNewClan(clanName);

    const clanExists = await clanPage.isClanPresent(clanName);
    if (!clanExists) {
      throw new Error(`Failed to create clan: ${clanName}`);
    }

    this.clanUrl = page.url();
    this.clanName = clanName;
    this.isReused = shouldReuse;
  }

  async cleanupClan(page: Page) {
    if (this.isReused || !this.clanName || !this.clanName.trim()) {
      console.log(`[ClanFactory] Skipping cleanup for clan: "${this.clanName}"`);
      return;
    }
    const clanPage = new ClanPage(page);
    await clanPage.deleteClan(this.clanName);
  }
}
