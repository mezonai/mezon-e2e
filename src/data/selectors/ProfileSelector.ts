import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

const AVATAR_IMAGE_SELECTOR = generateE2eSelector('avatar.image');
const ACCOUNT_INFO_SELECTOR = generateE2eSelector('user_setting.account.info');
const USER_PROFILE_AVATAR_SELECTOR = generateE2eSelector(
  'user_setting.profile.user_profile.preview.avatar'
);
const SAVE_CHANGES_TEXT = 'Save Changes';
const RESET_TEXT = 'Reset';

export default class ProfileSelector {
  constructor(private readonly page: Page) {}

  readonly buttons = {
    editUserprofile: this.page.locator(generateE2eSelector('user_setting.account.edit_profile')),
    editDisplayName: this.page.locator(
      generateE2eSelector('user_setting.account.edit_display_name')
    ),
    saveChangesClanProfile: this.page
      .locator(
        `${generateE2eSelector('user_setting.profile.clan_profile')} ${generateE2eSelector('button.base')}`,
        { hasText: SAVE_CHANGES_TEXT }
      )
      .or(
        this.page.locator(
          generateE2eSelector('user_setting.profile.clan_profile.button_save_changes')
        )
      )
      .or(this.page.locator('button').filter({ hasText: /^Save( Changes)?$/i })),
    resetClanProfile: this.page
      .locator(generateE2eSelector('user_setting.profile.clan_profile.button_reset'))
      .or(this.page.getByRole('button', { name: RESET_TEXT })),
    removeClanAvatar: this.page.locator(
      generateE2eSelector('user_setting.profile.clan_profile.button_remove_avatar')
    ),
    saveChangesUserProfile: this.page
      .locator(generateE2eSelector('user_setting.profile.user_profile.button.save_changes'))
      .or(this.page.locator('button').filter({ hasText: /^Save( Changes)?$/i })),
    resetUserProfile: this.page
      .locator(generateE2eSelector('user_setting.profile.user_profile.button.reset'))
      .or(this.page.getByRole('button', { name: RESET_TEXT })),
    changeAvatar: this.page.locator(
      generateE2eSelector('user_setting.profile.clan_profile.button_change_avatar')
    ),
    userSettingProfile: this.page.locator(
      generateE2eSelector('user_setting.profile.button_setting')
    ),
    applyImageAvatar: this.page
      .locator(
        generateE2eSelector('user_setting.profile.user_profile.upload.avatar_input.apply_button')
      )
      .or(this.page.locator('button').filter({ hasText: /^Apply$/i })),
    closeSettingProfile: this.page.locator(
      generateE2eSelector('user_setting.account.exit_setting')
    ),
  };

  readonly accountPage = {
    info: this.page.locator(ACCOUNT_INFO_SELECTOR),
    image: this.page.locator(`${ACCOUNT_INFO_SELECTOR} ${AVATAR_IMAGE_SELECTOR}`),
  };

  readonly tabs = {
    profile: this.page.locator(generateE2eSelector('user_setting.profile.tab_profile')),
    userProfile: this.page.locator(generateE2eSelector('user_setting.profile.user_profile.button')),
    clanProfile: this.page.locator(generateE2eSelector('user_setting.profile.clan_profile.button')),
    account: this.page.locator(generateE2eSelector('user_setting.account.tab_account')),
    language: this.page.locator(generateE2eSelector('user_setting.language.tab_language')),
    activity: this.page.locator(generateE2eSelector('user_setting.activity')),
    notification: this.page.locator(generateE2eSelector('user_setting.notification')),
    chat: this.page.locator(generateE2eSelector('user_setting.chat.tab')),
    devices: this.page.getByText('Devices', { exact: true }).first(),
    logout: this.page.locator(generateE2eSelector('user_setting.logout')),
  };

  readonly devices = {
    currentDevice: this.page.locator(
      generateE2eSelector('user_setting.devices.tab_devices.current_device')
    ),
    otherDevices: this.page.locator(
      generateE2eSelector('user_setting.devices.tab_devices.other_devices')
    ),
    noDevices: this.page.locator(
      generateE2eSelector('user_setting.devices.tab_devices.no_devices')
    ),
    item: this.page.locator(generateE2eSelector('user_setting.devices.tab_devices.item')),
    removeButton: this.page.locator(
      generateE2eSelector('user_setting.devices.tab_devices.button.remove_device')
    ),
  };

  readonly language = {
    item: this.page.locator(generateE2eSelector('user_setting.language.language_item')),
    name: this.page.locator(
      generateE2eSelector('user_setting.language.language_item.language_name')
    ),
  };

  readonly settings = {
    activitySwitch: this.page.locator(generateE2eSelector('user_setting.activity.switch')),
    notificationSwitch: this.page.locator(generateE2eSelector('user_setting.notification.switch')),
    spellingSwitch: this.page.locator(generateE2eSelector('user_setting.chat.spelling_switch')),
    quickReplySwitch: this.page.locator(
      generateE2eSelector('user_setting.chat.quick_reply_switch')
    ),
  };

  readonly userProfile = {
    avatar: this.page.locator(`${USER_PROFILE_AVATAR_SELECTOR} ${AVATAR_IMAGE_SELECTOR}`),
    displayName: this.page.locator(
      `${generateE2eSelector('user_setting.profile.user_profile.preview.display_name')}`
    ),
  };

  readonly clanProfile = {
    avatar: this.page.locator(`${USER_PROFILE_AVATAR_SELECTOR} ${AVATAR_IMAGE_SELECTOR}`),
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
      editProfile: this.page.locator(generateE2eSelector('short_profile.button.edit_profile')),
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
