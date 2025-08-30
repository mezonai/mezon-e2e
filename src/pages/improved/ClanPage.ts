import { ClanPageSelectors } from '@/shared/selectors/ClanPageSelectors';
import { OperationResult } from '@/shared/types/operation.types';
import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Improved ClanPage with clear separation of concerns
 * - Only UI interactions and element access
 * - No business logic
 * - Standardized selector strategy
 * - Better error handling and type safety
 */
export class ClanPage extends BasePage {
  // Centralized selectors using consistent strategy
  private readonly selectors = new ClanPageSelectors();

  // UI Elements - organized by functionality
  public readonly elements = {
    navigation: {
      createClanButton: this.page.locator(this.selectors.navigation.createClanButton),
      clanNameTitle: this.page.locator(this.selectors.navigation.clanNameTitle),
      invitePeopleButton: this.page.locator(this.selectors.navigation.invitePeopleButton),
      createChannelButton: this.page.locator(this.selectors.navigation.createChannelButton),
    },
    modals: {
      createClan: {
        nameInput: this.page.locator(this.selectors.modals.createClan.nameInput),
        confirmButton: this.page.locator(this.selectors.modals.createClan.confirmButton),
        cancelButton: this.page.locator(this.selectors.modals.createClan.cancelButton),
      },
      createChannel: {
        typeText: this.page.locator(this.selectors.modals.createChannel.typeText),
        typeVoice: this.page.locator(this.selectors.modals.createChannel.typeVoice),
        typeStream: this.page.locator(this.selectors.modals.createChannel.typeStream),
        nameInput: this.page.locator(this.selectors.modals.createChannel.nameInput),
        privateToggle: this.page.locator(this.selectors.modals.createChannel.privateToggle),
        confirmButton: this.page.locator(this.selectors.modals.createChannel.confirmButton),
      },
      invitePeople: {
        searchInput: this.page.locator(this.selectors.modals.invitePeople.searchInput),
        inviteButton: this.page.locator(this.selectors.modals.invitePeople.inviteButton),
      },
    },
    chat: {
      messageInput: this.page.locator(this.selectors.chat.messageInput),
      fileInput: this.page.locator(this.selectors.chat.fileInput),
      attachButton: this.page.locator(this.selectors.chat.attachButton),
    },
    sidebar: {
      clanList: this.page.locator(this.selectors.sidebar.clanList),
      channelList: this.page.locator(this.selectors.sidebar.channelList),
    },
  };

  constructor(page: Page, baseURL?: string) {
    super(page, baseURL);
  }

  // UI Interaction Methods - Pure UI operations only
  async clickCreateClanButton(): Promise<OperationResult<void>> {
    try {
      await this.elements.navigation.createClanButton.click();
      await this.waitForLoadingComplete();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to click create clan button: ${error}`,
        errorCode: 'UI_INTERACTION_FAILED',
      };
    }
  }

  async fillClanName(name: string): Promise<OperationResult<void>> {
    try {
      await this.elements.modals.createClan.nameInput.fill(name);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fill clan name: ${error}`,
        errorCode: 'INPUT_FILL_FAILED',
      };
    }
  }

  async clickConfirmCreateClan(): Promise<OperationResult<void>> {
    try {
      await this.elements.modals.createClan.confirmButton.click();
      await this.waitForLoadingComplete();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to confirm clan creation: ${error}`,
        errorCode: 'MODAL_CONFIRMATION_FAILED',
      };
    }
  }

  async clickCreateChannelButton(): Promise<OperationResult<void>> {
    try {
      await this.elements.navigation.createChannelButton.click();
      await this.waitForLoadingComplete();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to click create channel button: ${error}`,
        errorCode: 'UI_INTERACTION_FAILED',
      };
    }
  }

  async selectChannelType(type: 'text' | 'voice' | 'stream'): Promise<OperationResult<void>> {
    try {
      const typeElements = {
        text: this.elements.modals.createChannel.typeText,
        voice: this.elements.modals.createChannel.typeVoice,
        stream: this.elements.modals.createChannel.typeStream,
      };

      await typeElements[type].click();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to select channel type ${type}: ${error}`,
        errorCode: 'CHANNEL_TYPE_SELECTION_FAILED',
      };
    }
  }

  async fillChannelName(name: string): Promise<OperationResult<void>> {
    try {
      await this.elements.modals.createChannel.nameInput.fill(name);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fill channel name: ${error}`,
        errorCode: 'INPUT_FILL_FAILED',
      };
    }
  }

  async togglePrivateChannel(): Promise<OperationResult<void>> {
    try {
      await this.elements.modals.createChannel.privateToggle.click();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to toggle private channel: ${error}`,
        errorCode: 'TOGGLE_FAILED',
      };
    }
  }

  async clickConfirmCreateChannel(): Promise<OperationResult<void>> {
    try {
      await this.elements.modals.createChannel.confirmButton.click();
      await this.waitForLoadingComplete();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to confirm channel creation: ${error}`,
        errorCode: 'MODAL_CONFIRMATION_FAILED',
      };
    }
  }

  async fillMessageInput(message: string): Promise<OperationResult<void>> {
    try {
      await this.elements.chat.messageInput.fill(message);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fill message input: ${error}`,
        errorCode: 'INPUT_FILL_FAILED',
      };
    }
  }

  async sendMessage(): Promise<OperationResult<void>> {
    try {
      await this.elements.chat.messageInput.press('Enter');
      await this.waitForLoadingComplete();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to send message: ${error}`,
        errorCode: 'MESSAGE_SEND_FAILED',
      };
    }
  }

  async uploadFile(filePath: string): Promise<OperationResult<void>> {
    try {
      await this.elements.chat.fileInput.setInputFiles(filePath);
      await this.waitForLoadingComplete();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to upload file: ${error}`,
        errorCode: 'FILE_UPLOAD_FAILED',
      };
    }
  }

  // Verification Methods - Pure UI state checking
  async isClanVisible(clanName: string): Promise<boolean> {
    try {
      const clanElement = this.page.locator(this.selectors.sidebar.clanItem, { hasText: clanName });
      return await clanElement.isVisible();
    } catch {
      return false;
    }
  }

  async isChannelVisible(channelName: string): Promise<boolean> {
    try {
      const channelElement = this.page.locator(this.selectors.sidebar.channelItem, {
        hasText: channelName,
      });
      return await channelElement.isVisible();
    } catch {
      return false;
    }
  }

  async isMessageVisible(messageText: string): Promise<boolean> {
    try {
      const messageElement = this.page.locator(this.selectors.chat.messageItem, {
        hasText: messageText,
      });
      return await messageElement.isVisible();
    } catch {
      return false;
    }
  }

  async getAllClanNames(): Promise<string[]> {
    try {
      const clanElements = this.page.locator(this.selectors.sidebar.clanItem);
      const count = await clanElements.count();
      const names: string[] = [];

      for (let i = 0; i < count; i++) {
        const name = await clanElements.nth(i).textContent();
        if (name?.trim()) {
          names.push(name.trim());
        }
      }

      return names;
    } catch {
      return [];
    }
  }

  async clickClanByName(clanName: string): Promise<OperationResult<void>> {
    try {
      const clanElement = this.page.locator(this.selectors.sidebar.clanItem, { hasText: clanName });
      await clanElement.click();
      await this.waitForLoadingComplete();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to click clan ${clanName}: ${error}`,
        errorCode: 'CLAN_SELECTION_FAILED',
      };
    }
  }

  // Helper method for consistent waiting
  private async waitForLoadingComplete(): Promise<void> {
    await this.page.waitForTimeout(2000); // Replace with proper loading indicators
  }
}
