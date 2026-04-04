import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

export default class ProfileSelector {
  constructor(private readonly page: Page) {
    this.page = page;
  }

  readonly buttons = {
    editUserprofile: this.page.locator(generateE2eSelector('user_setting.account.edit_profile')),
    editDisplayName: this.page.locator(
      generateE2eSelector('user_setting.account.edit_display_name')
    ),
    editUserName: this.page.locator(generateE2eSelector('user_setting.account.edit_username')),
    saveChangesClanProfile: this.page.locator(
      `${generateE2eSelector('user_setting.profile.clan_profile')} ${generateE2eSelector('button.base')}`,
      { hasText: 'Save Changes' }
    ),
    saveChangesUserProfile: this.page.locator(
      generateE2eSelector('user_setting.profile.user_profile.button.save_changes')
    ),
    changeAvatar: this.page.locator(
      generateE2eSelector('user_setting.profile.clan_profile.button_change_avatar')
    ),
    userSettingProfile: this.page.locator(
      generateE2eSelector('user_setting.profile.button_setting')
    ),
    applyImageAvatar: this.page.locator(
      generateE2eSelector('user_setting.profile.user_profile.upload.avatar_input.apply_button')
    ),
    closeSettingProfile: this.page.locator(
      generateE2eSelector('user_setting.account.exit_setting')
    ),
  };

  readonly accountPage = {
    info: this.page.locator(generateE2eSelector('user_setting.account.info')),
    image: this.page.locator(
      `${generateE2eSelector('user_setting.account.info')} ${generateE2eSelector('avatar.image')}`
    ),
  };

  readonly tabs = {
    profile: this.page.locator(generateE2eSelector('user_setting.profile.tab_profile')),
    userProfile: this.page.locator(generateE2eSelector('user_setting.profile.user_profile.button')),
    clanProfile: this.page.locator(generateE2eSelector('user_setting.profile.clan_profile.button')),
    account: this.page.locator(generateE2eSelector('user_setting.account.tab_account')),
    logout: this.page.locator(generateE2eSelector('user_setting.logout')),
  };

  readonly userProfile = {
    avatar: this.page.locator(
      `${generateE2eSelector('user_setting.profile.user_profile.preview.avatar')} ${generateE2eSelector('avatar.image')}`
    ),
    displayName: this.page.locator(
      `${generateE2eSelector('user_setting.profile.user_profile.preview.display_name')}`
    ),
  };

  readonly clanProfile = {
    avatar: this.page.locator(
      `${generateE2eSelector('user_setting.profile.user_profile.preview.avatar')} ${generateE2eSelector('avatar.image')}`
    ),
  };

  readonly inputs = {
    nickname: this.page.locator(
      generateE2eSelector('user_setting.profile.clan_profile.input_nickname')
    ),
    displayName: this.page.locator(
      `${generateE2eSelector('user_setting.profile.user_profile.input.display_name')}`
    ),
    aboutMe: this.page.locator(
      `${generateE2eSelector('user_setting.profile.user_profile.input.about_me')}`
    ),
    mention: this.page.locator(`${generateE2eSelector('mention.input')}`),
  };

  readonly texts = {
    aboutMeLength: this.page.locator(
      generateE2eSelector('user_setting.profile.user_profile.text.about_me_length')
    ),
    aboutMeInShortProfile: this.page.locator(generateE2eSelector('mention.text.about_me')),
  };

  readonly profiles = {
    displayName: this.page.locator(generateE2eSelector('base_profile.display_name')),
    userStatus: this.page.locator(generateE2eSelector('base_profile.user_status')),
  };

  readonly footerProfile = {
    container: this.page.locator(generateE2eSelector('footer_profile.avatar')),
    userStatus: this.page.locator(generateE2eSelector('footer_profile.user_status')),
  };

  readonly shortProfile = {
    buttons: {
      editCustomStatus: this.page.locator(
        generateE2eSelector('short_profile.action.button.status'),
        {
          has: this.page.locator('li', {
            hasText: /^(Set Custom Status|Edit Custom Status)$/,
          }),
        }
      ),
    },
    modal: {
      container: this.page.locator(
        generateE2eSelector('user_setting.profile.user_profile.preview.avatar')
      ),
      customStatus: {
        container: this.page.locator(generateE2eSelector('short_profile.modal.custom_status')),
        input: this.page.locator(generateE2eSelector('short_profile.modal.custom_status.input')),
        buttons: {
          cancel: this.page.locator(
            generateE2eSelector('short_profile.modal.custom_status.button.cancel')
          ),
          save: this.page.locator(
            generateE2eSelector('short_profile.modal.custom_status.button.save')
          ),
        },
      },
    },
    activityStatus: {
      container: this.page.locator(generateE2eSelector('short_profile.activity_status')),
      actions: {
        customStatus: this.page.locator(
          generateE2eSelector('short_profile.activity_status.button.custom')
        ),
        clearStatus: this.page.locator(
          generateE2eSelector('short_profile.activity_status.button.clear')
        ),
      },
    },
    profileStatus: {
      triggerButton: this.page.locator(generateE2eSelector('short_profile.action.button.base')),
      statusButton: this.page.locator(generateE2eSelector('short_profile.action.button.status')),
      status: this.page.locator(generateE2eSelector('icon.profile_status')),
    },
  };
}
