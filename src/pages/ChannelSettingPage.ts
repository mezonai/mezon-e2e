import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import ChannelSettingSelector from '@/data/selectors/ChannelSettingSelector';

export class ChannelSettingPage extends BasePage {
  private readonly selector: ChannelSettingSelector;

  constructor(page: Page) {
    super(page);
    this.selector = new ChannelSettingSelector(page);
  }

  async createChannelWebhook(): Promise<void> {
    await this.selector.side_bar_buttons.integrations.click();
    await this.selector.webhook.create_webhook_button.click();
    await this.selector.webhook.new_webhook_button.click();
    await this.page.waitForTimeout(500);
    await this.selector.webhook.view_webhook_button.click();
    await this.page.waitForTimeout(500);
  }

  async changeChannelStatus(): Promise<boolean> {
    await this.selector.side_bar_buttons.permissions.click();
    await this.selector.permissions.button.change_status.click();
    try {
      await this.selector.permissions.modal.ask_change.button.save_changes.waitFor({
        state: 'visible',
      });
      await this.selector.permissions.modal.ask_change.button.save_changes.click();
      return true;
    } catch {
      return false;
    }
  }

  async verifyChannelStatusIsPrivate(channelName: string): Promise<boolean> {
    await this.page.waitForLoadState('networkidle');
    try {
      await this.selector.permissions.section.member_role_section.waitFor({ state: 'visible' });
      await this.selector.permissions.section.advanced_permissions_section.waitFor({
        state: 'visible',
      });
    } catch {
      return false;
    }

    await this.selector.permissions.section.member_role_management.member_list.waitFor({
      state: 'visible',
    });
    const memberItemCount =
      await this.selector.permissions.section.member_role_management.member_list.count();
    if (memberItemCount !== 1) return false;

    await this.selector.button.close_settings.click();

    const membersButton = this.selector.header.button.member.nth(0);
    await membersButton.waitFor({ state: 'visible' });
    await membersButton.click();

    const members = this.selector.secondarySideBar.member.item;
    await members.waitFor({ state: 'visible' });
    const memberCount = await members.count();
    if (memberCount !== 1) return false;

    const channelIconLock = this.selector.sidebar.channelItem.item.filter({
      has: this.selector.sidebar.channelItem.iconHashtagLock,
      hasText: channelName,
    });
    await channelIconLock.waitFor({ state: 'visible' });
    return channelIconLock.isVisible();
  }

  async verifyChannelStatusIsPublic(channelName: string): Promise<boolean> {
    await this.page.waitForLoadState('networkidle');
    try {
      await this.selector.permissions.section.member_role_section.waitFor({ state: 'hidden' });
      await this.selector.permissions.section.advanced_permissions_section.waitFor({
        state: 'hidden',
      });
    } catch {
      return false;
    }

    await this.selector.button.close_settings.click();

    const channelIconLock = this.selector.sidebar.channelItem.item.filter({
      has: this.selector.sidebar.channelItem.iconHashtag,
      hasText: channelName,
    });
    await channelIconLock.waitFor({ state: 'visible' });
    return channelIconLock.isVisible();
  }

  async openQuickMenuSettings(): Promise<void> {
    await expect(this.selector.side_bar_buttons.quick_menu).toBeVisible({ timeout: 3000 });

    await this.selector.side_bar_buttons.quick_menu.click();
    await this.page.waitForTimeout(500);
  }

  async openFlashMessageModal(): Promise<void> {
    await expect(this.selector.quick_menu.flashMessagesTab).toBeVisible({ timeout: 3000 });

    await this.selector.quick_menu.flashMessagesTab.click();
    await expect(this.selector.quick_menu.button.addFlashMessage).toBeVisible({
      timeout: 3000,
    });

    await this.selector.quick_menu.button.addFlashMessage.click();
    await expect(this.selector.quick_menu.modal.container).toBeVisible({ timeout: 3000 });
  }

  async createFlashMessage(command: string, messageContent: string): Promise<void> {
    await this.selector.quick_menu.modal.input.command.fill(command);
    await this.selector.quick_menu.modal.input.messageContent.fill(messageContent);
    await this.selector.quick_menu.modal.button.submit.click();
    expect(this.selector.quick_menu.modal.container).toBeHidden({ timeout: 5000 });
  }

  async verifyFlashMessageInQuickMenuList(command: string, messageContent: string): Promise<void> {
    const itemLocator = this.page.locator(
      generateE2eSelector('channel_setting_page.quick_menu.item')
    );

    const commandLocator = this.page
      .locator(generateE2eSelector('channel_setting_page.quick_menu.item.command'))
      .filter({ hasText: command });

    const messageLocator = this.page
      .locator(generateE2eSelector('channel_setting_page.quick_menu.item.message_content'))
      .filter({ hasText: messageContent });

    const matchedItem = itemLocator.filter({ has: commandLocator }).filter({ has: messageLocator });

    await expect(matchedItem).toBeVisible();
  }

  async closeChannelSettings() {
    await this.selector.button.close_settings.click();
    await expect(this.selector.side_bar_buttons.quick_menu).toBeHidden({ timeout: 3000 });
  }

