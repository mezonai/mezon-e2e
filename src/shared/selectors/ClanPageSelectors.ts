import { generateE2eSelector } from '@/utils/generateE2eSelector';

/**
 * Centralized selector management for ClanPage
 * This approach provides:
 * - Single source of truth for selectors
 * - Easy maintenance and updates
 * - Consistent selector strategy
 * - Better testability
 */
export class ClanPageSelectors {
  public readonly navigation = {
    createClanButton: generateE2eSelector('clan_page.side_bar.button.add_clan'),
    clanNameTitle: generateE2eSelector('clan_page.header.title.clan_name'),
    invitePeopleButton: generateE2eSelector('clan_page.header.modal_panel.invite_people'),
    createChannelButton: generateE2eSelector('clan_page.side_bar.button.add_channel'),
  };

  public readonly modals = {
    createClan: {
      nameInput: generateE2eSelector('clan_page.modal.create_clan.input.clan_name'),
      confirmButton: generateE2eSelector('clan_page.modal.create_clan.button.confirm'),
      cancelButton: generateE2eSelector('clan_page.modal.create_clan.button.cancel'),
    },
    createChannel: {
      typeText: generateE2eSelector('clan_page.modal.create_channel.type.text'),
      typeVoice: generateE2eSelector('clan_page.modal.create_channel.type.voice'),
      typeStream: generateE2eSelector('clan_page.modal.create_channel.type.stream'),
      nameInput: generateE2eSelector('clan_page.modal.create_channel.input.channel_name'),
      privateToggle: generateE2eSelector('clan_page.modal.create_channel.toggle.is_private'),
      confirmButton: generateE2eSelector('clan_page.modal.create_channel.button.confirm'),
      cancelButton: generateE2eSelector('clan_page.modal.create_channel.button.cancel'),
    },
  };

  public readonly sidebar = {
    clanItem: generateE2eSelector('clan_page.side_bar.clan_item.name'),
    channelItem: generateE2eSelector('clan_page.channel_list.item.name'),
    channelIcon: generateE2eSelector('clan_page.channel_list.item.icon'),
  };

  public readonly chat = {
    // Using existing chat selectors from the main structure
    messageInput: generateE2eSelector('chat.mention.input'),
    messageItem: generateE2eSelector('chat.direct_message.message.item'),
  };

  // Fallback selectors for cases where e2e selectors might not be available
  public readonly fallback = {
    createClanButton: [
      'div[onclick*="openCreateClanModal"]',
      'button[aria-label*="create clan" i]',
      '.create-clan-btn',
      'div:has(p:has-text("+"))',
    ],
    clanNameTitle: [
      '.clan-name',
      '.clan-header h1',
      'h1[class*="clan"]',
      '[data-testid="clan-name"]',
    ],
    messageInput: [
      'textarea#editorReactMentionChannel',
      'textarea[placeholder*="thoughts"]',
      'textarea[placeholder*="message"]',
      '.message-input',
    ],
  };

  /**
   * Get selector with fallback strategy
   */
  public getWithFallback(primary: string, fallbacks: string[]): string {
    return `${primary}, ${fallbacks.join(', ')}`;
  }
}
