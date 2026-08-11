import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

export default class MessageShortProfileSelector {
  constructor(private readonly page: Page) {}

  readonly avatar = this.page.locator(
    `${generateE2eSelector('user_setting.profile.user_profile.preview.avatar')} ${generateE2eSelector('avatar.image')}`
  );
  readonly displayName = this.page.locator(generateE2eSelector('short_profile.display_name'));
  readonly username = this.page.locator(generateE2eSelector('short_profile.username'));

  readonly input = {
    sendMessage: this.page.locator(generateE2eSelector('short_profile.input.send_message')),
  };

  readonly button = {
    addRole: this.page.locator(generateE2eSelector('short_profile.role.button.add')),
    editProfile: this.page.locator(generateE2eSelector('short_profile.button.edit_profile')),
    voice: this.page.locator(generateE2eSelector('invoice.button.component')),
  };

  readonly rolePopover = {
    item: this.page.locator(generateE2eSelector('short_profile.role.popover.item')),
  };

  readonly role = {
    name: this.page.locator(generateE2eSelector('clan_page.channel_list.members.role.role_name')),
    color: this.page.locator(generateE2eSelector('clan_page.channel_list.members.role.role_color')),
  };
}
