import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Locator, Page } from '@playwright/test';

export default class ClanMemberSelector {
  constructor(private readonly page: Page) {}

  private readonly actionItems = this.page.locator(
    generateE2eSelector('chat.channel_message.member_list.item.actions')
  );

  readonly contextMenu = {
    memberItems: this.page.locator(generateE2eSelector('chat.channel_message.member_list.item')),
    profileButton: this.actionItems.filter({ hasText: 'Profile' }),
    banButton: this.actionItems.filter({ hasText: 'Ban' }),
    kickButton: this.actionItems.filter({ hasText: 'Kick' }),
    shareContactButton: this.actionItems.filter({ hasText: 'Share this contact' }),
    addFriendButton: this.actionItems.filter({ hasText: 'Add Friend' }),
  };

  readonly settings = {
    userContainer: this.page.locator(generateE2eSelector('clan_page.member_list')),
    memberSince: this.page.locator(generateE2eSelector('clan_page.member_list.member_since')),
    joinMezon: this.page.locator(generateE2eSelector('clan_page.member_list.join_mezon')),
    usersInfo: this.page.locator(generateE2eSelector('clan_page.member_list.user_info')),
    userDisplayName: this.page.locator(
      generateE2eSelector('clan_page.member_list.user_info.display_name')
    ),
    username: this.page.locator(generateE2eSelector('clan_page.member_list.user_info.username')),
    actionsButton: this.page.locator(generateE2eSelector('clan_page.member_list.actions')),
    transferOwnershipModal: {
      container: this.page.locator(
        generateE2eSelector('clan_page.member_list.transfer_owner_modal')
      ),
      confirmTransferInput: this.page.locator(
        generateE2eSelector('clan_page.member_list.transfer_owner_modal.input.confirm_transfer')
      ),
      confirmTransferButton: this.page.locator(generateE2eSelector('button.base'), {
        hasText: 'Transfer Ownership',
      }),
    },
  };

  readonly secondarySidebar = {
    container: this.page.locator(generateE2eSelector('clan_page.secondary_side_bar')),
    member: {
      item: this.page.locator(generateE2eSelector('clan_page.secondary_side_bar.member')),
      inVoice: this.page.locator(
        generateE2eSelector('clan_page.secondary_side_bar.member.in_voice')
      ),
      customStatus: this.page.locator(
        generateE2eSelector('clan_page.secondary_side_bar.member.user_status')
      ),
      username: this.page.locator(generateE2eSelector('chat.direct_message.chat_item.username')),
      ownerIcon: this.page.locator(generateE2eSelector('icon.owner')),
    },
  };

  getSettingsRow(username: string): Locator {
    return this.settings.userContainer.filter({
      has: this.settings.username.filter({ hasText: username }),
    });
  }

  getSecondarySidebarMember(username: string): Locator {
    return this.secondarySidebar.member.item.filter({
      has: this.secondarySidebar.member.username.filter({ hasText: username }),
    });
  }
}
