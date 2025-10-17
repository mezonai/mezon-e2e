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
