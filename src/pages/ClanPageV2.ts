import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { expect, Page } from '@playwright/test';
import { DirectMessageHelper } from './../utils/directMessageHelper';
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
    createChannel: this.page.locator(generateE2eSelector('clan_page.side_bar.button.add_channel')),
    createClanCancel: this.page.locator(
      `${generateE2eSelector('clan_page.modal.create_clan')} ${generateE2eSelector('button.base')}`,
      { hasText: 'Cancel' }
    ),
    createClanConfirm: this.page.locator(
      `${generateE2eSelector('clan_page.modal.create_clan')} ${generateE2eSelector('button.base')}`,
      { hasText: 'Create' }
    ),
    invitePeopleFromHeaderMenu: this.page.locator(
      generateE2eSelector('clan_page.header.modal_panel.item'),
      { hasText: 'Invite People' }
    ),
    invitePeople: this.page.locator(
      generateE2eSelector('clan_page.modal.invite_people.user_item.button.invite')
    ),
    closeInviteModal: this.page.locator(generateE2eSelector('button.base'), { hasText: '×' }),
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
    urlInvite: this.page.locator(generateE2eSelector('clan_page.modal.invite_people.url_invite')),
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

  private modal = {
    userInvite: this.page.locator(generateE2eSelector('clan_page.modal.invite_people.user_item')),
    container: this.page.locator(generateE2eSelector('clan_page.modal.invite_people.container')),
  };

  async createNewClan(clanName: string): Promise<boolean> {
    try {
      await this.input.clanName.fill(clanName);
      await this.page.waitForTimeout(2000);
      await this.buttons.createClanConfirm.click();
      await this.page.waitForTimeout(5000);
      return true;
    } catch (error) {
      console.error(`Error creating clan: ${error}`);
      return false;
    }
  }

  async isClanPresent(clanName: string): Promise<boolean> {
    const clanLocator = this.page.locator(generateE2eSelector('clan_page.header.title.clan_name'), {
      hasText: clanName,
    });

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
      await this.page.waitForTimeout(5000);
      await categorySettingPage.buttons.deleteSidebar.click();
      await categorySettingPage.input.delete.fill(clanName);
      await categorySettingPage.buttons.confirmDelete.click();
      await this.page.waitForTimeout(5000);
      return true;
    } catch (error) {
      console.error(`Error deleting clan: ${error}`);
      return false;
    }
  }

  async createNewChannel(
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

  async isNewChannelPresent(channelName: string): Promise<boolean> {
    const channelLocator = this.page.locator(
      generateE2eSelector('clan_page.channel_list.item.name'),
      { hasText: channelName }
    );

    return channelLocator.isVisible();
  }

  async clickButtonInvitePeopleFromMenu(): Promise<boolean> {
    try {
      await this.buttons.clanName.click();
      await this.buttons.invitePeopleFromHeaderMenu.click();
      return true;
    } catch (error) {
      console.error(`Error clicking invite people:`, error);
      return false;
    }
  }

  async sendInviteOnModal(): Promise<{
    success: boolean;
    username?: string;
    urlInvite?: string;
  }> {
    try {
      await expect(this.modal.userInvite.first()).toBeVisible();

      const userInviteItem = this.modal.userInvite.first();
      const usernameElement = userInviteItem.locator('p');
      await expect(usernameElement).toBeVisible();

      const username = (await usernameElement.innerText()).trim();

      await expect(this.input.urlInvite).toHaveValue(/http/);
      const urlInvite = (await this.input.urlInvite.inputValue()).trim();

      if (!username || !urlInvite) {
        throw new Error('Missing invite info or URL');
      }

      await this.buttons.invitePeople.first().click();

      await this.buttons.closeInviteModal.click();

      await this.modal.container.waitFor({ state: 'hidden', timeout: 5000 });

      return { success: true, username, urlInvite };
    } catch (error) {
      console.error('Error sending invite:', error);
      return { success: false };
    }
  }

  async openDirectMessageWithUser(username: string): Promise<void> {
    const directMessageHelpers = new DirectMessageHelper(this.page);

    await expect(
      directMessageHelpers.userNamesInDM.getByText(username, { exact: true })
    ).toBeVisible();

    await directMessageHelpers.userNamesInDM.getByText(username, { exact: true }).click();
  }

  async getLastMessageInChat(): Promise<string> {
    const messageHelpers = new MessageTestHelpers(this.page);
    const lastMessage = await messageHelpers.message.last();

    await expect(lastMessage).toBeVisible();

    return (await lastMessage.innerText()).trim();
  }
}
