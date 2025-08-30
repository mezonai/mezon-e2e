import { ClanPage } from '@/pages/improved/ClanPage';
import {
  ChannelCreationData,
  ClanCreationData,
  MessageData,
  OperationResult,
} from '@/shared/types/operation.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { Page } from '@playwright/test';

/**
 * ClanActions - Business operations layer
 * Separates business logic from UI interactions
 * Provides meaningful return types and error handling
 * Integrates with reporting automatically
 */
export class ClanActions {
  private clanPage: ClanPage;

  constructor(private page: Page) {
    this.clanPage = new ClanPage(page);
  }

  /**
   * Create a new clan with all required steps
   */
  async createClan(clanData: ClanCreationData): Promise<OperationResult<{ clanId: string }>> {
    return await AllureReporter.step(`Create clan: ${clanData.name}`, async () => {
      try {
        // Step 1: Open create clan modal
        const openModalResult = await this.clanPage.clickCreateClanButton();
        if (!openModalResult.success) {
          return {
            success: false,
            error: 'Failed to open create clan modal',
            errorCode: 'MODAL_OPEN_FAILED',
          };
        }

        // Step 2: Fill clan name
        const fillNameResult = await this.clanPage.fillClanName(clanData.name);
        if (!fillNameResult.success) {
          return {
            success: false,
            error: `Failed to fill clan name: ${fillNameResult.error}`,
            errorCode: 'CLAN_NAME_INPUT_FAILED',
          };
        }

        // Step 3: Confirm creation
        const confirmResult = await this.clanPage.clickConfirmCreateClan();
        if (!confirmResult.success) {
          return {
            success: false,
            error: `Failed to confirm clan creation: ${confirmResult.error}`,
            errorCode: 'CLAN_CREATION_FAILED',
          };
        }

        // Step 4: Verify clan was created
        await this.page.waitForTimeout(3000); // Wait for creation to complete
        const isVisible = await this.clanPage.isClanVisible(clanData.name);
        if (!isVisible) {
          return {
            success: false,
            error: 'Clan was not created successfully - not visible in sidebar',
            errorCode: 'CLAN_VERIFICATION_FAILED',
          };
        }

        await AllureReporter.attachScreenshot(this.page, 'Clan Created Successfully');

        return {
          success: true,
          data: { clanId: `clan_${Date.now()}` }, // In real app, you'd extract the actual ID
          metadata: {
            clanName: clanData.name,
            createdAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        await AllureReporter.attachScreenshot(this.page, 'Clan Creation Failed');
        return {
          success: false,
          error: `Unexpected error during clan creation: ${error}`,
          errorCode: 'UNEXPECTED_ERROR',
        };
      }
    });
  }

  /**
   * Create a new channel within a clan
   */
  async createChannel(
    channelData: ChannelCreationData
  ): Promise<OperationResult<{ channelId: string }>> {
    return await AllureReporter.step(
      `Create ${channelData.type} channel: ${channelData.name}`,
      async () => {
        try {
          // Step 1: Open create channel modal
          const openModalResult = await this.clanPage.clickCreateChannelButton();
          if (!openModalResult.success) {
            return {
              success: false,
              error: 'Failed to open create channel modal',
              errorCode: 'MODAL_OPEN_FAILED',
            };
          }

          // Step 2: Select channel type
          const selectTypeResult = await this.clanPage.selectChannelType(channelData.type);
          if (!selectTypeResult.success) {
            return {
              success: false,
              error: `Failed to select channel type: ${selectTypeResult.error}`,
              errorCode: 'CHANNEL_TYPE_SELECTION_FAILED',
            };
          }

          // Step 3: Fill channel name
          const fillNameResult = await this.clanPage.fillChannelName(channelData.name);
          if (!fillNameResult.success) {
            return {
              success: false,
              error: `Failed to fill channel name: ${fillNameResult.error}`,
              errorCode: 'CHANNEL_NAME_INPUT_FAILED',
            };
          }

          // Step 4: Set privacy if needed
          if (channelData.isPrivate) {
            const togglePrivateResult = await this.clanPage.togglePrivateChannel();
            if (!togglePrivateResult.success) {
              return {
                success: false,
                error: `Failed to set channel as private: ${togglePrivateResult.error}`,
                errorCode: 'PRIVACY_TOGGLE_FAILED',
              };
            }
          }

          // Step 5: Confirm creation
          const confirmResult = await this.clanPage.clickConfirmCreateChannel();
          if (!confirmResult.success) {
            return {
              success: false,
              error: `Failed to confirm channel creation: ${confirmResult.error}`,
              errorCode: 'CHANNEL_CREATION_FAILED',
            };
          }

          // Step 6: Verify channel was created
          await this.page.waitForTimeout(3000);
          const isVisible = await this.clanPage.isChannelVisible(channelData.name);
          if (!isVisible) {
            return {
              success: false,
              error: 'Channel was not created successfully - not visible in sidebar',
              errorCode: 'CHANNEL_VERIFICATION_FAILED',
            };
          }

          await AllureReporter.attachScreenshot(this.page, 'Channel Created Successfully');

          return {
            success: true,
            data: { channelId: `channel_${Date.now()}` },
            metadata: {
              channelName: channelData.name,
              channelType: channelData.type,
              isPrivate: channelData.isPrivate || false,
              createdAt: new Date().toISOString(),
            },
          };
        } catch (error) {
          await AllureReporter.attachScreenshot(this.page, 'Channel Creation Failed');
          return {
            success: false,
            error: `Unexpected error during channel creation: ${error}`,
            errorCode: 'UNEXPECTED_ERROR',
          };
        }
      }
    );
  }

  /**
   * Send a message in the current channel
   */
  async sendMessage(messageData: MessageData): Promise<OperationResult<{ messageId: string }>> {
    return await AllureReporter.step(`Send message: ${messageData.content}`, async () => {
      try {
        // Step 1: Fill message input
        const fillResult = await this.clanPage.fillMessageInput(messageData.content);
        if (!fillResult.success) {
          return {
            success: false,
            error: `Failed to fill message input: ${fillResult.error}`,
            errorCode: 'MESSAGE_INPUT_FAILED',
          };
        }

        // Step 2: Handle attachments if any
        if (messageData.attachments && messageData.attachments.length > 0) {
          for (const attachment of messageData.attachments) {
            const uploadResult = await this.clanPage.uploadFile(attachment);
            if (!uploadResult.success) {
              return {
                success: false,
                error: `Failed to upload attachment: ${uploadResult.error}`,
                errorCode: 'FILE_UPLOAD_FAILED',
              };
            }
          }
        }

        // Step 3: Send message
        const sendResult = await this.clanPage.sendMessage();
        if (!sendResult.success) {
          return {
            success: false,
            error: `Failed to send message: ${sendResult.error}`,
            errorCode: 'MESSAGE_SEND_FAILED',
          };
        }

        // Step 4: Verify message was sent
        await this.page.waitForTimeout(2000);
        const isVisible = await this.clanPage.isMessageVisible(messageData.content);
        if (!isVisible) {
          return {
            success: false,
            error: 'Message was not sent successfully - not visible in chat',
            errorCode: 'MESSAGE_VERIFICATION_FAILED',
          };
        }

        await AllureReporter.attachScreenshot(this.page, 'Message Sent Successfully');

        return {
          success: true,
          data: { messageId: `message_${Date.now()}` },
          metadata: {
            content: messageData.content,
            type: messageData.type || 'text',
            attachmentCount: messageData.attachments?.length || 0,
            sentAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        await AllureReporter.attachScreenshot(this.page, 'Message Send Failed');
        return {
          success: false,
          error: `Unexpected error during message sending: ${error}`,
          errorCode: 'UNEXPECTED_ERROR',
        };
      }
    });
  }

  /**
   * Get all available clans
   */
  async getAllClans(): Promise<OperationResult<{ clans: string[] }>> {
    return await AllureReporter.step('Get all clans', async () => {
      try {
        const clanNames = await this.clanPage.getAllClanNames();

        return {
          success: true,
          data: { clans: clanNames },
          metadata: {
            clanCount: clanNames.length,
            retrievedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to retrieve clans: ${error}`,
          errorCode: 'CLAN_RETRIEVAL_FAILED',
        };
      }
    });
  }

  /**
   * Switch to a specific clan
   */
  async switchToClan(clanName: string): Promise<OperationResult<void>> {
    return await AllureReporter.step(`Switch to clan: ${clanName}`, async () => {
      try {
        const clickResult = await this.clanPage.clickClanByName(clanName);
        if (!clickResult.success) {
          return {
            success: false,
            error: `Failed to click on clan ${clanName}: ${clickResult.error}`,
            errorCode: 'CLAN_SWITCH_FAILED',
          };
        }

        await AllureReporter.attachScreenshot(this.page, `Switched to clan: ${clanName}`);

        return {
          success: true,
          metadata: {
            clanName,
            switchedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        return {
          success: false,
          error: `Unexpected error switching to clan: ${error}`,
          errorCode: 'UNEXPECTED_ERROR',
        };
      }
    });
  }
}
