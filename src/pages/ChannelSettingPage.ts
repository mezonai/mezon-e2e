import ChannelSettingSelector from '@/data/selectors/ChannelSettingSelector';
import ClanSelector from '@/data/selectors/ClanSelector';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ChannelSettingPage extends BasePage {
  private readonly selector: ChannelSettingSelector;

  constructor(page: Page) {
    super(page);
    this.selector = new ChannelSettingSelector(page);
  }

  async createChannelWebhook(): Promise<void> {
    await this.selector.side_bar_buttons.integrations.click();
    await this.selector.webhook.create_webhook_button.click();
    await expect(this.selector.webhook.new_webhook_button).toBeVisible({ timeout: 5000 });
    await this.selector.webhook.new_webhook_button.click();
    await expect(this.selector.webhook.view_webhook_button).toBeVisible({ timeout: 5000 });
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

  async updateOverview(channelName: string, topic: string): Promise<void> {
    await expect(this.selector.overview.channelName).toBeVisible({ timeout: 5000 });
    await this.selector.overview.channelName.fill(channelName);
    await this.selector.overview.channelTopic.fill(topic);
    await expect(this.selector.button.save_changes).toBeVisible({ timeout: 5000 });
    await this.selector.button.save_changes.click();
    await expect(this.selector.button.save_changes).toBeHidden({ timeout: 10000 });
  }

  async verifyOverview(channelName: string, topic: string): Promise<void> {
    await expect(this.selector.overview.channelName).toHaveValue(channelName, { timeout: 5000 });
    await expect(this.selector.overview.channelTopic).toHaveValue(topic, { timeout: 5000 });
    await expect(this.selector.side_bar_buttons.channel_label).toHaveText(channelName);
  }

  async verifyCoreSettingsTabsVisible(): Promise<void> {
    await expect(this.selector.side_bar_buttons.overview).toBeVisible({ timeout: 5000 });
    await expect(this.selector.side_bar_buttons.category).toBeVisible({ timeout: 5000 });
    await expect(this.selector.side_bar_buttons.permissions).toBeVisible({ timeout: 5000 });
  }

  async openCategoryTab(): Promise<void> {
    await expect(this.selector.side_bar_buttons.category).toBeVisible({ timeout: 5000 });
    await this.selector.side_bar_buttons.category.click();
    await expect(this.selector.category.dropdown).toBeVisible({ timeout: 5000 });
  }

  async verifyCategoryChannelName(channelName: string): Promise<void> {
    await expect(this.selector.category.channelName).toHaveText(channelName);
  }

  async verifyCategory(categoryName: string): Promise<void> {
    await expect(this.selector.category.dropdown).toContainText(categoryName, { timeout: 10000 });
  }

  async changeCategory(categoryName: string): Promise<void> {
    await this.selector.category.dropdown.click();
    const category = this.selector.category.item.filter({
      hasText: new RegExp(`^${categoryName}$`, 'i'),
    });
    await expect(category).toBeVisible({ timeout: 5000 });
    await category.click();
    await expect
      .poll(
        async () => {
          if (!(await this.selector.category.dropdown.isVisible())) return true;
          return (await this.selector.category.dropdown.innerText())
            .toLowerCase()
            .includes(categoryName.toLowerCase());
        },
        { timeout: 10000 }
      )
      .toBe(true);
  }

  async setPrivateMode(enabled: boolean): Promise<void> {
    await this.openPermissionsTab();
    const toggle = this.selector.permissions.button.change_status;
    await expect(toggle).toBeVisible({ timeout: 5000 });
    if ((await toggle.isChecked()) !== enabled) {
      await toggle.click();
      await expect(this.selector.permissions.modal.ask_change.button.save_changes).toBeVisible({
        timeout: 5000,
      });
      await this.selector.permissions.modal.ask_change.button.save_changes.click();
      await expect(toggle).toBeChecked({ checked: enabled, timeout: 10000 });
    }
  }

  async verifyChannelStatusIsPrivate(channelName: string): Promise<boolean> {
    await this.page.waitForTimeout(2000);

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
    await this.page.waitForTimeout(2000);
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
    await expect(this.selector.quick_menu.flashMessagesTab).toBeVisible({ timeout: 3000 });
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

  async openFlashMessagesTab(): Promise<void> {
    await expect(this.selector.quick_menu.flashMessagesTab).toBeVisible({ timeout: 3000 });
    await this.selector.quick_menu.flashMessagesTab.click();
    await expect(this.selector.quick_menu.button.addFlashMessage).toBeVisible({ timeout: 3000 });
  }

  async getQuickActionTabCount(type: 'flash-message' | 'quick-menu'): Promise<number> {
    const tab =
      type === 'flash-message'
        ? this.selector.quick_menu.flashMessagesTab
        : this.selector.quick_menu.quickMenusTab;
    await expect(tab).toBeVisible({ timeout: 3000 });
    const text = await tab.innerText();
    const count = text.match(/(\d+)\s*$/)?.[1];
    if (count === undefined) throw new Error(`Could not read item count from tab: ${text}`);
    return Number(count);
  }

  async verifyQuickActionTabCount(
    type: 'flash-message' | 'quick-menu',
    expectedCount: number
  ): Promise<void> {
    await expect
      .poll(() => this.getQuickActionTabCount(type), { timeout: 5000 })
      .toBe(expectedCount);
  }

  async openQuickMenusTab(): Promise<void> {
    await expect(this.selector.quick_menu.quickMenusTab).toBeVisible({ timeout: 3000 });
    await this.selector.quick_menu.quickMenusTab.click();
    await expect(this.selector.quick_menu.button.addQuickMenu).toBeVisible({ timeout: 3000 });
  }

  async openQuickMenuModal(): Promise<void> {
    await this.openQuickMenusTab();
    await this.selector.quick_menu.button.addQuickMenu.click();
    await expect(this.selector.quick_menu.modal.container).toBeVisible({ timeout: 3000 });
  }

  async createQuickMenu(menuName: string): Promise<void> {
    await this.selector.quick_menu.modal.input.command.fill(menuName);
    await this.selector.quick_menu.modal.button.submit.click();
    await expect(this.selector.quick_menu.modal.container).toBeHidden({ timeout: 5000 });
    await this.verifyQuickMenuInList(menuName);
  }

  async verifyQuickMenuInList(menuName: string): Promise<void> {
    const quickMenuItem = this.getQuickMenuItem(menuName);
    await expect(quickMenuItem).toBeVisible({ timeout: 5000 });
    await expect(quickMenuItem.locator(this.selector.quick_menu.item.type)).toHaveText(
      'Quick Menu'
    );
    await expect(quickMenuItem).toContainText('Triggers bot event');
  }

  private getQuickMenuItem(menuName: string): Locator {
    return this.selector.quick_menu.item.container.filter({
      has: this.selector.quick_menu.item.command.filter({ hasText: menuName }),
    });
  }

  async editQuickMenu(currentName: string, newName: string): Promise<void> {
    const quickMenuItem = this.getQuickMenuItem(currentName);
    await expect(quickMenuItem).toBeVisible({ timeout: 5000 });
    await quickMenuItem.locator(this.selector.quick_menu.item.button.edit).click();
    await expect(this.selector.quick_menu.modal.container).toBeVisible({ timeout: 3000 });

    await this.selector.quick_menu.modal.input.command.fill(newName);
    await this.selector.quick_menu.modal.button.submit.click();

    await expect(this.selector.quick_menu.modal.container).toBeHidden({ timeout: 5000 });
    await expect(this.getQuickMenuItem(currentName)).toHaveCount(0);
    await this.verifyQuickMenuInList(newName);
  }

  async deleteQuickMenu(menuName: string): Promise<void> {
    const quickMenuItem = this.getQuickMenuItem(menuName);
    await expect(quickMenuItem).toBeVisible({ timeout: 5000 });
    await quickMenuItem.locator(this.selector.quick_menu.item.button.delete).click();

    const confirmDeleteButton = this.page.getByRole('button', { name: 'Delete', exact: true });
    await expect(confirmDeleteButton).toBeVisible({ timeout: 3000 });
    await confirmDeleteButton.click();
    await expect(quickMenuItem).toHaveCount(0, { timeout: 5000 });
  }

  async createFlashMessage(command: string, messageContent: string): Promise<void> {
    await this.selector.quick_menu.modal.input.command.fill(command);
    await this.selector.quick_menu.modal.input.messageContent.fill(messageContent);
    await this.selector.quick_menu.modal.button.submit.click();
    await expect(this.selector.quick_menu.modal.container).toBeHidden({ timeout: 5000 });
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

  private getFlashMessageItem(command: string): Locator {
    return this.selector.quick_menu.item.container.filter({
      has: this.selector.quick_menu.item.command.filter({ hasText: command }),
    });
  }

  async editFlashMessage(
    currentCommand: string,
    newCommand: string,
    newMessageContent: string
  ): Promise<void> {
    const flashMessageItem = this.getFlashMessageItem(currentCommand);
    await expect(flashMessageItem).toBeVisible({ timeout: 5000 });
    await flashMessageItem.locator(this.selector.quick_menu.item.button.edit).click();
    await expect(this.selector.quick_menu.modal.container).toBeVisible({ timeout: 3000 });

    await this.selector.quick_menu.modal.input.command.fill(newCommand);
    await this.selector.quick_menu.modal.input.messageContent.fill(newMessageContent);
    await this.selector.quick_menu.modal.button.submit.click();

    await expect(this.selector.quick_menu.modal.container).toBeHidden({ timeout: 5000 });
    await expect(this.getFlashMessageItem(currentCommand)).toHaveCount(0);
    await this.verifyFlashMessageInQuickMenuList(newCommand, newMessageContent);
  }

  async deleteFlashMessage(command: string): Promise<void> {
    const flashMessageItem = this.getFlashMessageItem(command);
    await expect(flashMessageItem).toBeVisible({ timeout: 5000 });
    await flashMessageItem.locator(this.selector.quick_menu.item.button.delete).click();

    const confirmDeleteButton = this.page.getByRole('button', { name: 'Delete', exact: true });
    await expect(confirmDeleteButton).toBeVisible({ timeout: 3000 });
    await confirmDeleteButton.click();
    await expect(flashMessageItem).toHaveCount(0, { timeout: 5000 });
  }

  async closeChannelSettings() {
    await this.selector.button.close_settings.click();
    await expect(this.selector.side_bar_buttons.quick_menu).toBeHidden({ timeout: 3000 });
  }

  async closeChannelSettingsIfVisible(): Promise<void> {
    if (!(await this.selector.button.close_settings.isVisible({ timeout: 1000 }))) return;

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
    await this.page.waitForTimeout(1000);
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

    await this.openAddMembersRolesModal();
  }

  async addMembersAndRolesForPrivateChannel(roleName?: string, username?: string) {
    const modal = this.selector.permissions.section.member_role_management.modal_container;

    await expect(modal).toBeVisible({ timeout: 3000 });

    const roleTitles = this.selector.permissions.section.member_role_management.modal.role_title;
    const roleCheckboxes =
      this.selector.permissions.section.member_role_management.modal.role_checkbox;

    if (roleName) {
      let roleFound = false;
      const expectedRole = roleName.trim().toLowerCase();
      const roleCount = await roleTitles.count();
      for (let i = 0; i < roleCount; i++) {
        const title = (await roleTitles.nth(i).innerText()).trim().toLowerCase();
        if (title === expectedRole) {
          await roleCheckboxes.nth(i).check();
          console.log(`✅ Checked role: ${title}`);
          roleFound = true;
          break;
        }
      }
      expect(roleFound, `Role "${roleName}" was not found in the access modal`).toBe(true);
    }

    const memberUsernames =
      this.selector.permissions.section.member_role_management.modal.member_username;
    const memberCheckboxes =
      this.selector.permissions.section.member_role_management.modal.member_checkbox;

    if (username) {
      let memberFound = false;
      const expectedUsername = username.trim().toLowerCase();
      const memberCount = await memberUsernames.count();
      for (let i = 0; i < memberCount; i++) {
        const name = (await memberUsernames.nth(i).innerText()).trim().toLowerCase();
        if (name === expectedUsername) {
          await memberCheckboxes.nth(i).check();
          console.log(`✅ Checked member: ${name}`);
          memberFound = true;
          break;
        }
      }
      expect(memberFound, `Member "${username}" was not found in the access modal`).toBe(true);
    }

    await this.selector.permissions.button.submit.click();
    await expect(modal).toBeHidden({ timeout: 3000 });
  }

  async openAddMembersRolesModal(): Promise<void> {
    const addButton = this.selector.permissions.button.add_members_roles;
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();
    await expect(
      this.selector.permissions.section.member_role_management.modal_container
    ).toBeVisible({ timeout: 5000 });
  }

  async removeMemberFromPrivateChannel(username: string): Promise<void> {
    const management = this.selector.permissions.section.member_role_management;
    const member = management.member_item.filter({ hasText: username });
    const removeButton = member
      .locator(
        `${generateE2eSelector(
          'channel_setting_page.permissions.section.member_role_management.member_list.button_remove'
        )}, button`
      )
      .first();
    await expect(member).toBeVisible({ timeout: 10000 });
    await expect(removeButton).toBeVisible({ timeout: 10000 });
    await removeButton.click();
    await expect(member).toBeHidden({ timeout: 10000 });
  }

  async removeRoleFromPrivateChannel(roleName: string): Promise<void> {
    const management = this.selector.permissions.section.member_role_management;
    const role = management.role_item.filter({ hasText: roleName });
    const removeButton = role
      .locator(
        `${generateE2eSelector(
          'channel_setting_page.permissions.section.member_role_management.role_list.button_remove'
        )}, button`
      )
      .first();
    await expect(role).toBeVisible({ timeout: 10000 });
    await expect(removeButton).toBeVisible({ timeout: 10000 });
    await removeButton.click();
    await expect(role).toBeHidden({ timeout: 10000 });
  }

  async overridePermissionsForPrivateChannel() {
    const clanSelector = new ClanSelector(this.page);
    const advancedPermissionsSection =
      this.selector.permissions.section.advanced_permissions_section;
    await expect(advancedPermissionsSection).toBeVisible({ timeout: 3000 });
    const overrideDeleteButton = advancedPermissionsSection
      .locator(clanSelector.clanSettings.roleList.override.item, {
        hasText: 'Send Messages',
      })
      .locator(clanSelector.clanSettings.roleList.override.button.remove)
      .first();
    await expect(overrideDeleteButton).toBeVisible({ timeout: 3000 });
    await overrideDeleteButton.click();
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

  async savePermissionChanges() {
    const save_changes = this.selector.permissions.modal.ask_change.button.save_changes;
    await expect(save_changes).toBeVisible({ timeout: 3000 });
    await save_changes.click();
    await expect(save_changes).toBeHidden({ timeout: 5000 });
  }

  async verifyRoleAndMemberExistAfterSave(roleName: string, memberName: string) {
    const { member_role_management } = this.selector.permissions.section;
    await this.savePermissionChanges();

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

  async openMemberList() {
    await this.selector.header.button.member.first().click();
  }

  async muteChannelFromHeader() {
    await expect(this.selector.header.button.mute).toBeVisible({ timeout: 3000 });
    await this.selector.header.button.mute.click();

    await expect(this.selector.mute_channel.mute_button).toBeVisible({ timeout: 3000 });
    await this.selector.mute_channel.mute_button.click();
  }

  async verifyUnmuteChannelButtonVisible() {
    await expect(this.selector.mute_channel.unmute_button).toBeVisible({ timeout: 3000 });
  }

  async unmuteChannel() {
    await expect(this.selector.mute_channel.unmute_button).toBeVisible({ timeout: 3000 });
    await this.selector.mute_channel.unmute_button.click();
    await expect(this.selector.mute_channel.mute_button).toBeVisible({ timeout: 3000 });
  }

  async isPermissionSettingsVisible(): Promise<boolean> {
    try {
      await this.selector.side_bar_buttons.permissions.waitFor({ state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  async archiveChannel(channelName: string, isThread = false) {
    if (isThread) {
      const threadItem = this.selector.sidebar.threadItem.name.filter({ hasText: channelName });
      await threadItem.first().click({ button: 'right' });
      await this.selector.archived_channels.archive_thread_button.click();
    } else {
      const channelItem = this.selector.sidebar.channelItem.item.filter({ hasText: channelName });
      await channelItem.first().click({ button: 'right' });
      await this.selector.archived_channels.archive_channel_button.click();
    }
    const confirmButton = this.selector.archived_channels.modal.confirm_button;
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();
    await expect(confirmButton).toBeHidden({ timeout: 5000 });
    const archivedItem = isThread
      ? this.selector.sidebar.threadItem.name.filter({ hasText: channelName })
      : this.selector.sidebar.channelItem.name.filter({ hasText: channelName });
    await expect(archivedItem).toBeHidden({ timeout: 5000 });
  }

  async isChannelInArchivedList(channelName: string): Promise<boolean> {
    const clanSeletor = new ClanSelector(this.page);
    await clanSeletor.buttons.clanName.click();
    await clanSeletor.buttons.clanSettings.click();
    await clanSeletor.clanSettings.buttons.sidebarItem
      .filter({ hasText: 'Archived Channels' })
      .click();
    const archivedChannelItem = this.selector.archived_channels.item.channel_name.filter({
      hasText: channelName,
    });
    try {
      await expect(archivedChannelItem).toBeVisible({ timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async restoreArchivedChannel(channelName: string): Promise<void> {
    const archivedChannelItem = this.selector.archived_channels.item.container.filter({
      hasText: channelName,
    });
    await expect(archivedChannelItem).toBeVisible({ timeout: 3000 });
    const restoreButton = archivedChannelItem
      .locator(generateE2eSelector('clan_page.settings.archived_channels.item.restore_button'))
      .first();
    await restoreButton.click();
    await expect(archivedChannelItem).toBeHidden({ timeout: 5000 });
  }
}
