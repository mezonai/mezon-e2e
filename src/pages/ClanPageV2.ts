import { CategorySettingPage } from './CategorySettingPage';
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { CategoryPage } from './CategoryPage';

export class ClanPageV2 extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private buttons = {
    createClan: this.page.locator(generateE2eSelector('clan_page.side_bar.button.add_clan')),
    clanName: this.page.locator(generateE2eSelector('clan_page.header.title.clan_name')),
    invitePeople: this.page.locator(
      generateE2eSelector('clan_page.header.modal_panel.invite_people')
    ),
    createChannel: this.page.locator(generateE2eSelector('clan_page.side_bar.button.add_channel')),
    createClanConfirm: this.page.locator(generateE2eSelector('clan_page.modal.create_clan.button.confirm')),
  };

  private input = {
    clanName: this.page.locator(generateE2eSelector('clan_page.modal.create_clan.input.clan_name')),
  };

  private sidebar = {
    clanItem: {
      clanName: this.page.locator(generateE2eSelector('clan_page.side_bar.clan_item.name')),
    }
  };

  async createNewClan(clanName: string): Promise<boolean> {
    try {
      await this.input.clanName.fill(clanName);
      await this.page.waitForTimeout(2000);
      await this.buttons.createClanConfirm.click();
      await this.page.waitForTimeout(2000);
      return true;
    } catch (error) {
      console.error(`Error creating clan: ${error}`);
      return false;
    }
  }

  async isClanPresent(clanName: string): Promise<boolean> {

    const clanLocator = this.page.locator(generateE2eSelector('clan_page.side_bar.clan_item.name'), { hasText: clanName });

    return clanLocator.isVisible();
  }

  async clickCreateClanButton(): Promise<boolean> {
    if (this.buttons.createClan) {
      await this.buttons.createClan.click();
      await this.page.waitForTimeout(2000);
      return true;
    }

    return false;
  }

  async deleteClan(clanName: string): Promise<boolean> {
    try {
      const categoryPage = new CategoryPage(this.page);
      const categorySettingPage = new CategorySettingPage(this.page);

      await categoryPage.text.clanName.click();
      await categoryPage.buttons.clanSettings.click();
      await this.page.waitForTimeout(2000);
      await categorySettingPage.buttons.deleteSidebar.click();
      await categorySettingPage.input.delete.fill(clanName);
      await categorySettingPage.buttons.confirmDelete.click();
      await this.page.waitForTimeout(2000);
      return true;
    } catch (error) {
      console.error(`Error creating clan: ${error}`);
      return false;
    }
  }
}
