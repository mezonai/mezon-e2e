import {
  ChannelCreationData,
  ClanCreationData,
  MessageData,
  UserInvitationData,
} from '@/shared/types/operation.types';
import { faker } from '@faker-js/faker';

/**
 * TestDataFactory - Factory pattern for generating test data
 * Provides consistent, realistic test data
 * Reduces duplication and improves maintainability
 * Supports customization while providing sensible defaults
 */
export class TestDataFactory {
  /**
   * Create clan test data
   */
  static createClan(overrides?: Partial<ClanCreationData>): ClanCreationData {
    const timestamp = Date.now();
    return {
      name: `TestClan_${timestamp}`,
      description: faker.lorem.sentence(),
      isPrivate: false,
      avatar: undefined,
      ...overrides,
    };
  }

  /**
   * Create channel test data
   */
  static createChannel(overrides?: Partial<ChannelCreationData>): ChannelCreationData {
    const timestamp = Date.now();
    return {
      name: `test-channel-${timestamp}`,
      type: 'text',
      description: faker.lorem.sentence(),
      isPrivate: false,
      category: undefined,
      ...overrides,
    };
  }

  /**
   * Create message test data
   */
  static createMessage(overrides?: Partial<MessageData>): MessageData {
    return {
      content: faker.lorem.sentence(),
      type: 'text',
      attachments: undefined,
      ...overrides,
    };
  }

  /**
   * Create user invitation data
   */
  static createUserInvitation(overrides?: Partial<UserInvitationData>): UserInvitationData {
    return {
      username: faker.internet.userName(),
      email: faker.internet.email(),
      role: 'member',
      ...overrides,
    };
  }

  /**
   * Create predefined clan setups for common test scenarios
   */
  static createGamingClan(): ClanCreationData {
    return this.createClan({
      name: `Gaming_${Date.now()}`,
      description: 'A clan for gaming enthusiasts',
      isPrivate: false,
    });
  }

  static createPrivateClan(): ClanCreationData {
    return this.createClan({
      name: `Private_${Date.now()}`,
      description: 'Private clan for testing',
      isPrivate: true,
    });
  }

  static createWorkspaceClan(): ClanCreationData {
    return this.createClan({
      name: `Workspace_${Date.now()}`,
      description: 'Professional workspace clan',
      isPrivate: false,
    });
  }

  /**
   * Create common channel sets
   */
  static createDefaultChannels(): ChannelCreationData[] {
    return [
      this.createChannel({
        name: 'general',
        type: 'text',
        description: 'General discussion',
        isPrivate: false,
      }),
      this.createChannel({
        name: 'announcements',
        type: 'text',
        description: 'Important announcements',
        isPrivate: false,
      }),
    ];
  }

  static createGamingChannels(): ChannelCreationData[] {
    return [
      this.createChannel({
        name: 'general-chat',
        type: 'text',
        description: 'General gaming discussion',
      }),
      this.createChannel({
        name: 'voice-lobby',
        type: 'voice',
        description: 'Voice chat for gaming',
      }),
      this.createChannel({
        name: 'stream-room',
        type: 'stream',
        description: 'Streaming channel',
      }),
    ];
  }

  static createWorkspaceChannels(): ChannelCreationData[] {
    return [
      this.createChannel({
        name: 'general',
        type: 'text',
        description: 'General workspace discussion',
      }),
      this.createChannel({
        name: 'meetings',
        type: 'voice',
        description: 'Meeting room',
      }),
      this.createChannel({
        name: 'private-admin',
        type: 'text',
        description: 'Admin only channel',
        isPrivate: true,
      }),
    ];
  }

  /**
   * Create message scenarios
   */
  static createWelcomeMessage(): MessageData {
    return this.createMessage({
      content: '🎉 Welcome to our clan! Feel free to introduce yourself.',
      type: 'text',
    });
  }

  static createAnnouncementMessage(): MessageData {
    return this.createMessage({
      content: '📢 Important announcement: Please read the clan rules in the pinned messages.',
      type: 'text',
    });
  }

  static createImageMessage(imagePath: string): MessageData {
    return this.createMessage({
      content: 'Check out this image!',
      type: 'image',
      attachments: [imagePath],
    });
  }

  static createMultipleMessages(count: number): MessageData[] {
    return Array.from({ length: count }, (_, index) =>
      this.createMessage({
        content: `Test message ${index + 1}: ${faker.lorem.sentence()}`,
      })
    );
  }

  /**
   * Create test user data
   */
  static createTestUsers(count: number): UserInvitationData[] {
    return Array.from({ length: count }, () => this.createUserInvitation());
  }

  static createAdminUser(): UserInvitationData {
    return this.createUserInvitation({
      role: 'admin',
      username: `admin_${Date.now()}`,
    });
  }

  static createModeratorUser(): UserInvitationData {
    return this.createUserInvitation({
      role: 'moderator',
      username: `mod_${Date.now()}`,
    });
  }

  /**
   * Create complex test scenarios
   */
  static createCompleteClanScenario(): {
    clan: ClanCreationData;
    channels: ChannelCreationData[];
    messages: MessageData[];
    users: UserInvitationData[];
  } {
    return {
      clan: this.createGamingClan(),
      channels: this.createGamingChannels(),
      messages: [
        this.createWelcomeMessage(),
        this.createAnnouncementMessage(),
        ...this.createMultipleMessages(3),
      ],
      users: [this.createAdminUser(), this.createModeratorUser(), ...this.createTestUsers(3)],
    };
  }

  static createMinimalClanScenario(): {
    clan: ClanCreationData;
    channels: ChannelCreationData[];
    messages: MessageData[];
  } {
    return {
      clan: this.createClan(),
      channels: [this.createChannel()],
      messages: [this.createWelcomeMessage()],
    };
  }

  /**
   * Utility methods for data generation
   */
  static generateUniqueId(prefix: string = 'test'): string {
    return `${prefix}_${Date.now()}_${faker.string.alphanumeric(6)}`;
  }

  static generateClanName(category: string = 'test'): string {
    return `${category}_${faker.company.name().replace(/\s+/g, '_')}_${Date.now()}`;
  }

  static generateChannelName(prefix: string = 'channel'): string {
    return `${prefix}-${faker.word.noun()}-${Date.now()}`.toLowerCase();
  }

  static generateTestEmail(domain: string = 'testmezon.com'): string {
    return `test.${faker.internet.userName()}@${domain}`;
  }
}
