import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { CategoryPage } from './CategoryPage';
import { CategorySettingPage } from './CategorySettingPage';

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
    createClanCancel: this.page.locator(
      `${generateE2eSelector('clan_page.modal.create_clan')} ${generateE2eSelector('button.base')}`,
      { hasText: 'Cancel' }
    ),
    createClanConfirm: this.page.locator(
      `${generateE2eSelector('clan_page.modal.create_clan')} ${generateE2eSelector('button.base')}`,
      { hasText: 'Create' }
    ),
  };

  public createChannelModal = {
    type: {
      text: this.page.locator(generateE2eSelector('clan_page.modal.create_channel.type'), {
        hasText: 'Text',
      }),
      voice: this.page.locator(generateE2eSelector('clan_page.modal.create_channel.type'), {
        hasText: 'Voice',
      }),
      stream: this.page.locator(generateE2eSelector('clan_page.modal.create_channel.type'), {
        hasText: 'Stream',
      }),
    },
    input: {
      channelName: this.page.locator(
        generateE2eSelector('clan_page.modal.create_channel.input.channel_name')
      ),
    },
    toggle: {
      isPrivate: this.page.locator(
        generateE2eSelector('clan_page.modal.create_channel.toggle.is_private')
      ),
    },
    button: {
      confirm: this.page.locator(
        generateE2eSelector('clan_page.modal.create_channel.button.confirm')
      ),
      cancel: this.page.locator(
        generateE2eSelector('clan_page.modal.create_channel.button.cancel')
      ),
    },
  };

  private input = {
    clanName: this.page.locator(generateE2eSelector('clan_page.modal.create_clan.input.clan_name')),
  };

  private sidebar = {
    clanItem: {
      clanName: this.page.locator(generateE2eSelector('clan_page.side_bar.clan_item.name')),
    },
    channelItem: {
      name: this.page.locator(generateE2eSelector('clan_page.channel_list.item.name')),
      icon: this.page.locator(generateE2eSelector('clan_page.channel_list.item.icon')),
    },
  };

  private sections = {
    createChannelSection: this.page.locator(generateE2eSelector('onboarding.chat.guide_sections')),
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
    const clanLocator = this.page.locator(
      generateE2eSelector('clan_page.side_bar.clan_item.name'),
      { hasText: clanName }
    );

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
      console.error(`Error deleting clan: ${error}`);
      return false;
    }
  }

  async createNewChannelByModal(
    typeChannel: ChannelType,
    channelName: string,
    status?: ChannelStatus
  ): Promise<boolean> {
    try {
      await this.buttons.createChannel.click();
      await this.page.waitForTimeout(2000);
      switch (typeChannel) {
        case ChannelType.TEXT:
          await this.createChannelModal.type.text.click();
          break;
        case ChannelType.VOICE:
          await this.createChannelModal.type.voice.click();
          break;
        case ChannelType.STREAM:
          await this.createChannelModal.type.stream.click();
          break;
      }
      this.createChannelModal.input.channelName.fill(channelName);
      if (status === ChannelStatus.PRIVATE && typeChannel === ChannelType.TEXT) {
        await this.createChannelModal.toggle.isPrivate.click();
      }
      this.createChannelModal.button.confirm.click();

      await this.page.waitForTimeout(2000);
      return true;
    } catch (error) {
      console.error(`Error creating channel: ${error}`);
      return false;
    }
  }

  async createNewChannelBySection(
    typeChannel: ChannelType,
    channelName: string,
    status?: ChannelStatus
  ): Promise<boolean> {
    try {
      await this.sections.createChannelSection.last().click();
      await this.page.waitForTimeout(2000);
      switch (typeChannel) {
        case ChannelType.TEXT:
          await this.createChannelModal.type.text.click();
          break;
        case ChannelType.VOICE:
          await this.createChannelModal.type.voice.click();
          break;
        case ChannelType.STREAM:
          await this.createChannelModal.type.stream.click();
          break;
      }
      this.createChannelModal.input.channelName.fill(channelName);
      if (status === ChannelStatus.PRIVATE && typeChannel === ChannelType.TEXT) {
        await this.createChannelModal.toggle.isPrivate.click();
      }
      this.createChannelModal.button.confirm.click();

      await this.page.waitForTimeout(2000);
      return true;
    } catch (error) {
      console.error(`Error creating channel: ${error}`);
      return false;
    }
  }

  async isNewChannelPresent(channelName: string): Promise<boolean> {
    const channelLocator = this.page.locator(
      generateE2eSelector('clan_page.channel_list.item.name'),
      { hasText: channelName }
    );

    return channelLocator.isVisible();
  }
}
