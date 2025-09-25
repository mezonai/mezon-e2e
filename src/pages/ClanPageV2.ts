import { ChannelStatus, ChannelType, ThreadStatus } from '@/types/clan-page.types';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { expect, Locator, Page } from '@playwright/test';
import { DirectMessageHelper } from './../utils/directMessageHelper';
import { BasePage } from './BasePage';
import { CategoryPage } from './CategoryPage';
import { CategorySettingPage } from './CategorySettingPage';

export class ClanPageV2 extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  readonly buttons = {
    createClan: this.page.locator(generateE2eSelector('clan_page.side_bar.button.add_clan')),
    clanName: this.page.locator(`${generateE2eSelector('clan_page.header.title.clan_name')} p`),
    // invitePeople: this.page.locator(
    //   generateE2eSelector('clan_page.header.modal_panel.invite_people')
    // ),
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
    eventButton: this.page.locator(generateE2eSelector('clan_page.side_bar.button.events')),
    saveChanges: this.page.locator(generateE2eSelector('button.base'), { hasText: 'Save Changes' }),
    exitSettings: this.page.locator(generateE2eSelector('clan_page.settings.button.exit')),
    memberListButton: this.page.locator(generateE2eSelector('clan_page.side_bar.button.members')),
  };

  readonly memberSettings = {
    usersInfo: this.page.locator(generateE2eSelector('clan_page.member_list.user_info')),
  };

  readonly footerProfile = {
    userName: this.page.locator(generateE2eSelector('footer_profile.name')),
  };

  readonly eventModal = {
    createEventButton: this.page.locator(
      generateE2eSelector('clan_page.modal.create_event.button_create')
    ),
    nextButton: this.page.locator(generateE2eSelector('clan_page.modal.create_event.next')),
  };

  readonly permissionModal = {
    isVisible: async (): Promise<boolean> => {
      const permissionModalLocator = this.page.locator(
        generateE2eSelector('clan_page.settings.modal.permission')
      );
      try {
        await permissionModalLocator.waitFor({ state: 'visible', timeout: 1000 });
        return true;
      } catch {
        return false;
      }
    },
    cancel: this.page.locator(generateE2eSelector('clan_page.settings.modal.permission.cancel')),
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
    delete: this.page.locator(generateE2eSelector('clan_page.settings.modal.delete_clan.input')),
    channelName: this.page.locator(
      `${generateE2eSelector('clan_page.channel_list.settings.overview')} input`
    ),
  };

  private settings = {
    clanName: this.page.locator(generateE2eSelector('clan_page.settings.overview.input.clan_name')),
  };

  readonly sidebar = {
    clanItem: this.page.locator(generateE2eSelector('clan_page.side_bar.clan_item')),
    clanItems: {
      clanName: this.page.locator(generateE2eSelector('clan_page.side_bar.clan_item.name')),
    },
    channelItem: {
      name: this.page.locator(generateE2eSelector('clan_page.channel_list.item.name')),
      icon: this.page.locator(generateE2eSelector('clan_page.channel_list.item.icon')),
    },
    threadItem: {
      name: this.page.locator(generateE2eSelector('clan_page.channel_list.thread_item.name')),
    },
    panelItem: {
      item: this.page.locator(generateE2eSelector('clan_page.channel_list.panel.item')),
    },
  };

  readonly header = {
    button: {
      thread: this.page.locator(generateE2eSelector('chat.channel_message.header.button.thread')),
      createThread: this.page.locator(
        generateE2eSelector(
          'chat.channel_message.header.button.thread.modal.thread_management.button.create_thread'
        )
      ),
      member: this.page.locator(generateE2eSelector('chat.channel_message.header.button.member')),
      pin: this.page.locator(generateE2eSelector('chat.channel_message.header.button.pin')),
    },
  };

  readonly threadBox = {
    threadNameInput: this.page.locator(
      generateE2eSelector('chat.channel_message.thread_box.input.thread_name')
    ),
    threadPrivateCheckbox: this.page.locator(
      generateE2eSelector('chat.channel_message.thread_box.checkbox.private_thread')
    ),
    threadInputMention: this.page.locator(
      `${generateE2eSelector('discussion.box.thread')} ${generateE2eSelector('mention.input')}`
    ),
  };

  readonly modal = {
    limitCreation: {
      title: this.page.locator(generateE2eSelector('clan_page.modal.limit_creation.title')),
    },
  };

  private modalInvite = {
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

    try {
      await clanLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async clickCreateClanButton(): Promise<boolean> {
    if (this.buttons.createClan) {
      await this.buttons.createClan.click();
      return true;
    }

    return false;
  }

  async deleteClan(removeAll?: boolean): Promise<boolean> {
    try {
      const categoryPage = new CategoryPage(this.page);
      const categorySettingPage = new CategorySettingPage(this.page);

      await categoryPage.text.clanName.click();
      await categoryPage.buttons.clanSettings.click();
      const clanName = await this.settings.clanName.inputValue();
      if (removeAll && !this.shouldDeleteClan(clanName || '')) {
        return false;
      }
      await categorySettingPage.buttons.deleteSidebar.click();
      await categorySettingPage.input.delete.fill(clanName || '');
      await categorySettingPage.buttons.confirmDelete.click();
      await this.page.waitForLoadState('domcontentloaded');
      if (await this.permissionModal.isVisible()) {
        await this.permissionModal.cancel.click();
      }
      return true;
    } catch (error) {
      console.error(`Error deleting clan: ${error}`);
      return false;
    }
  }

  /**
   * Check if a clan should be deleted based on its timestamp
   * @param clanName The name of the clan in format: prefix_randomString_timestamp
   * @returns true if the clan's timestamp has passed the current time
   */
  private shouldDeleteClan(clanName: string): boolean {
    try {
      const parts = clanName.split('_');
      if (parts.length < 3) {
        return true;
      }

      const timestampStr = parts[parts.length - 1];

      const clanTimestamp = parseInt(timestampStr);
      if (isNaN(clanTimestamp)) {
        return false;
      }

      const currentTime = Date.now();

      return currentTime > clanTimestamp;
    } catch (error) {
      return false;
    }
  }

  async openClanSettings(): Promise<boolean> {
    try {
      const categoryPage = new CategoryPage(this.page);

      await categoryPage.text.clanName.click();
      await categoryPage.buttons.clanSettings.click();
      return true;
    } catch (error) {
      console.error(`Error deleting clan: ${error}`);
      return false;
    }
  }

  async createEvent(): Promise<void> {
    this.buttons.eventButton.click();
    this.eventModal.createEventButton.click();
    this.eventModal.nextButton.click();
  }

  async openChannelSettings(channelName: string): Promise<void> {
    const channelLocator = this.sidebar.channelItem.name.filter({ hasText: channelName });
    await channelLocator.click({ button: 'right' });
    await this.sidebar.panelItem.item.filter({ hasText: 'Edit Channel' }).click();
    await this.page.waitForTimeout(500);
  }

  async openMemberListSetting(): Promise<void> {
    await this.buttons.memberListButton.click();
    await this.page.waitForTimeout(500);
  }

  async createNewChannel(
    typeChannel: ChannelType,
    channelName: string,
    status?: ChannelStatus
  ): Promise<boolean> {
    try {
      await this.buttons.createChannel.click();

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
      await this.createChannelModal.input.channelName.fill(channelName);
      if (status === ChannelStatus.PRIVATE && typeChannel === ChannelType.TEXT) {
        await this.createChannelModal.toggle.isPrivate.click();
      }
      await this.createChannelModal.button.confirm.click();

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

    try {
      await channelLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async createThread(threadName: string, status?: ThreadStatus): Promise<void> {
    await this.header.button.thread.click();
    await this.header.button.createThread.click();
    await this.threadBox.threadNameInput.fill(threadName);
    if (status === ThreadStatus.PRIVATE) {
      await this.threadBox.threadPrivateCheckbox.click();
    }
    await this.threadBox.threadInputMention.fill(threadName);
    await this.threadBox.threadInputMention.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async openMemberList(): Promise<void> {
    await this.header.button.member.nth(0).click();
    await this.page.waitForTimeout(500);
  }

  async getMemberFromMemberList(memberName: string): Promise<Locator> {
    const memberLocator = this.page.locator(
      `${generateE2eSelector('chat.channel_message.member_list.item')}`,
      { hasText: memberName }
    );
    await memberLocator.waitFor({ state: 'visible', timeout: 5000 });
    return memberLocator;
  }

  async isNewThreadPresent(threadName: string): Promise<boolean> {
    const threadLocator = this.sidebar.threadItem.name.filter({
      hasText: threadName,
    });

    try {
      await threadLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async getAllClan(): Promise<number> {
    const clanElements = this.sidebar.clanItem;
    return await clanElements.count();
  }

  async isLimitCreationModalPresent(): Promise<boolean> {
    const limitCreationModalLocator = this.modal.limitCreation.title;
    try {
      await limitCreationModalLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
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
      await expect(this.modalInvite.userInvite.first()).toBeVisible();

      const userInviteItem = this.modalInvite.userInvite.first();
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

      await this.modalInvite.container.waitFor({ state: 'hidden', timeout: 5000 });

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

  async editChannelName(channelName: string, newChannelName: string): Promise<void> {
    await this.openChannelSettings(channelName);
    const input = this.page.locator(
      `${generateE2eSelector('clan_page.channel_list.settings.overview')} input[value="${channelName}"]`
    );

    await input.fill(newChannelName);
    await this.buttons.saveChanges.click();
    await this.buttons.exitSettings.click();
    await this.page.waitForLoadState('networkidle');
  }
}
