import { BasePage } from '@/pages/BasePage';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

export class ClanInviteFriendModal extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private readonly AVATAR_SELECTOR = 'avatar.image';

  readonly friends = {
    item: this.page.locator(generateE2eSelector('clan_page.modal.invite_people.user_item')),
  };

  protected input = {
    clanName: this.page.locator(generateE2eSelector('clan_page.modal.create_clan.input.clan_name')),
    urlInvite: this.page.locator(generateE2eSelector('clan_page.modal.invite_people.url_invite')),
    delete: this.page.locator(generateE2eSelector('clan_page.settings.modal.delete_clan.input')),
    channelName: this.page.locator(
      `${generateE2eSelector('clan_page.channel_list.settings.overview')} input`
    ),
    mention: this.page.locator(generateE2eSelector('mention.input')),
  };

  async getInviteLink(): Promise<string> {
    await this.input.urlInvite.waitFor({ state: 'visible', timeout: 5000 });
    return await this.input.urlInvite.inputValue();
  }

  async isFriendShownInList(userName: string): Promise<boolean> {
    const friendItem = this.friends.item.filter({
      has: this.page
        .locator(generateE2eSelector(this.AVATAR_SELECTOR))
        .filter({ hasText: userName })
        .or(this.page.locator(`${generateE2eSelector(this.AVATAR_SELECTOR)}[alt="${userName}"]`)),
    });

    const count = await friendItem.count();
    return count > 0;
  }
}
