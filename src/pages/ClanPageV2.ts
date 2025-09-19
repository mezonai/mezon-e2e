import { ChannelStatus, ChannelType, ThreadStatus } from '@/types/clan-page.types';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';
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
    eventButton: this.page.locator(generateE2eSelector('clan_page.side_bar.button.events')),
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
    delete: this.page.locator(generateE2eSelector('clan_page.settings.modal.delete_clan.input')),
  };

  private settings = {
    clanName: this.page.locator(generateE2eSelector('clan_page.settings.overview.input.clan_name')),
  };

  readonly sidebar = {
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
    categoryItem: {
      item: this.page.locator(generateE2eSelector('clan_page.side_bar.channel_list.category')),
      itemName: this.page.locator(
        generateE2eSelector('clan_page.side_bar.channel_list.category.name')
      ),
      addChannel: this.page.locator(generateE2eSelector('clan_page.side_bar.button.add_channel')),
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

  async deleteClan(): Promise<boolean> {
    try {
      const categoryPage = new CategoryPage(this.page);
      const categorySettingPage = new CategorySettingPage(this.page);

      await categoryPage.text.clanName.click();
      await categoryPage.buttons.clanSettings.click();
      const clanName = await this.settings.clanName.inputValue();

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

  async createNewChannel(
    typeChannel: ChannelType,
    channelName: string,
    status?: ChannelStatus,
    categoryName?: string
  ): Promise<boolean> {
    try {
      let addChannelButton;
      if (categoryName) {
        addChannelButton = this.sidebar.categoryItem.item
          .filter({ hasText: categoryName })
          .locator(this.sidebar.categoryItem.addChannel);
      } else {
        addChannelButton = await this.buttons.createChannel;
      }

      await addChannelButton.click();

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
}