  async deleteChannel() {
    const deleteButton = this.selector.side_bar_buttons.deleteChannel;
    await expect(deleteButton).toBeVisible({ timeout: 3000 });

    await deleteButton.click();
    const popup = this.page.locator('div.fixed.inset-0.flex.items-center.justify-center.z-50');
    await expect(popup).toBeVisible({ timeout: 5000 });

    const confirmButton = popup.locator(generateE2eSelector('modal.confirm_modal.button.confirm'));
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    await expect(popup).toBeHidden({ timeout: 5000 });
    await this.page.waitForTimeout(2000);
  }

  async openPermissionsTab() {
    await expect(this.selector.side_bar_buttons.permissions).toBeVisible({ timeout: 3000 });
    await this.selector.side_bar_buttons.permissions.click();
  }

  async updateChannelStatusAndOpenAddMembersRolesModal() {
    const checkbox = this.selector.permissions.button.change_status;
    await expect(checkbox).toBeVisible({ timeout: 3000 });
    await checkbox.click();

    const isChecked = await checkbox.isChecked();
    expect(isChecked).toBe(true);

    const addButton = this.selector.permissions.button.add_members_roles;
    await expect(addButton).toBeVisible({ timeout: 3000 });
    await addButton.click();

    await expect(
      this.selector.permissions.section.member_role_management.modal_container
    ).toBeVisible({
      timeout: 3000,
    });
  }

  async addMembersAndRolesForPrivateChannel(roleName: string, username: string) {
    const modal = this.selector.permissions.section.member_role_management.modal_container;

    await expect(modal).toBeVisible({ timeout: 3000 });

    const roles = this.selector.permissions.section.member_role_management.modal.role_item;
    const roleTitles = this.selector.permissions.section.member_role_management.modal.role_title;
    const roleCheckboxes =
      this.selector.permissions.section.member_role_management.modal.role_checkbox;

    const roleCount = await roles.count();
    for (let i = 0; i < roleCount; i++) {
      const title = (await roleTitles.nth(i).innerText()).trim().toLowerCase();
      if (title === roleName.trim().toLowerCase()) {
        await roleCheckboxes.nth(i).check();
        console.log(`✅ Checked role: ${title}`);
        break;
      }
    }

    const members = this.selector.permissions.section.member_role_management.modal.member_item;
    const memberUsernames =
      this.selector.permissions.section.member_role_management.modal.member_username;
    const memberCheckboxes =
      this.selector.permissions.section.member_role_management.modal.member_checkbox;

    const memberCount = await members.count();
    for (let i = 0; i < memberCount; i++) {
      const name = (await memberUsernames.nth(i).innerText()).trim().toLowerCase();
      if (name === username.trim().toLowerCase()) {
        await memberCheckboxes.nth(i).check();
        console.log(`✅ Checked member: ${name}`);
        break;
      }
    }

    await this.selector.permissions.button.submit.click();
    await expect(modal).toBeHidden({ timeout: 3000 });
  }

  async verifyRoleAndMemberExistBeforeSave(roleName: string, memberName: string) {
    const { member_role_management } = this.selector.permissions.section;

    const roleItem = member_role_management.role_item.filter({ hasText: roleName });
    await expect(roleItem, `❌ Role "${roleName}" not found in the list`).toBeVisible({
      timeout: 3000,
    });
    console.log(`✅ Role "${roleName}" is visible in the list`);

    const memberItem = member_role_management.member_item.filter({ hasText: memberName });
    await expect(memberItem, `❌ Member "${memberName}" not found in the list`).toBeVisible({
      timeout: 3000,
    });
    console.log(`✅ Member "${memberName}" is visible in the list`);
  }

  async verifyRoleAndMemberExistAfterSave(roleName: string, memberName: string) {
    const { member_role_management } = this.selector.permissions.section;
    const save_changes = this.selector.permissions.modal.ask_change.button.save_changes;
    await expect(save_changes).toBeVisible({ timeout: 3000 });
    await save_changes.click();
    await this.page.waitForTimeout(2000);

    const roleItem = member_role_management.role_item.filter({ hasText: roleName });
    await expect(roleItem, `❌ Role "${roleName}" not found in the list`).toBeVisible({
      timeout: 3000,
    });
    console.log(`✅ Role "${roleName}" is visible in the list`);

    const memberItem = member_role_management.member_item.filter({ hasText: memberName });
    await expect(memberItem, `❌ Member "${memberName}" not found in the list`).toBeVisible({
      timeout: 3000,
    });
    console.log(`✅ Member "${memberName}" is visible in the list`);

    const { container, item } = this.selector.permissions.section.list_roles_members;
    await expect(container, '❌ Combined list (list_roles_members) not visible').toBeVisible({
      timeout: 3000,
    });

    const roleInList = item.filter({ hasText: roleName });
    await expect(roleInList, `❌ Role "${roleName}" not found in combined list`).toBeVisible({
      timeout: 3000,
    });
    console.log(`✅ Role "${roleName}" appears in combined list`);

    const memberInList = item.filter({ hasText: memberName });
    await expect(memberInList, `❌ Member "${memberName}" not found in combined list`).toBeVisible({
      timeout: 3000,
    });
    console.log(`✅ Member "${memberName}" appears in combined list`);
  }

  async getSideBarChannelLabel() {
    return this.selector.side_bar_buttons.channel_label;
  }
}
