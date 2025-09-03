import { Page } from "@playwright/test";

export class ProfilePage {
  constructor(private page: Page) {}

  async openProfileTab() {
    const profileTab = this.page.locator('[data-e2e="user_setting-profile-tab_profile"]');
    await profileTab.waitFor({ state: 'visible', timeout: 10000 });
    await profileTab.click();
  }

  async openClanProfileTab() {
    const clanProfileTab = this.page.locator('[data-e2e="user_setting-profile-clan_profile-button"]');
    await clanProfileTab.waitFor({ state: 'visible', timeout: 10000 });
    await clanProfileTab.click();
  }

  async openAccountTab() {
    const clanProfileTab = this.page.locator('[data-e2e="user_setting-account-tab_account"]');
    await clanProfileTab.waitFor({ state: 'visible', timeout: 10000 });
    await clanProfileTab.click();
  }
}
