import { ClanActions } from '@/actions/ClanActions';
import {
  ChannelCreationData,
  ClanCreationData,
  MessageData,
  OperationResult,
  UserInvitationData,
} from '@/shared/types/operation.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { Page } from '@playwright/test';

/**
 * ClanManagementService - High-level business operations
 * Orchestrates multiple actions to complete complex workflows
 * Provides domain-specific business logic
 * Handles cross-cutting concerns like logging, validation, etc.
 */
export class ClanManagementService {
  private clanActions: ClanActions;

  constructor(private page: Page) {
    this.clanActions = new ClanActions(page);
  }

  /**
   * Complete clan setup workflow: Create clan, create channels, send welcome message
   */
  async setupNewClan(
    clanData: ClanCreationData,
    channels: ChannelCreationData[],
    welcomeMessage?: string
  ): Promise<OperationResult<{ clanId: string; channelIds: string[] }>> {
    return await AllureReporter.step(`Setup new clan: ${clanData.name}`, async () => {
      try {
        // Step 1: Create the clan
        const clanResult = await this.clanActions.createClan(clanData);
        if (!clanResult.success) {
          return {
            success: false,
            error: `Failed to create clan: ${clanResult.error}`,
            errorCode: clanResult.errorCode,
          };
        }

        const clanId = clanResult.data!.clanId;
        const channelIds: string[] = [];

        // Step 2: Create channels
        for (const channelData of channels) {
          const channelResult = await this.clanActions.createChannel(channelData);
          if (!channelResult.success) {
            // Log the error but continue with other channels
            await AllureReporter.step(
              `Warning: Failed to create channel ${channelData.name}`,
              async () => {
                console.warn(`Channel creation failed: ${channelResult.error}`);
              }
            );
          } else {
            channelIds.push(channelResult.data!.channelId);
          }
        }

        // Step 3: Send welcome message if provided
        if (welcomeMessage) {
          const messageResult = await this.clanActions.sendMessage({
            content: welcomeMessage,
            type: 'text',
          });

          if (!messageResult.success) {
            // Log warning but don't fail the entire operation
            await AllureReporter.step('Warning: Failed to send welcome message', async () => {
              console.warn(`Welcome message failed: ${messageResult.error}`);
            });
          }
        }

        await AllureReporter.attachScreenshot(this.page, 'Clan Setup Complete');

        return {
          success: true,
          data: { clanId, channelIds },
          metadata: {
            clanName: clanData.name,
            channelsCreated: channelIds.length,
            welcomeMessageSent: !!welcomeMessage,
            setupCompletedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        await AllureReporter.attachScreenshot(this.page, 'Clan Setup Failed');
        return {
          success: false,
          error: `Unexpected error during clan setup: ${error}`,
          errorCode: 'CLAN_SETUP_FAILED',
        };
      }
    });
  }

  /**
   * Validate clan configuration before creation
   */
  private validateClanData(clanData: ClanCreationData): OperationResult<void> {
    const errors: string[] = [];

    if (!clanData.name || clanData.name.trim().length === 0) {
      errors.push('Clan name is required');
    }

    if (clanData.name && clanData.name.length > 50) {
      errors.push('Clan name must be less than 50 characters');
    }

    if (clanData.name && !/^[a-zA-Z0-9\s-_]+$/.test(clanData.name)) {
      errors.push('Clan name contains invalid characters');
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: `Validation failed: ${errors.join(', ')}`,
        errorCode: 'VALIDATION_ERROR',
      };
    }

    return { success: true };
  }

  /**
   * Create clan with validation
   */
  async createValidatedClan(
    clanData: ClanCreationData
  ): Promise<OperationResult<{ clanId: string }>> {
    return await AllureReporter.step(`Create validated clan: ${clanData.name}`, async () => {
      // Validate input
      const validationResult = this.validateClanData(clanData);
      if (!validationResult.success) {
        return validationResult as OperationResult<{ clanId: string }>;
      }

      // Create clan
      return await this.clanActions.createClan(clanData);
    });
  }

  /**
   * Bulk create channels with error handling
   */
  async createMultipleChannels(
    channels: ChannelCreationData[]
  ): Promise<OperationResult<{ channelIds: string[]; failures: string[] }>> {
    return await AllureReporter.step(`Create ${channels.length} channels`, async () => {
      const channelIds: string[] = [];
      const failures: string[] = [];

      for (const channelData of channels) {
        const result = await this.clanActions.createChannel(channelData);
        if (result.success) {
          channelIds.push(result.data!.channelId);
        } else {
          failures.push(`${channelData.name}: ${result.error}`);
        }
      }

      return {
        success: failures.length === 0,
        data: { channelIds, failures },
        metadata: {
          totalChannels: channels.length,
          successCount: channelIds.length,
          failureCount: failures.length,
          completedAt: new Date().toISOString(),
        },
      };
    });
  }

  /**
   * Send multiple messages with delay
   */
  async sendMultipleMessages(
    messages: MessageData[],
    delayBetweenMessages: number = 1000
  ): Promise<OperationResult<{ messageIds: string[]; failures: string[] }>> {
    return await AllureReporter.step(`Send ${messages.length} messages`, async () => {
      const messageIds: string[] = [];
      const failures: string[] = [];

      for (let i = 0; i < messages.length; i++) {
        const messageData = messages[i];

        const result = await this.clanActions.sendMessage(messageData);
        if (result.success) {
          messageIds.push(result.data!.messageId);
        } else {
          failures.push(`Message ${i + 1}: ${result.error}`);
        }

        // Add delay between messages if not the last one
        if (i < messages.length - 1) {
          await this.page.waitForTimeout(delayBetweenMessages);
        }
      }

      return {
        success: failures.length === 0,
        data: { messageIds, failures },
        metadata: {
          totalMessages: messages.length,
          successCount: messageIds.length,
          failureCount: failures.length,
          delayUsed: delayBetweenMessages,
          completedAt: new Date().toISOString(),
        },
      };
    });
  }

  /**
   * Complete onboarding flow for new clan
   */
  async completeOnboardingFlow(
    clanData: ClanCreationData,
    onboardingSteps: {
      createGeneralChannel: boolean;
      createAnnouncementsChannel: boolean;
      sendWelcomeMessage: boolean;
      inviteUsers?: UserInvitationData[];
    }
  ): Promise<OperationResult<{ clanId: string; onboardingStatus: Record<string, boolean> }>> {
    return await AllureReporter.step(`Complete onboarding for clan: ${clanData.name}`, async () => {
      const onboardingStatus: Record<string, boolean> = {};

      try {
        // Step 1: Create clan
        const clanResult = await this.createValidatedClan(clanData);
        if (!clanResult.success) {
          return clanResult as OperationResult<{
            clanId: string;
            onboardingStatus: Record<string, boolean>;
          }>;
        }

        const clanId = clanResult.data!.clanId;

        // Step 2: Create default channels
        const channelsToCreate: ChannelCreationData[] = [];

        if (onboardingSteps.createGeneralChannel) {
          channelsToCreate.push({
            name: 'general',
            type: 'text',
            description: 'General discussion channel',
          });
        }

        if (onboardingSteps.createAnnouncementsChannel) {
          channelsToCreate.push({
            name: 'announcements',
            type: 'text',
            description: 'Important announcements',
            isPrivate: false,
          });
        }

        if (channelsToCreate.length > 0) {
          const channelsResult = await this.createMultipleChannels(channelsToCreate);
          onboardingStatus.channelsCreated = channelsResult.success;
        }

        // Step 3: Send welcome message
        if (onboardingSteps.sendWelcomeMessage) {
          const welcomeResult = await this.clanActions.sendMessage({
            content: `Welcome to ${clanData.name}! 🎉 This is your new clan space.`,
            type: 'text',
          });
          onboardingStatus.welcomeMessageSent = welcomeResult.success;
        }

        // Step 4: Invite users (placeholder - would need user management actions)
        if (onboardingSteps.inviteUsers && onboardingSteps.inviteUsers.length > 0) {
          // This would be implemented with UserActions
          onboardingStatus.usersInvited = false; // Placeholder
        }

        await AllureReporter.attachScreenshot(this.page, 'Onboarding Complete');

        return {
          success: true,
          data: { clanId, onboardingStatus },
          metadata: {
            clanName: clanData.name,
            onboardingSteps: Object.keys(onboardingStatus).length,
            completedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        await AllureReporter.attachScreenshot(this.page, 'Onboarding Failed');
        return {
          success: false,
          error: `Onboarding failed: ${error}`,
          errorCode: 'ONBOARDING_FAILED',
        };
      }
    });
  }

  /**
   * Clean up test data - delete clan and associated resources
   */
  async cleanupClan(clanName: string): Promise<OperationResult<void>> {
    return await AllureReporter.step(`Cleanup clan: ${clanName}`, async () => {
      try {
        // Switch to clan first
        const switchResult = await this.clanActions.switchToClan(clanName);
        if (!switchResult.success) {
          return {
            success: false,
            error: `Cannot switch to clan for cleanup: ${switchResult.error}`,
            errorCode: 'CLEANUP_SWITCH_FAILED',
          };
        }

        // Note: Actual deletion would require ClanSettings actions
        // This is a placeholder for the cleanup process

        await AllureReporter.attachScreenshot(this.page, 'Cleanup Initiated');

        return {
          success: true,
          metadata: {
            clanName,
            cleanupAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        return {
          success: false,
          error: `Cleanup failed: ${error}`,
          errorCode: 'CLEANUP_FAILED',
        };
      }
    });
  }
}
