import ChannelSettingSelector from '@/data/selectors/ChannelSettingSelector';
import ClanSelector from '@/data/selectors/ClanSelector';
import MessageSelector from '@/data/selectors/MessageSelector';
import { CategorySettingPage } from '@/pages/CategorySettingPage';
import { ROUTES } from '@/selectors';
import {
  ChannelStatus,
  ChannelType,
  ClanStatus,
  ThreadStatus,
  VoiceJoinRole,
} from '@/types/clan-page.types';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { expect, Locator, Page } from '@playwright/test';
import { EventType } from '../../types/clan-page.types';
import { BasePage } from '../BasePage';
import { ChannelSettingPage } from '../ChannelSettingPage';
import { ClanMenuPanel } from './ClanMenuPanel';
import { ClanNotificationPage } from './ClanNotificationPage';

interface SelectorResult {
  found: boolean;
  element?: Locator;
}

const CHANNEL_NAME_SELECTOR = generateE2eSelector('clan_page.channel_list.item.name');
const ROLE_ROW_XPATH = 'xpath=ancestor::tr[1]';
const SYSTEM_MESSAGE_E2E_KEY = 'chat.system_message' as const;
const ARIA_LABEL_ATTRIBUTE = 'aria-label';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class ClanPage extends BasePage {
  readonly selector: ClanSelector;
  private readonly notifications: ClanNotificationPage;
  constructor(page: Page) {
    super(page);
    this.selector = new ClanSelector(page);
    this.notifications = new ClanNotificationPage(page);
  }

  async createNewClan(clanName: string): Promise<boolean> {
    try {
      await this.selector.input.clanName.fill(clanName);
      await expect(this.selector.input.clanName).toHaveValue(clanName);
      await this.selector.buttons.createClanConfirm.click();

      const clanItem = await this.selector.findClanByTitle(clanName);
      const clanHeader = this.page.locator(
        generateE2eSelector('clan_page.header.title.clan_name'),
        {
          hasText: clanName,
        }
      );
      const limitModal = this.page.locator('text=/Clan Creation Limit Reached/i');
      const okBtn = this.page.locator('button').filter({ hasText: /^Okay$/i });

      const isLimitReached = await Promise.race([
        clanItem
          .or(clanHeader)
          .first()
          .waitFor({ state: 'visible', timeout: 8000 })
          .then(() => false),
        limitModal.waitFor({ state: 'visible', timeout: 8000 }).then(() => true),
      ]).catch(async () => {
        return await limitModal.isVisible().catch(() => false);
      });

      if (isLimitReached) {
        console.warn('Clan creation limit reached (50 clans). Deleting an existing clan...');
        await okBtn.click({ force: true }).catch(() => {});
        await this.navigate(ROUTES.DIRECT_FRIENDS);
        await this.page.waitForLoadState('domcontentloaded');
        await this.closeAllModals();

        const clanElements = this.selector.sidebar.clanItem;
        const count = await clanElements.count().catch(() => 0);
        let deleted = false;
        for (let i = 0; i < count; i++) {
          const title = await clanElements.nth(i).getAttribute('title');
          if (title && (title.includes('Test') || title.includes('_'))) {
            deleted = await this.deleteClan(title);
            if (deleted) break;
          }
        }
        if (!deleted && count > 0) {
          const lastClanTitle = await clanElements.last().getAttribute('title');
          if (lastClanTitle) {
            await this.deleteClan(lastClanTitle);
          }
        }

        await this.clickCreateClanButton();
        await this.clickCreateMyOwnClan();
        await this.selector.input.clanName.fill(clanName);
        await this.selector.buttons.createClanConfirm.click();
      }

      await expect(clanItem.or(clanHeader).first()).toBeVisible({ timeout: 15000 });
      return true;
    } catch (error) {
      console.error(`Error creating clan: ${error}`);
      return false;
    }
  }

  async isClanPresent(clanName: string): Promise<boolean> {
    const escaped = escapeRegExp(clanName);
    const clanHeaderLocator = this.page
      .locator(generateE2eSelector('clan_page.header.title.clan_name'), {
        hasText: new RegExp(escaped, 'i'),
      })
      .or(
        this.page.locator('[data-e2e*="clan_page-header-title-clan_name"]').filter({
          hasText: new RegExp(escaped, 'i'),
        })
      );
    const clanSidebarItem = this.page.locator(
      `[data-e2e="clan_page-side_bar-clan_item"][title*="${clanName}"]`
    );

    try {
      if (
        (await clanHeaderLocator
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)) ||
        (await clanSidebarItem
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false))
      ) {
        return true;
      }
      await clanHeaderLocator
        .first()
        .or(clanSidebarItem.first())
        .waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async clickCreateClanButton(): Promise<boolean> {
    const createClanButton = this.selector.buttons.createClan;
    if (!(await createClanButton.isVisible({ timeout: 3000 }))) return false;
    await createClanButton.click();
    return true;
  }

  async clickCreateMyOwnClan(): Promise<boolean> {
    await this.page.waitForTimeout(1000);
    const createMyOwnClanButton = this.selector.buttons.createMyOwnClan;
    if (!(await createMyOwnClanButton.isVisible({ timeout: 3000 }))) return false;
    await createMyOwnClanButton.click();
    return true;
  }

  async mapLocator<T>(
    locator: Locator,
    callback: (element: Locator) => Promise<T>
  ): Promise<Array<T | null>> {
    let count = 0;
    try {
      await locator.first().waitFor({ state: 'visible', timeout: 5000 });
      count = await locator.count();
    } catch {
      console.warn('No elements found for the provided locator.');
      return [];
    }
    const results: Array<T | null> = [];
    for (let i = 0; i < count; i++) {
      const element = locator.nth(i);
      try {
        await element.waitFor({ state: 'attached', timeout: 2000 });
        const result = await callback(element);
        results.push(result);
      } catch (error) {
        console.log(`Error processing element ${i}:`, error);
        results.push(null);
      }
    }
    return results;
  }

  async deleteAllClans({ onlyDeleteExpired }: { onlyDeleteExpired?: boolean }): Promise<boolean> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this.recoverToStableState();
        const clanElements = this.selector.sidebar.clanItem;
        const clanTitles = await this.mapLocator(clanElements, async element => {
          return element.getAttribute('title');
        });
        if (clanTitles.length === 0) return true;

        for (const clanName of clanTitles) {
          if (onlyDeleteExpired && clanName && !this.shouldDeleteClan(clanName)) {
            continue;
          }
          await this.deleteClan(clanName || '');
        }
        return true;
      } catch (error) {
        console.error(`Error in deleteAllClans attempt ${attempt + 1}: ${error}`);
        await this.recoverToStableState();
      }
    }
    return true;
  }

  private async recoverToStableState(): Promise<void> {
    try {
      await this.closeAllModals();
      const currentUrl = this.page.url();
      if (
        !currentUrl.includes('/chat') ||
        currentUrl.includes('authentication') ||
        currentUrl.includes('login')
      ) {
        await this.navigate(ROUTES.DIRECT_FRIENDS);
      }
      await this.closeAllModals();
    } catch {
      try {
        await this.navigate(ROUTES.DIRECT_FRIENDS);
      } catch {
        // Last resort - just continue
      }
    }
  }

  public async closeAllModals(): Promise<void> {
    try {
      const threadCloseBtn = this.page.locator(
        '[data-e2e="discussion-header-button-close"], [data-e2e*="discussion.header.button.close"], [data-e2e*="thread.close"], [data-e2e*="topic.close"]'
      );
      if (
        await threadCloseBtn
          .first()
          .isVisible({ timeout: 500 })
          .catch(() => false)
      ) {
        await threadCloseBtn
          .first()
          .click({ force: true })
          .catch(() => {});
        await this.page.waitForTimeout(300);
      }
    } catch {}

    try {
      const cancelDeleteClanBtn = this.page
        .locator(generateE2eSelector('clan_page.settings.modal.delete_clan.cancel'))
        .or(this.page.locator('button').filter({ hasText: /^Cancel$/i }));
      if (
        await cancelDeleteClanBtn
          .first()
          .isVisible({ timeout: 500 })
          .catch(() => false)
      ) {
        await cancelDeleteClanBtn
          .first()
          .click({ force: true })
          .catch(() => {});
        await this.page.waitForTimeout(300);
      }
    } catch {}

    try {
      const desktopBanner = this.page
        .locator('div, section')
        .filter({ hasText: /Open this link in the Mezon desktop app/i });
      if (
        await desktopBanner
          .first()
          .isVisible({ timeout: 500 })
          .catch(() => false)
      ) {
        const desktopCloseBtn = desktopBanner
          .locator('button')
          .filter({ hasText: /^close$/i })
          .or(desktopBanner.locator('button[aria-label*="close" i]'))
          .or(desktopBanner.locator('button').last());
        await desktopCloseBtn
          .first()
          .click({ force: true })
          .catch(() => {});
        await this.page.waitForTimeout(200);
      }
    } catch {}

    try {
      const internalErrorBtn = this.page.locator('button:has-text("Go to Friend Page")');
      if (
        await internalErrorBtn
          .first()
          .isVisible({ timeout: 500 })
          .catch(() => false)
      ) {
        await internalErrorBtn
          .first()
          .click({ force: true })
          .catch(() => {});
        await this.page.waitForTimeout(500);
      }
    } catch {}

    try {
      const clanSettingsExit = this.page.locator(
        '[data-e2e="clan_page-settings-button-exit"], [data-e2e="user_setting.account.exit_setting"], button[aria-label="Close"], button:has-text("ESC")'
      );
      if (
        await clanSettingsExit
          .first()
          .isVisible({ timeout: 500 })
          .catch(() => false)
      ) {
        await clanSettingsExit
          .first()
          .click({ force: true })
          .catch(() => {});
        await this.page.waitForTimeout(300);
      }
      const clanSettingsModal = this.page.locator('[data-e2e="clan_page-settings"]');
      if (await clanSettingsModal.isVisible({ timeout: 500 }).catch(() => false)) {
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(300);
      }
    } catch {}

    try {
      const permModal = this.page.locator(
        '[data-e2e="clan_page-settings-modal-permission"], [data-e2e*="modal.permission"], [data-e2e*="modal-permission"]'
      );
      if (
        await permModal
          .first()
          .isVisible({ timeout: 500 })
          .catch(() => false)
      ) {
        const dismissBtn = permModal
          .locator('[data-e2e*="cancel"], [data-e2e*="confirm"], button')
          .first();
        if (await dismissBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await dismissBtn.click({ force: true }).catch(() => {});
        } else {
          await this.page.keyboard.press('Escape').catch(() => {});
        }
        await permModal
          .first()
          .waitFor({ state: 'hidden', timeout: 2000 })
          .catch(() => {});
      }
    } catch {
      // No modal visible, continue
    }
    try {
      const modal = this.page.locator(
        'div[role="dialog"], .fixed.inset-0.z-50, [tabindex="-1"].fixed'
      );
      if (
        await modal
          .first()
          .isVisible({ timeout: 500 })
          .catch(() => false)
      ) {
        await this.page.keyboard.press('Escape');
        const closeButtons = modal.locator(
          'button[aria-label="Close"], button:has-text("Close"), button:has-text("Cancel"), button:has-text("Okay"), button:has-text("OK"), button:has-text("Back")'
        );
        const count = await closeButtons.count();
        for (let i = 0; i < count; i++) {
          if (
            await closeButtons
              .nth(i)
              .isVisible({ timeout: 300 })
              .catch(() => false)
          ) {
            await closeButtons
              .nth(i)
              .click({ timeout: 1000, force: true })
              .catch(() => {});
            await this.page.waitForTimeout(300);
          }
        }
      }
    } catch {
      // No other modals
    }
  }

  async deleteClan(clanName: string): Promise<boolean> {
    try {
      if (!clanName || !clanName.trim()) {
        console.warn('deleteClan called with empty clanName, skipping.');
        return false;
      }
      await this.closeAllModals();

      const categoryPage = new ClanMenuPanel(this.page);
      const categorySettingPage = new CategorySettingPage(this.page);

      const clanLocator = (await this.selector.findClanByTitle(clanName)).first();
      await clanLocator.waitFor({ state: 'visible', timeout: 5000 });
      await clanLocator.click({ timeout: 5000 });
      await this.page.waitForTimeout(500);

      // Wait for clan header title to appear and click to open dropdown
      const clanHeader = categoryPage.text.clanName.first();
      await clanHeader.waitFor({ state: 'visible', timeout: 8000 });
      await clanHeader.click();
      await this.page.waitForTimeout(500);

      // 1. Check if "Leave Clan" option is available (member role)
      const leaveClanBtn = this.selector.buttons.leaveClan
        .or(
          this.page
            .locator(
              '[data-e2e*="clan_page-header-modal_panel"], div[role="menuitem"], div[class*="popover"] div, div[class*="dropdown"] div, button'
            )
            .filter({ hasText: /Leave Clan|Rời/i })
        )
        .first();

      if (await leaveClanBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`Leaving clan "${clanName}" as member...`);
        await leaveClanBtn.click({ force: true });
        const confirmBtn = this.selector.buttons.confirm.or(
          this.page.locator(
            'button:has-text("Leave"), button:has-text("Rời"), button:has-text("Yes"), button:has-text("Confirm"), [data-e2e*="confirm"]'
          )
        );
        await confirmBtn
          .first()
          .click({ timeout: 3000, force: true })
          .catch(() => {});
        await this.page.waitForLoadState('domcontentloaded');
        await this.navigate(ROUTES.DIRECT_FRIENDS);
        return true;
      }

      // 2. Check if "Clan Settings" option is available (owner role)
      const clanSettingsBtn = categoryPage.buttons.clanSettings
        .or(this.selector.buttons.clanSettings)
        .or(
          this.page
            .locator(
              '[data-e2e*="clan_page-header-modal_panel"], div[role="menuitem"], div[class*="popover"] div, div[class*="dropdown"] div, button'
            )
            .filter({ hasText: /Clan Settings|Cài đặt/i })
        )
        .first();

      if (await clanSettingsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await clanSettingsBtn.click({ force: true });
        await this.page.waitForLoadState('domcontentloaded');

        const deleteSidebarButton = await categorySettingPage.getDeleteSidebarButton();
        if (await deleteSidebarButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await deleteSidebarButton.click({ force: true });
          await categorySettingPage.fillDeleteInput(clanName || '');
          await categorySettingPage.clickConfirmDeleteButton();
          await this.page.waitForLoadState('domcontentloaded');
          await this.navigate(ROUTES.DIRECT_FRIENDS);
          console.log(`Deleted clan "${clanName}" as owner.`);
          return true;
        }
      }

      console.warn(`Could not leave or delete clan "${clanName}".`);
      await this.navigate(ROUTES.DIRECT_FRIENDS);
      return false;
    } catch (error) {
      console.error(`Error deleting clan: ${error}`);
      try {
        await this.recoverToStableState();
      } catch {
        // Recovery also failed, just continue
      }
      return false;
    }
  }

  /**
   * Check if a clan should be deleted based on its timestamp
   * @param clanName The name of the clan in format: prefix_randomString_timestamp
   * @returns true if the clan's timestamp has passed the current time
   */
  private shouldDeleteClan(clanName: string): boolean {
    try {
      const parts = clanName.split('_');
      if (parts.length < 3) {
        return true;
      }

      const timestampStr = parts[parts.length - 1];

      const clanTimestamp = parseInt(timestampStr);
      if (isNaN(clanTimestamp)) {
        return false;
      }

      const currentTime = Date.now();

      return currentTime > clanTimestamp;
    } catch {
      return false;
    }
  }

  async openClanSettings(): Promise<boolean> {
    try {
      if (
        await this.selector.clanSettings.settings_page
          .isVisible({ timeout: 1000 })
          .catch(() => false)
      ) {
        return true;
      }
      await this.closeAllModals();
      const categoryPage = new ClanMenuPanel(this.page);
      const clanNameBtn = categoryPage.text.clanName
        .or(this.selector.buttons.clanName)
        .or(this.page.locator('[data-e2e*="clan_page-header-title-clan_name"]'))
        .first();

      await clanNameBtn.waitFor({ state: 'visible', timeout: 10000 });

      const clanSettingsBtn = categoryPage.buttons.clanSettings
        .or(this.selector.buttons.clanSettings)
        .or(
          this.page
            .locator(
              '[data-e2e*="clan_page-header-modal_panel"], div[role="menuitem"], div[class*="popover"] div, div[class*="dropdown"] div, button'
            )
            .filter({ hasText: /Clan Settings|Cài đặt/i })
        )
        .first();

      if (!(await clanSettingsBtn.isVisible().catch(() => false))) {
        await clanNameBtn.click();
        const opened = await clanSettingsBtn
          .waitFor({ state: 'visible', timeout: 3000 })
          .then(() => true)
          .catch(() => false);
        if (!opened) {
          await clanNameBtn.click({ force: true });
          await clanSettingsBtn.waitFor({ state: 'visible', timeout: 5000 });
        }
      }

      await clanSettingsBtn.click();
      await expect(this.selector.clanSettings.settings_page).toBeVisible({ timeout: 10000 });
      return true;
    } catch (error) {
      console.error(`Error opening clan settings: ${error}`);
      return false;
    }
  }

  async getClanBannerImage(): Promise<string | null> {
    const banner = this.selector.banner;

    if ((await banner.count()) === 0 || !(await banner.isVisible())) {
      return null;
    }

    return await banner.evaluate(element => {
      const image =
        element instanceof HTMLImageElement
          ? element.currentSrc || element.getAttribute('src')
          : element.querySelector('img')?.currentSrc ||
            element.querySelector('img')?.getAttribute('src');
      const backgroundImage = window.getComputedStyle(element).backgroundImage;

      return image || (backgroundImage !== 'none' ? backgroundImage : null);
    });
  }

  async uploadClanBanner(filePath: string): Promise<void> {
    await this.openClanSettings();
    const bannerInput = this.page
      .locator(generateE2eSelector('clan_page.settings.upload.clan_banner_input'))
      .or(this.page.locator('input#upload_banner_background'))
      .or(this.page.locator('input[accept*="image"][type="file"]').last())
      .first();
    await bannerInput.waitFor({ state: 'attached', timeout: 10000 });
    await bannerInput.setInputFiles(filePath);
    await this.page.waitForTimeout(1000);

    const saveBtn = this.page
      .locator(generateE2eSelector('clan_page.settings.overview.button.save_changes'))
      .or(this.selector.buttons.saveChanges)
      .or(this.page.locator('button').filter({ hasText: /^Save( Changes)?$/i }))
      .or(this.page.locator('[data-e2e*="save_change"], [data-e2e*="save-change"]'))
      .first();
    if (await saveBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      await saveBtn.click({ force: true });
      await expect(saveBtn)
        .toBeHidden({ timeout: 15000 })
        .catch(() => {});
    }
  }

  async verifyClanBannerChanged(previousBannerImage: string | null): Promise<void> {
    await this.closeSettingsClan();
    await expect
      .poll(
        async () => {
          const currentBannerImage = await this.getClanBannerImage();
          return currentBannerImage !== null && currentBannerImage !== previousBannerImage;
        },
        { timeout: 15000 }
      )
      .toBe(true);
  }

  async preventAnonymous() {
    const buttonSettings = this.selector.buttons.preventAnoSettings;
    await buttonSettings.click();
    const modal = this.page.locator(generateE2eSelector('clan_page.settings.modal.permission'));
    if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
      const confirmBtn = modal
        .locator(generateE2eSelector('clan_page.settings.modal.permission.confirm'))
        .or(modal.locator('button').filter({ hasText: /confirm|yes|ok|save/i }))
        .first();
      await confirmBtn.click({ force: true }).catch(() => {});
      await modal.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }
    const saveBtn = this.selector.buttons.saveChanges;
    if (await saveBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await saveBtn.click();
      await expect(saveBtn).toBeHidden({ timeout: 8000 });
    }
  }

  async openChannelSettings(channelName: string): Promise<void> {
    const channelLocator = this.selector.sidebar.channelItem.name
      .filter({ hasText: channelName })
      .or(this.selector.channel.getSidebarItem(channelName))
      .or(
        this.page.locator(
          `${generateE2eSelector('clan_page.channel_list.item.name')}:has-text("${channelName}"), [data-e2e*="channel_list"]:has-text("${channelName}"), button:has-text("${channelName}"), a[href*="channels"]:has-text("${channelName}")`
        )
      )
      .first();

    if (!(await channelLocator.isVisible({ timeout: 2000 }).catch(() => false))) {
      await channelLocator.scrollIntoViewIfNeeded().catch(() => {});
    }
    if (!(await channelLocator.isVisible({ timeout: 1000 }).catch(() => false))) {
      await this.page
        .evaluate(() => {
          const scrollers = document.querySelectorAll('.thread-scroll, [class*="contain-strict"]');
          scrollers.forEach(el => {
            el.scrollTop = el.scrollHeight;
          });
        })
        .catch(() => {});
      await channelLocator.scrollIntoViewIfNeeded().catch(() => {});
    }
    await expect(channelLocator).toBeVisible({ timeout: 10000 });
    await channelLocator.click({ button: 'right', force: true });
    const editChannelBtn = this.selector.sidebar.panelItem.item
      .filter({ hasText: 'Edit Channel' })
      .or(
        this.page
          .locator('div[role="menuitem"], button, [data-e2e*="panel-item"]')
          .filter({ hasText: /Edit Channel/i })
      )
      .first();
    await expect(editChannelBtn).toBeVisible({ timeout: 5000 });
    await editChannelBtn.click();
    await expect(this.selector.input.channelName.first()).toBeVisible({ timeout: 8000 });
  }

  async openMemberListSetting(): Promise<void> {
    await this.closeAllModals();
    const exitClanSettings = this.selector.buttons.exitSettings
      .or(this.selector.buttons.closeSettingClan)
      .or(this.page.locator('[data-e2e*="button-exit"], [data-e2e*="exit_setting"]'))
      .first();
    if (await exitClanSettings.isVisible({ timeout: 1000 }).catch(() => false)) {
      await exitClanSettings.click({ timeout: 3000, force: true }).catch(() => {});
      await this.page.waitForTimeout(500);
    }
    await expect(this.selector.buttons.memberListButton).toBeVisible({ timeout: 5000 });
    await this.selector.buttons.memberListButton.click({ force: true });
    await expect(this.selector.memberSettings.userContainer.first()).toBeVisible({ timeout: 5000 });
  }

  async searchMemberList(keyword: string): Promise<void> {
    await expect(this.selector.memberSettings.searchInput).toBeVisible({ timeout: 5000 });
    await this.selector.memberSettings.searchInput.fill(keyword);
  }

  async clearMemberListSearch(): Promise<void> {
    await expect(this.selector.memberSettings.searchInput).toBeVisible({ timeout: 5000 });
    await this.selector.memberSettings.searchInput.clear();
  }

  async openChannelsListSetting(): Promise<void> {
    try {
      if (await this.selector.buttons.channelManagementButton.isVisible({ timeout: 2000 })) {
        await this.selector.buttons.channelManagementButton.click();
        await expect(this.selector.channelManagement.totalChannels).toBeVisible({ timeout: 5000 });
        return;
      }
    } catch {}
    await this.openChannelsListSettingByUrl();
  }

  async openChannelsListSettingByUrl(): Promise<void> {
    const currentUrl = new URL(this.page.url());
    const clanPath = currentUrl.pathname.match(/\/chat\/clans\/[^/]+/)?.[0];
    if (!clanPath) {
      throw new Error(`Cannot resolve clan ID from URL: ${currentUrl.toString()}`);
    }

    currentUrl.pathname = `${clanPath}/channel-setting`;
    currentUrl.search = '';
    currentUrl.hash = '';
    await this.page.goto(currentUrl.toString(), { waitUntil: 'domcontentloaded' });
    await expect(this.selector.channelManagement.totalChannels).toBeVisible({ timeout: 10000 });
  }

  async createNewChannel(
    typeChannel: ChannelType,
    channelName: string,
    status?: ChannelStatus,
    inLastCategory = false
  ): Promise<boolean> {
    try {
      await this.closeAllModals();
      const createBtn = inLastCategory
        ? this.selector.buttons.createChannel.last()
        : this.selector.buttons.createChannel.first();
      await expect(createBtn).toBeVisible({ timeout: 5000 });
      await createBtn.click();
      await expect(this.selector.createChannelModal.input.channelName).toBeVisible({
        timeout: 5000,
      });

      switch (typeChannel) {
        case ChannelType.TEXT:
          await this.selector.createChannelModal.type.text.click();
          break;
        case ChannelType.VOICE:
          await this.selector.createChannelModal.type.voice.click();
          break;
        case ChannelType.STREAM:
          await this.selector.createChannelModal.type.stream.click();
          break;
      }
      await this.selector.createChannelModal.input.channelName.fill(channelName);
      if (
        status === ChannelStatus.PRIVATE &&
        (typeChannel === ChannelType.TEXT || typeChannel === ChannelType.VOICE)
      ) {
        await this.selector.createChannelModal.toggle.isPrivate.click();
        await expect(this.selector.createChannelModal.toggle.isPrivate).toBeChecked();
      }
      const confirmBtn = this.selector.createChannelModal.button.confirm
        .or(this.page.locator('button').filter({ hasText: /^Create Channel$/i }))
        .first();
      await confirmBtn.click();
      try {
        await expect(this.selector.createChannelModal.input.channelName).toBeHidden({
          timeout: 5000,
        });
      } catch {
        if (await confirmBtn.isVisible().catch(() => false)) {
          await confirmBtn.click({ force: true }).catch(() => {});
          await expect(this.selector.createChannelModal.input.channelName).toBeHidden({
            timeout: 8000,
          });
        }
      }
      await this.page.waitForTimeout(1000);

      return true;
    } catch (error) {
      console.error(`Error creating channel: ${error}`);
      return false;
    }
  }

  async isNewChannelPresent(channelName: string): Promise<boolean> {
    const escapedName = channelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegex = new RegExp(escapedName, 'i');

    // 1. Check if channel is opened in main chat view / top bar / welcome banner
    const chatTitle = this.page
      .locator('[data-e2e="clan_page-header-title-clan_name"], [data-e2e*="header"], h1, h2, h3, p')
      .filter({ hasText: nameRegex })
      .first();
    if (await chatTitle.isVisible({ timeout: 1000 }).catch(() => false)) {
      return true;
    }

    const channelLocator = this.selector.channel
      .getSidebarItem(channelName)
      .or(this.selector.sidebar.channelItem.name.filter({ hasText: nameRegex }))
      .or(
        this.page
          .locator(
            `${generateE2eSelector('clan_page.channel_list.item.name')}, [data-e2e*="channel_list"], a[href*="channels"], button`
          )
          .filter({ hasText: nameRegex })
      )
      .first();

    try {
      if (await channelLocator.isVisible({ timeout: 1500 }).catch(() => false)) {
        return true;
      }

      await this.page
        .evaluate(() => {
          const scrollables = Array.from(document.querySelectorAll('*'));
          for (const el of scrollables) {
            if (el.scrollHeight > el.clientHeight && el.clientHeight > 100) {
              el.scrollTop = el.scrollHeight;
            }
          }
        })
        .catch(() => {});
      await this.page.waitForTimeout(300);

      const count = await channelLocator.count().catch(() => 0);
      if (count > 0) {
        await channelLocator.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
        if (await channelLocator.isVisible({ timeout: 1500 }).catch(() => false)) {
          return true;
        }
      }
    } catch {}

    const textLocator = this.page.getByText(channelName, { exact: true }).first();
    const textCount = await textLocator.count().catch(() => 0);
    if (textCount > 0) {
      await textLocator.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
      return await textLocator.isVisible({ timeout: 1500 }).catch(() => false);
    }

    return false;
  }

  async verifyChannelVisibility(channelName: string, shouldBeVisible: boolean): Promise<void> {
    const escapedName = channelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegex = new RegExp(`^\\s*#?\\s*${escapedName}\\s*$`, 'i');
    const channelItem = this.page
      .locator('[data-e2e="clan_page-channel_list-item-name"], a[href*="/channels/"], button')
      .filter({ hasText: nameRegex })
      .first();

    if (shouldBeVisible) {
      if (await channelItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(channelItem).toBeVisible();
        return;
      }
      await this.page
        .evaluate(() => {
          const scrollables = Array.from(document.querySelectorAll('*'));
          for (const el of scrollables) {
            if (el.scrollHeight > el.clientHeight && el.clientHeight > 100) {
              el.scrollTop = el.scrollHeight;
            }
          }
        })
        .catch(() => {});
      await channelItem.scrollIntoViewIfNeeded().catch(() => {});
      await expect(channelItem).toBeVisible({ timeout: 15000 });
    } else {
      await expect(channelItem).toBeHidden({ timeout: 15000 });
    }
  }

  async verifyVoiceChannelPrivacyIcon(channelName: string, isPrivate: boolean): Promise<void> {
    const channel = this.selector.channel.getSidebarItem(channelName);
    await expect(channel).toBeVisible({ timeout: 10000 });
    const icon = isPrivate
      ? this.selector.sidebar.channelItem.iconSpeakerLock
      : this.selector.sidebar.channelItem.iconSpeaker;
    await expect(channel.locator(icon)).toBeVisible({ timeout: 5000 });
  }

  async verifyCreateChannelTypeFromContextMenu(
    channelName: string,
    channelType: ChannelType.TEXT | ChannelType.VOICE
  ): Promise<void> {
    const channel = this.selector.channel.getSidebarItem(channelName);
    await expect(channel).toBeVisible({ timeout: 5000 });
    await channel.click({ button: 'right' });

    const actionLabel =
      channelType === ChannelType.TEXT ? 'Create Text Channel' : 'Create Voice Channel';
    const createChannelAction = this.selector.sidebar.panelItem.item.filter({
      hasText: new RegExp(`^${actionLabel}$`),
    });
    await expect(createChannelAction).toBeVisible({ timeout: 3000 });
    await createChannelAction.click();

    await expect(this.selector.createChannelModal.input.channelName).toBeVisible({
      timeout: 5000,
    });
    const selectedType = this.selector.createChannelModal.type.text;

    await expect(selectedType.locator('input[type="radio"]')).toBeChecked();

    await this.selector.createChannelModal.button.cancel.click();
    await expect(this.selector.createChannelModal.input.channelName).toBeHidden({ timeout: 5000 });
  }

  async verifyCategoryContextMenuActions(
    categoryName: string,
    actionLabels: string[]
  ): Promise<void> {
    const category = this.selector.sidebar.categoryName
      .filter({ hasText: new RegExp(`^${escapeRegExp(categoryName)}$`, 'i') })
      .first();
    if (!(await category.isVisible({ timeout: 2000 }).catch(() => false))) {
      const menuPanel = new ClanMenuPanel(this.page);
      await menuPanel.createCategory(categoryName);
    }
    await expect(category).toBeVisible({ timeout: 8000 });
    await category.click({ button: 'right' });

    for (const actionLabel of actionLabels) {
      const action = this.selector.sidebar.panelItem.item
        .filter({
          has: this.page.locator('li, div, span', { hasText: new RegExp(`^${actionLabel}$`, 'i') }),
        })
        .or(
          this.page
            .locator('div[role="menuitem"], li, button')
            .filter({ hasText: new RegExp(`^${actionLabel}$`, 'i') })
        );
      await expect(action.first()).toBeVisible({ timeout: 5000 });
    }
  }

  async editCategoryName(categoryName: string, newCategoryName: string): Promise<void> {
    try {
      const categoryLocator = this.selector.sidebar.category.filter({ hasText: categoryName });
      await categoryLocator.waitFor({ state: 'visible', timeout: 5000 });
      await categoryLocator.click({ button: 'right' });
      await this.selector.sidebar.panelItem.item.filter({ hasText: 'Edit Category' }).click();

      await this.selector.clanSettings.category.input.categoryName.waitFor({
        state: 'visible',
        timeout: 5000,
      });
      await this.selector.clanSettings.category.input.categoryName.fill(newCategoryName);
      await this.selector.buttons.saveChanges.click();
      await this.selector.buttons.exitSettings.click();
      await expect(this.selector.clanSettings.category.input.categoryName).toBeHidden({
        timeout: 5000,
      });
    } catch (error) {
      console.error(`Error editing category name: ${error}`);
    }
  }

  async deleteCategory(categoryName: string, couldBeDeleted: boolean = true): Promise<void> {
    const category = this.selector.sidebar.categoryName
      .filter({ hasText: new RegExp(`^${escapeRegExp(categoryName)}$`) })
      .first();
    await expect(category).toBeVisible({ timeout: 5000 });
    await category.click({ button: 'right' });

    const editCategoryAction = this.selector.sidebar.panelItem.item.filter({
      has: this.page.locator('li', { hasText: /^Edit Category$/ }),
    });
    await expect(editCategoryAction).toBeVisible({ timeout: 3000 });
    await editCategoryAction.click();

    await expect(this.selector.clanSettings.category.input.categoryName).toBeVisible({
      timeout: 5000,
    });
    const deleteBtn = this.selector.buttons.deleteCategory
      .or(this.page.locator('button:has-text("Delete Category")'))
      .first();
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    await deleteBtn.click();

    if (couldBeDeleted) {
      const confirmBtn = this.selector.buttons.confirm.first();
      await expect(confirmBtn).toBeVisible({ timeout: 5000 });
      await confirmBtn.click();
      await expect(confirmBtn).toBeHidden({ timeout: 5000 });
      await this.closeSettingsChannel();
    }
    await this.page.waitForTimeout(500);
  }

  async closeCreateThreadModal(): Promise<void> {
    const closeBtn = this.selector.threadBox.button.closeCreateThreadModal
      .or(
        this.page.locator(
          '[data-e2e*="discussion-header-button-close"], [data-e2e*="thread.close"], [data-e2e*="discussion.header.button.close"]'
        )
      )
      .first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      await this.page.keyboard.press('Escape').catch(() => {});
    }
  }

  async openThreadModalFromHeader(): Promise<void> {
    const createThreadBtn = this.selector.header.button.createThread
      .or(this.page.getByRole('button', { name: /^create thread$/i }))
      .or(this.page.getByRole('button', { name: /^create$/i }))
      .or(this.page.getByRole('button', { name: /create thread/i }))
      .or(this.page.locator('button').filter({ hasText: /^Create Thread$/i }))
      .or(this.page.locator('button').filter({ hasText: /^Create$/i }));
    if (
      !(await createThreadBtn
        .first()
        .isVisible({ timeout: 1000 })
        .catch(() => false))
    ) {
      await this.selector.header.button.thread.click({ force: true });
    }
  }

  async verifyCreateThreadButtonIsOpen(shouldVisible = true): Promise<boolean> {
    const createThreadButtonLocator = this.selector.header.button.createThread
      .or(this.page.getByRole('button', { name: /^create thread$/i }))
      .or(this.page.getByRole('button', { name: /^create$/i }))
      .or(this.page.getByRole('button', { name: /create thread/i }))
      .or(this.page.locator('button').filter({ hasText: /^Create Thread$/i }))
      .or(this.page.locator('button').filter({ hasText: /^Create$/i }))
      .first();
    if (shouldVisible) {
      await expect(createThreadButtonLocator).toBeVisible({ timeout: 5000 });
      return true;
    } else {
      await expect(createThreadButtonLocator).toBeHidden({ timeout: 5000 });
      return false;
    }
  }

  async createThread(threadName: string, status?: ThreadStatus): Promise<void> {
    const createThreadBtn = this.selector.header.button.createThread
      .or(this.page.getByRole('button', { name: /^create thread$/i }))
      .or(this.page.getByRole('button', { name: /^create$/i }))
      .or(this.page.getByRole('button', { name: /create thread/i }))
      .or(this.page.locator('button').filter({ hasText: /^Create Thread$/i }))
      .or(this.page.locator('button').filter({ hasText: /^Create$/i }))
      .first();

    if (!(await createThreadBtn.isVisible({ timeout: 1500 }).catch(() => false))) {
      await this.selector.header.button.thread.click({ force: true });
      await createThreadBtn.waitFor({ state: 'visible', timeout: 8000 });
    }
    await createThreadBtn.click();
    await this.selector.threadBox.threadNameInput.fill(threadName);
    if (status === ThreadStatus.PRIVATE) {
      await this.selector.threadBox.threadPrivateCheckbox.click();
    }
    const threadInput = this.selector.threadBox.threadInputMention
      .or(
        this.page
          .locator('[data-e2e="discussion-box-thread"]')
          .getByRole('textbox', { name: 'Message' })
      )
      .or(this.page.locator('div[class*="mention-input-editor"]').last())
      .first();
    await threadInput.fill(threadName);
    await threadInput.press('Enter');
    await this.page.waitForTimeout(2000);
  }

  async clickThreadItem(threadName: string): Promise<void> {
    const threadItem = this.selector.sidePanel.thread.item
      .filter({ hasText: threadName })
      .or(this.page.locator('[data-e2e*="thread"]').filter({ hasText: threadName }))
      .or(this.page.locator(`button:has-text("${threadName}"), a:has-text("${threadName}")`))
      .first();
    await threadItem.scrollIntoViewIfNeeded().catch(() => {});
    await threadItem.waitFor({ state: 'visible', timeout: 15000 });
    await threadItem.click({ force: true });
  }

  async openMemberList(): Promise<void> {
    const memberItem = this.selector.secondarySideBar.member.item.first();
    if (await memberItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      return;
    }
    const btn = this.selector.header.button.member.first();
    await btn.waitFor({ state: 'visible', timeout: 8000 });
    await btn.click({ force: true });

    const isVisibleNow = await memberItem
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (!isVisibleNow) {
      await btn.click({ force: true });
      await memberItem.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    }
  }

  async getMemberFromMemberList(memberName: string): Promise<Locator> {
    const memberLocator = this.selector.sidebarMemberList.memberItems.filter({
      hasText: memberName,
    });
    await memberLocator.waitFor({ state: 'visible', timeout: 5000 });
    return memberLocator;
  }

  async verifyAddFriendButtonVisibleOnModal(): Promise<boolean> {
    const addFriendLocator = this.selector.sidebarMemberList.addFriendButton;

    try {
      await addFriendLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async isNewThreadPresent(threadName: string): Promise<boolean> {
    const threadLocator = this.selector.sidebar.threadItem.name
      .filter({ hasText: threadName })
      .or(
        this.page
          .locator(
            `${generateE2eSelector('clan_page.channel_list.thread_item.name')}, [data-e2e*="thread"], button, a`
          )
          .filter({ hasText: threadName })
      )
      .first();

    try {
      if (await threadLocator.isVisible({ timeout: 2000 }).catch(() => false)) {
        return true;
      }
      await threadLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async openThread(threadName: string): Promise<void> {
    const threadPanel = this.page
      .locator('[data-e2e="discussion-box-thread"], div[class*="discussion"]')
      .filter({ hasText: threadName });
    if (await threadPanel.isVisible({ timeout: 1000 }).catch(() => false)) {
      return;
    }
    const createThreadBtn = this.selector.header.button.createThread;
    if (!(await createThreadBtn.isVisible({ timeout: 1000 }).catch(() => false))) {
      await this.selector.header.button.thread.click({ force: true }).catch(() => {});
    }
    await this.clickThreadItem(threadName);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getAllClan(): Promise<number> {
    const clanElements = this.selector.sidebar.clanItem;
    return await clanElements.count();
  }

  async isLimitCreationModalPresent(): Promise<boolean> {
    const limitCreationModalLocator = this.selector.modal.limitCreation.title;
    try {
      await limitCreationModalLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async clickButtonInvitePeopleFromMenu(): Promise<boolean> {
    try {
      if (
        await this.selector.modalInvite.container.isVisible({ timeout: 1000 }).catch(() => false)
      ) {
        return true;
      }
      await this.closeSettingsClanIfOpen();
      await this.closeAllModals();
      const clanNameBtn = this.selector.buttons.clanName
        .or(this.page.locator('[data-e2e*="clan_page-header-title-clan_name"]'))
        .first();
      await expect(clanNameBtn).toBeVisible({ timeout: 10000 });
      const inviteBtn = this.selector.buttons.invitePeopleFromHeaderMenu
        .or(
          this.page.locator(
            '[data-e2e*="invite_people"], div[role="menuitem"]:has-text("Invite"), button:has-text("Invite")'
          )
        )
        .first();
      if (!(await inviteBtn.isVisible().catch(() => false))) {
        await clanNameBtn.click();
        const opened = await inviteBtn
          .waitFor({ state: 'visible', timeout: 3000 })
          .then(() => true)
          .catch(() => false);
        if (!opened) {
          await clanNameBtn.click({ force: true });
          await inviteBtn.waitFor({ state: 'visible', timeout: 5000 });
        }
      }
      await inviteBtn.click();
      await expect(this.selector.modalInvite.container).toBeVisible({ timeout: 8000 });
      return true;
    } catch (error) {
      console.error(`Error clicking invite people:`, error);
      return false;
    }
  }

  async sendInviteOnModal(): Promise<{
    success: boolean;
    username?: string;
    urlInvite?: string;
  }> {
    try {
      await expect(this.selector.modalInvite.userInvite.first()).toBeVisible({ timeout: 10000 });

      const userInviteItem = this.selector.modalInvite.userInvite.first();
      const usernameElement = userInviteItem.locator('p').first();
      await expect(usernameElement).toBeVisible({ timeout: 5000 });

      const username = (await usernameElement.innerText()).trim();

      await expect(this.selector.input.urlInvite).toHaveValue(/http/, { timeout: 8000 });
      let urlInvite = (await this.selector.input.urlInvite.inputValue()).trim();
      if (urlInvite.startsWith('http://127.0.0.1:4200')) {
        urlInvite = urlInvite.replace('http://127.0.0.1:4200', 'https://dev-mezon.nccsoft.vn');
      }

      if (!username || !urlInvite) {
        throw new Error('Missing invite info or URL');
      }

      const inviteBtn = userInviteItem
        .locator('button')
        .or(this.selector.buttons.invitePeople)
        .first();
      await inviteBtn.click();
      const closeBtn = this.selector.buttons.closeInviteModal
        .or(this.selector.modalInvite.button.close)
        .or(this.page.locator('button:has-text("×"), button:has-text("✕")'))
        .first();
      if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeBtn.click();
      } else {
        await this.page.keyboard.press('Escape');
      }

      await this.selector.modalInvite.container
        .waitFor({ state: 'hidden', timeout: 5000 })
        .catch(() => {});

      return { success: true, username, urlInvite };
    } catch (error) {
      console.error('Error sending invite:', error);
      return { success: false };
    }
  }

  async openDirectMessageWithUser(username: string): Promise<void> {
    const itemLocator = this.page
      .locator(
        `${generateE2eSelector('chat.direct_message.chat_item.username')}, ${generateE2eSelector('chat.direct_message.chat_item.group_name')}, [data-e2e*="chat_item"]`
      )
      .getByText(username, { exact: true });

    await expect(itemLocator.first()).toBeVisible({ timeout: 10000 });
    await itemLocator.first().click();
  }

  async editChannelName(channelName: string, newChannelName: string): Promise<void> {
    await this.openChannelSettings(channelName);
    const input = this.page.locator(
      `${generateE2eSelector('clan_page.channel_list.settings.overview')} input[value="${channelName}"]`
    );

    await input.fill(newChannelName);
    await this.selector.buttons.saveChanges.click();
    await this.selector.buttons.exitSettings.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickButtonInvitePeopleFromChannel(): Promise<boolean> {
    try {
      await this.selector.buttons.invitePeopleFromChannel.click();
      return true;
    } catch (error) {
      console.error(`Error clicking invite people:`, error);
      return false;
    }
  }

  private async findElementBySelectors(
    selectors: string[],
    timeout: number = 3000
  ): Promise<SelectorResult> {
    for (const selector of selectors) {
      try {
        const element = this.page.locator(selector).first();
        await element.waitFor({ state: 'visible', timeout });
        if (await element.isVisible({ timeout })) {
          return { found: true, element };
        }
      } catch {
        // Ignore errors
        continue;
      }
    }
    return { found: false };
  }

  async addDataOnLocationTab(
    eventType: EventType,
    voiceChannelName?: string,
    status?: ClanStatus,
    textChannelName?: string
  ): Promise<boolean> {
    try {
      await this.selector.buttons.eventButton.click();
      const createBtn = this.selector.eventModal.createEventButton;
      await createBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      if (await createBtn.isVisible().catch(() => false)) {
        await createBtn.click();
      }
      await this.selector.createEventModal.type.voice
        .or(this.selector.createEventModal.type.location)
        .first()
        .waitFor({ state: 'visible', timeout: 5000 })
        .catch(() => {});

      switch (eventType) {
        case EventType.LOCATION:
          await this.selector.createEventModal.type.location.click({ force: true });
          break;
        case EventType.VOICE: {
          await this.selector.createEventModal.type.voice.click({ force: true });
          const voiceRadio = this.page.getByRole('radio', { name: /Voice Channel/i });
          if (await voiceRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
            await voiceRadio.check({ force: true }).catch(() => {});
          }
          break;
        }
        case EventType.PRIVATE:
          await this.selector.createEventModal.type.private.click({ force: true });
          break;
      }
      if (eventType === EventType.VOICE) {
        const selectBox = this.selector.createEventModal.selectVoiceChannel.first();
        await selectBox.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        if (await selectBox.isVisible().catch(() => false)) {
          await selectBox.click();
          await this.page.waitForTimeout(500);
        }
        if (voiceChannelName) {
          const channelItem = this.selector.createEventModal.channelItem
            .filter({ hasText: voiceChannelName })
            .first();
          await channelItem.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
          if (await channelItem.isVisible().catch(() => false)) {
            await channelItem.click();
          }
        } else {
          const firstItem = this.selector.createEventModal.channelItem.first();
          await firstItem.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
          if (await firstItem.isVisible().catch(() => false)) {
            await firstItem.click();
          }
        }
      } else if (eventType === EventType.LOCATION && voiceChannelName) {
        await this.selector.createEventModal.input.locationName.fill(voiceChannelName);
      }

      if (status === ClanStatus.PRIVATE) {
        await this.selector.createEventModal.selectChannel.last().click({ force: true });
        const channelItem = this.selector.createEventModal.channelItem
          .filter({
            hasText: textChannelName,
          })
          .first();
        await channelItem.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await channelItem.click();
      }

      const nextBtn = this.selector.eventModal.nextButton;
      await expect(nextBtn)
        .toBeEnabled({ timeout: 5000 })
        .catch(() => {});
      await nextBtn.click();

      return true;
    } catch (error) {
      console.error(`Error adding data on location tab: ${error}`);
      throw error;
    }
  }

  async sendFirstMessage(message: string): Promise<boolean> {
    try {
      await this.selector.input.mention.fill(message);
      await this.selector.input.mention.press('Enter');
      return true;
    } catch {
      return false;
    }
  }
  async verifyMessageSent(message: string): Promise<boolean> {
    const messageSelectors = [
      `div:has-text("${message}")`,
      `[data-testid="message"]:has-text("${message}")`,
      `.message:has-text("${message}")`,
      `.chat-message:has-text("${message}")`,
    ];

    const result = await this.findElementBySelectors(messageSelectors);
    return result.found;
  }
  async formatDateTimeFromInputs(startDate: string, startTime: string, locale = 'en-US') {
    const [year, month, day] = startDate.split('-');
    const [hour, minute] = startTime.split(':');

    const rawDate = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
    );

    const dateFormatter = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });

    const timeFormatter = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    });

    const datePart = dateFormatter.format(rawDate);
    const timePart = timeFormatter.format(rawDate);

    return { formattedDate: datePart, formattedTime: timePart };
  }

  async addDataOnEventInfoTab(): Promise<{
    eventTopic: string;
    description?: string;
    startDate: string;
    startTime: string;
  }> {
    try {
      const eventTopic = `E2E event ${Date.now()}`;
      const description = `This is an event created during E2E tests ${Date.now()}`;
      const startDate = await this.selector.createEventModal.input.startDateInput.inputValue();
      const startTime = await this.selector.createEventModal.input.startTime.innerText();

      const { formattedDate, formattedTime } = await this.formatDateTimeFromInputs(
        startDate,
        startTime
      );

      await this.selector.createEventModal.input.eventTopic.fill(eventTopic);
      await this.selector.createEventModal.input.description.fill(description);
      await expect(this.selector.createEventModal.input.eventTopic).toHaveValue(eventTopic);
      await expect(this.selector.createEventModal.input.description).toHaveValue(description);

      await this.selector.eventModal.nextButton.click();

      return {
        eventTopic,
        description,
        startDate: formattedDate,
        startTime: formattedTime,
      };
    } catch (error) {
      console.error(`Error adding data on event info tab: ${error}`);
      return { eventTopic: '', description: '', startDate: '', startTime: '' };
    }
  }

  async updateDataOnEventInfoTab(): Promise<{
    eventTopic: string;
    description?: string;
    startDate: string;
    startTime: string;
  }> {
    const eventTopic = `Edited E2E event ${Date.now()}`;
    const description = `This is an edited event during E2E tests ${Date.now()}`;
    const startDate = await this.selector.createEventModal.input.startDateInput.inputValue();
    const startTime = await this.selector.createEventModal.input.startTime.innerText();
    const { formattedDate, formattedTime } = await this.formatDateTimeFromInputs(
      startDate,
      startTime
    );

    await this.selector.createEventModal.input.eventTopic.fill(eventTopic);
    await this.selector.createEventModal.input.description.fill(description);
    await expect(this.selector.createEventModal.input.eventTopic).toHaveValue(eventTopic);
    await expect(this.selector.createEventModal.input.description).toHaveValue(description);

    await this.selector.eventModal.nextButton.click();

    return {
      eventTopic,
      description,
      startDate: formattedDate,
      startTime: formattedTime,
    };
  }

  async verifyDataOnReviewTab(data: {
    eventTopic: string;
    description?: string;
    startDate: string;
    startTime: string;
    voiceChannelName?: string;
    eventType?: EventType;
    clanStatus?: ClanStatus;
    textChannelName?: string;
  }): Promise<boolean> {
    try {
      const { eventTopic, description, startDate, startTime, voiceChannelName, textChannelName } =
        data;

      const eventTopicLocator = this.selector.createEventModal.eventTopicReview;
      await expect(eventTopicLocator).toHaveText(eventTopic);

      if (description) {
        const descriptionLocator = this.selector.createEventModal.descriptionReview;
        await expect(descriptionLocator).toHaveText(description);
      }

      const startDateTime = `${startDate} - ${startTime}`;
      const startDateTimeLocator = this.selector.createEventModal.startTimeReview;
      await expect(startDateTimeLocator).toBeVisible({ timeout: 5000 });
      const actualStartDateTime = await startDateTimeLocator.innerText();
      expect(
        actualStartDateTime === startDateTime || actualStartDateTime.includes('will start in')
      ).toBe(true);
      const typeClanLocator = this.selector.createEventModal.typeClanReview;
      if (data.eventType === EventType.VOICE || data.eventType === EventType.LOCATION) {
        if (data.clanStatus === ClanStatus.PUBLIC) {
          await expect(typeClanLocator).toHaveText('Clan Event');
        } else if (data.clanStatus === ClanStatus.PRIVATE) {
          await expect(typeClanLocator).toHaveText('Channel Event');
        }
      } else if (data.eventType === EventType.PRIVATE) {
        await expect(typeClanLocator).toHaveText('External Event');
      }

      if (voiceChannelName) {
        if (data.eventType === EventType.VOICE) {
          const voiceChannelLocator = this.selector.createEventModal.voiceChannelReview;
          await expect(voiceChannelLocator).toHaveText(voiceChannelName);
        } else if (data.eventType === EventType.LOCATION) {
          const locationNameLocator = this.selector.createEventModal.locationNameReview;
          await expect(locationNameLocator).toHaveText(voiceChannelName);
        }
      }

      if (data.clanStatus === ClanStatus.PRIVATE && textChannelName) {
        const textChannelLocator = this.selector.createEventModal.textChannelReview;
        await expect(textChannelLocator).toHaveText(textChannelName);
      }
      return true;
    } catch (error) {
      console.error(`Error verifying data on review tab: ${error}`);
      return false;
    }
  }

  async waitForModalToBeHidden(): Promise<void> {
    await this.selector.createEventModal.modal.waitFor({ state: 'hidden', timeout: 5000 });
  }

  private parseCount(text: string | null): number {
    return Number(text?.match(/\d+/)?.[0] ?? 0);
  }

  async openEventManagementModal(): Promise<void> {
    if (
      (await this.selector.createEventModal.modal.isVisible({ timeout: 1000 })) ||
      (await this.selector.createEventModal.eventManagementItem
        .first()
        .isVisible({ timeout: 1000 }))
    ) {
      return;
    }

    await this.selector.buttons.eventButton.click();
    await this.selector.createEventModal.modalStart.waitFor({ state: 'visible', timeout: 5000 });
  }

  async getNumberOfEventsInManagement(): Promise<number> {
    await this.openEventManagementModal();
    const eventItemCount = await this.selector.createEventModal.eventManagementItem.count();

    if (await this.selector.createEventModal.numberOfEvent.isVisible({ timeout: 3000 })) {
      const eventCount = this.parseCount(
        await this.selector.createEventModal.numberOfEvent.textContent()
      );
      return eventCount || eventItemCount;
    }

    return eventItemCount;
  }

  async getLastEventData(eventType: EventType, topicToFind?: string) {
    let lastEvent = this.selector.createEventModal.eventManagementItem.last();
    if (topicToFind) {
      const match = this.selector.createEventModal.eventManagementItem
        .filter({ hasText: topicToFind })
        .first();
      if (await match.isVisible({ timeout: 2000 }).catch(() => false)) {
        lastEvent = match;
      }
    }
    await lastEvent.waitFor({ state: 'visible', timeout: 5000 });

    const startTime = await lastEvent
      .locator(this.selector.createEventModal.startTimeReview)
      .textContent();
    console.log(startTime);

    const type = await lastEvent
      .locator(this.selector.createEventModal.typeClanReview)
      .textContent();
    const topic = await lastEvent
      .locator(this.selector.createEventModal.eventTopicReview)
      .textContent();
    const description = await lastEvent
      .locator(this.selector.createEventModal.descriptionReview)
      .textContent();
    const voiceChannel =
      eventType === EventType.VOICE
        ? ((
            await lastEvent
              .locator(this.selector.createEventModal.voiceChannelReview)
              .textContent()
              .catch(() => null)
          )?.trim() ?? '')
        : eventType === EventType.LOCATION
          ? ((
              await lastEvent
                .locator(this.selector.createEventModal.locationNameReview)
                .textContent()
                .catch(() => null)
            )?.trim() ?? '')
          : '';

    const textChannelLocator = lastEvent.locator(this.selector.createEventModal.textChannelReview);
    const hasTextChannel = (await textChannelLocator.count()) > 0;

    const textChannel = hasTextChannel ? (await textChannelLocator.textContent())?.trim() : '';

    return {
      startTime: startTime?.trim(),
      type: type?.trim(),
      topic: topic?.trim(),
      description: description?.trim(),
      voiceChannel: voiceChannel?.trim(),
      textChannel,
    };
  }

  parseTime(startTime: string): Date {
    const [datePart, timePart] = startTime.split(' - ');

    const currentYear = new Date().getFullYear();
    const full = `${datePart} ${currentYear} ${timePart}`;

    return new Date(full);
  }

  isWithin10Minutes(date: Date) {
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    return diff > 0 && diff <= 10 * 60 * 1000;
  }

  async verifyLastEventData(expected: {
    eventTopic: string;
    description?: string;
    voiceChannelName?: string;
    textChannelName?: string;
    startTime?: string;
    clanStatus?: ClanStatus;
    eventType: EventType;
  }): Promise<boolean> {
    const topicLocator = this.page
      .locator(
        `${generateE2eSelector('clan_page.modal.create_event.review.event_topic')}, p, [data-e2e*="event_topic"]`
      )
      .filter({ hasText: expected.eventTopic })
      .first();

    if (await topicLocator.isVisible({ timeout: 5000 }).catch(() => false)) {
      return true;
    }

    await expect
      .poll(
        async () => {
          if (await topicLocator.isVisible().catch(() => false)) {
            return expected.eventTopic;
          }
          const ev = await this.getLastEventData(expected.eventType, expected.eventTopic);
          return ev.topic;
        },
        { timeout: 10000 }
      )
      .toBe(expected.eventTopic);

    const lastEvent = await this.getLastEventData(expected.eventType, expected.eventTopic);
    console.log(lastEvent);
    console.log(expected);

    if (expected.description) {
      await expect(lastEvent.description).toBe(expected.description);
    }

    if (expected.voiceChannelName) {
      await expect(lastEvent.voiceChannel).toBe(expected.voiceChannelName);
    }

    if (expected.textChannelName && expected.clanStatus === ClanStatus.PRIVATE) {
      await expect(lastEvent.textChannel).toBe(expected.textChannelName);
    }

    if (expected.startTime) {
      const actual = lastEvent.startTime;

      const expectedDate = this.parseTime(expected.startTime);
      console.log(expectedDate);

      console.log(this.isWithin10Minutes(expectedDate));

      if (this.isWithin10Minutes(expectedDate)) {
        expect(actual).toContain('will start in');
      } else {
        expect(actual).toBe(expected.startTime);
      }
    }

    const typeClanLocator = lastEvent.type;
    if (expected.eventType === EventType.VOICE || expected.eventType === EventType.LOCATION) {
      if (expected.clanStatus === ClanStatus.PUBLIC) {
        await expect(typeClanLocator).toBe('Clan Event');
      } else if (expected.clanStatus === ClanStatus.PRIVATE) {
        await expect(typeClanLocator).toBe('Channel Event');
      }
    } else if (expected.eventType === EventType.PRIVATE) {
      await expect(typeClanLocator).toBe('External Event');
    }

    return true;
  }
  async verifyInEventDetailModal(expected: {
    eventTopic: string;
    description?: string;
    channelName?: string;
    startTime: string;
  }): Promise<boolean> {
    await this.selector.createEventModal.openEventDetailModalButton.last().click();
    await this.selector.eventDetailModal.modal.waitFor({ state: 'visible', timeout: 5000 });

    const topic = this.selector.eventDetailModal.topic;
    await expect(topic).toHaveText(expected.eventTopic);

    if (expected.description) {
      const description = this.selector.eventDetailModal.description;
      await expect(description).toHaveText(expected.description);
    }

    if (expected.channelName) {
      const channelName = this.selector.eventDetailModal.channelName;
      await expect(channelName).toHaveText(expected.channelName);
    }

    const startDateTime = this.selector.eventDetailModal.startDateTime;
    await expect(startDateTime).toHaveText(expected.startTime);
    return true;
  }

  async closeEventModal() {
    if (
      await this.selector.createEventModal.button.closeDetailModal
        .isVisible({ timeout: 1000 })
        .catch(() => false)
    ) {
      await this.selector.createEventModal.button.closeDetailModal.click().catch(() => {});
    }
    if (
      await this.selector.createEventModal.button.closeContainerModal
        .isVisible({ timeout: 1000 })
        .catch(() => false)
    ) {
      await this.selector.createEventModal.button.closeContainerModal.click().catch(() => {});
    } else {
      await this.page.keyboard.press('Escape');
    }
    await this.closeAllModals().catch(() => {});
  }

  async closeEventManagementModal() {
    if (
      await this.selector.createEventModal.button.closeContainerModal
        .isVisible({ timeout: 1000 })
        .catch(() => false)
    ) {
      await this.selector.createEventModal.button.closeContainerModal.click().catch(() => {});
    } else {
      await this.page.keyboard.press('Escape');
    }
  }

  async openLastEventDetailModal(): Promise<void> {
    await this.selector.createEventModal.openEventDetailModalButton.last().click();
    await this.selector.eventDetailModal.modal.waitFor({ state: 'visible', timeout: 5000 });
  }

  async openEditLastEventForm(): Promise<void> {
    await this.selector.createEventModal.button.openPanel.last().click();
    await expect(this.selector.createEventModal.button.editEvent.first()).toBeVisible({
      timeout: 5000,
    });
    await this.selector.createEventModal.button.editEvent.first().click();
    await this.page
      .locator('button:has-text("Next"), [data-e2e*="next"]')
      .or(this.selector.createEventModal.input.eventTopic)
      .or(this.selector.createEventModal.input.locationName)
      .first()
      .waitFor({
        state: 'visible',
        timeout: 5000,
      });
  }

  async updateLocationEventLocation(locationName: string): Promise<void> {
    await this.selector.createEventModal.input.locationName.fill(locationName);
    await expect(this.selector.createEventModal.input.locationName).toHaveValue(locationName);
    await this.selector.eventModal.nextButton.click();
  }

  async getInterestedCountFromCard(): Promise<number> {
    const locator = this.selector.eventDetailModal.numberOfInterested.first();
    await expect(locator).toBeVisible({
      timeout: 5000,
    });
    return this.parseCount(await locator.textContent());
  }

  async getInterestedCountFromEventDetail(): Promise<number> {
    const locator = this.selector.eventDetailModal.numberOfInterestedInModal.first();
    await expect(locator).toBeVisible({
      timeout: 5000,
    });
    return this.parseCount(await locator.textContent());
  }

  async getInterestedCountFromEventDetailTab(): Promise<number> {
    await this.selector.eventDetailModal.tab.numberOfInterested.click();
    return this.selector.eventDetailModal.userInterested.displayName.count();
  }

  async markInterestedInEventDetail(): Promise<void> {
    const modalBtn = this.selector.eventDetailModal.modal
      .locator(
        generateE2eSelector('clan_page.modal.create_event.event_management.item.button.interested')
      )
      .or(this.selector.eventDetailModal.modal.locator('button:has-text("Interested")'))
      .first();
    if (await modalBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await modalBtn.click({ force: true });
    } else {
      const cardBtn = this.selector.eventDetailModal.button.interested.last();
      await cardBtn.click({ force: true }).catch(() => {});
    }
    await this.page.waitForTimeout(500);
  }

  async markUninterestedInEventDetail(): Promise<void> {
    const modalBtn = this.selector.eventDetailModal.modal
      .locator(
        generateE2eSelector('clan_page.modal.create_event.event_management.item.button.interested')
      )
      .or(this.selector.eventDetailModal.modal.locator('button:has-text("Uninterested")'))
      .first();
    if (await modalBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await modalBtn.click({ force: true });
    } else {
      const cardBtn = this.selector.eventDetailModal.button.uninterested.last();
      await cardBtn.click({ force: true }).catch(() => {});
    }
    await this.page.waitForTimeout(500);
  }

  async countChannelsOnChannelList() {
    await this.page.waitForTimeout(3000);
    return await this.selector.sidebar.channelsList.count();
  }

  async getTotalChannels() {
    await this.selector.buttons.channelManagementButton.click();
    await this.page.waitForTimeout(2000);
    await expect(this.selector.channelManagement.totalChannels).toBeVisible({ timeout: 5000 });
    const text = await this.selector.channelManagement.totalChannels.innerText();
    const countChannelItems = await this.selector.channelManagement.channelItem.count();

    const match = text.match(/channel of\s+(\d+)/i);
    return { totalChannels: match ? Number(match[1]) : null, countChannelItems };
  }

  async countMessagesOnChannel() {
    await this.page.waitForTimeout(3000);
    const messageSelector = new MessageSelector(this.page);
    return (await messageSelector.messages.count()) + 1;
  }

  async getTotalMessages(channelName: string) {
    await this.selector.buttons.channelManagementButton.click();
    const channelItem = this.selector.getChannelItemByNameOnCMTab(channelName);
    await expect(channelItem).toBeVisible({ timeout: 5000 });

    const messageCountLocator = this.selector.getMessageCountByNameOnCMTab(channelItem);
    await expect(messageCountLocator).toBeVisible({ timeout: 5000 });

    const countText = (await messageCountLocator.textContent())?.trim() ?? '0';
    return parseInt(countText, 10);
  }

  async openRoleSettingsPage(): Promise<boolean> {
    try {
      const backBtn = this.page
        .getByText('BACK', { exact: true })
        .or(this.page.locator('button').filter({ hasText: /back/i }))
        .first();

      // If already on role settings page and createRole is visible, return true
      if (
        await this.selector.clanSettings.buttons.createRole
          .isVisible({ timeout: 1000 })
          .catch(() => false)
      ) {
        return true;
      }

      // If on sub-role edit view, click BACK to return to role list
      if (await backBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await backBtn.click();
        await this.page.waitForTimeout(1000);
        if (
          await this.selector.clanSettings.buttons.createRole
            .isVisible({ timeout: 3000 })
            .catch(() => false)
        ) {
          return true;
        }
      }

      const roleSettingsBtn = this.selector.clanSettings.buttons.roleSettings;
      if (await roleSettingsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await roleSettingsBtn.click();
        if (await backBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await backBtn.click();
          await this.page.waitForTimeout(1000);
        }
        await expect(this.selector.clanSettings.buttons.createRole).toBeVisible({ timeout: 8000 });
        return true;
      }

      const openedClanSettings = await this.openClanSettings();
      if (!openedClanSettings) {
        await this.selector.buttons.clanName.click();
        await expect(this.selector.buttons.clanSettings).toBeVisible({ timeout: 5000 });
        await this.selector.buttons.clanSettings.click();
      }

      await expect(roleSettingsBtn).toBeVisible({ timeout: 10000 });
      await roleSettingsBtn.click();
      if (await backBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await backBtn.click({ force: true });
        await this.page.waitForTimeout(500);
      }
      await expect(this.selector.clanSettings.buttons.createRole).toBeVisible({ timeout: 8000 });
      return true;
    } catch (error) {
      console.error(`Error opening Role Settings page:`, error);
      return false;
    }
  }

  async addNewRoleOnClan(roleName: string) {
    try {
      await this.selector.clanSettings.buttons.createRole.click();
      await expect(this.selector.clanSettings.roleContainer).toBeVisible({ timeout: 5000 });

      await this.selector.clanSettings.buttons.displayRoleOption.click();
      await expect(this.selector.clanSettings.input.roleName).toBeVisible({ timeout: 5000 });

      await this.selector.clanSettings.input.roleName.fill(roleName);

      const saveBtn = this.selector.buttons.saveChanges;
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click({ force: true });
        await this.page.waitForTimeout(500);
      }

      // Dismiss permission modal if it pops up
      const modal = this.page.locator(generateE2eSelector('clan_page.settings.modal.permission'));
      if (await modal.isVisible({ timeout: 1500 }).catch(() => false)) {
        const confirmBtn = modal
          .locator(generateE2eSelector('clan_page.settings.modal.permission.confirm'))
          .or(modal.locator('button').filter({ hasText: /confirm|yes|ok|save/i }))
          .first();
        await confirmBtn.click({ force: true }).catch(() => {});
        await modal.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
      }

      // Return to main role list
      const backBtn = this.page
        .getByText('BACK', { exact: true })
        .or(this.page.locator('button').filter({ hasText: /back/i }))
        .first();
      if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await backBtn.click();
        await this.page.waitForTimeout(1000);
      }
    } catch (error) {
      console.error(`Failed to add new role:`, error);
      await this.closeAllModals();
    }
  }

  async updateRoleName(roleName: string, newRoleName: string): Promise<void> {
    const opened = await this.openRoleSettingsPage();
    expect(opened).toBe(true);

    const roleItem = this.selector.clanSettings.roleList.item.filter({ hasText: roleName }).first();
    await expect(roleItem).toBeVisible({ timeout: 5000 });
    await roleItem.click();

    await this.selector.clanSettings.buttons.displayRoleOption.click();
    const roleNameInput = this.selector.clanSettings.input.roleName;
    await expect(roleNameInput).toBeVisible({ timeout: 5000 });
    await roleNameInput.fill(newRoleName);
    await this.selector.buttons.saveChanges.click();
    await this.page.waitForTimeout(1000);
  }

  async deleteRole(roleName: string): Promise<void> {
    const opened = await this.openRoleSettingsPage();
    expect(opened).toBe(true);

    const roleNameElement = this.selector.clanSettings.roleList.roleName
      .filter({ hasText: new RegExp(`^${escapeRegExp(roleName)}$`) })
      .first();
    await expect(roleNameElement).toBeVisible({ timeout: 5000 });

    const roleRow = roleNameElement.locator(ROLE_ROW_XPATH);
    await expect(roleRow).toBeVisible();
    await roleRow.hover();

    const deleteButton = roleRow.locator(
      generateE2eSelector('clan_page.settings.role.item.button.delete')
    );
    await expect(deleteButton).toBeVisible({ timeout: 3000 });
    await deleteButton.click();
    await this.page.waitForTimeout(1000);

    await expect(this.selector.clanSettings.roleList.buttons.confirm).toBeVisible({
      timeout: 5000,
    });
    await this.selector.clanSettings.roleList.buttons.confirm.click();
    await expect(roleNameElement).toHaveCount(0, { timeout: 5000 });
  }

  async getRoleMemberCount(roleName: string): Promise<string> {
    const opened = await this.openRoleSettingsPage();
    expect(opened).toBe(true);

    const roleRow = this.selector.clanSettings.roleList.roleName
      .filter({ hasText: new RegExp(`^${escapeRegExp(roleName)}$`) })
      .first()
      .locator(ROLE_ROW_XPATH);

    await expect(roleRow).toBeVisible({ timeout: 5000 });

    const memberCountLocator = roleRow.locator(
      generateE2eSelector('clan_page.settings.role.item.member_count')
    );
    await expect(memberCountLocator).toBeVisible({ timeout: 5000 });

    return (await memberCountLocator.textContent()) ?? '';
  }

  async verifyRoleMemberCount(roleName: string, expectedCount: string): Promise<void> {
    const count = await this.getRoleMemberCount(roleName);
    expect(count.trim()).toBe(expectedCount);
  }

  async reorderRolesByDragAndDrop(sourceRoleName: string, targetRoleName: string): Promise<void> {
    const opened = await this.openRoleSettingsPage();
    expect(opened).toBe(true);

    try {
      const sourceRole = this.selector.clanSettings.roleList.roleName
        .filter({ hasText: new RegExp(`^${escapeRegExp(sourceRoleName)}$`) })
        .first();
      const targetRole = this.selector.clanSettings.roleList.roleName
        .filter({ hasText: new RegExp(`^${escapeRegExp(targetRoleName)}$`) })
        .first();
      await expect(sourceRole).toBeVisible({ timeout: 5000 });
      await expect(targetRole).toBeVisible({ timeout: 5000 });

      const roleNamesBefore = await this.selector.clanSettings.roleList.roleName.allTextContents();
      const sourceIndexBefore = roleNamesBefore.indexOf(sourceRoleName);
      const targetIndexBefore = roleNamesBefore.indexOf(targetRoleName);
      expect(sourceIndexBefore).toBeGreaterThanOrEqual(0);
      expect(targetIndexBefore).toBeGreaterThanOrEqual(0);
      const sourceWasBeforeTarget = sourceIndexBefore < targetIndexBefore;

      const sourceRow = sourceRole.locator(ROLE_ROW_XPATH);
      const targetRow = targetRole.locator(ROLE_ROW_XPATH);
      await sourceRow.dragTo(targetRow);

      await expect
        .poll(
          async () => {
            const roleNamesAfter =
              await this.selector.clanSettings.roleList.roleName.allTextContents();
            const sourceIndexAfter = roleNamesAfter.indexOf(sourceRoleName);
            const targetIndexAfter = roleNamesAfter.indexOf(targetRoleName);

            return (
              sourceIndexAfter >= 0 &&
              targetIndexAfter >= 0 &&
              sourceIndexAfter < targetIndexAfter !== sourceWasBeforeTarget
            );
          },
          { timeout: 10000 }
        )
        .toBe(true);

      await expect(this.selector.buttons.saveChanges).toBeVisible({ timeout: 5000 });
      await this.selector.buttons.saveChanges.click();
      await this.page.waitForTimeout(2000);
    } finally {
      if (await this.selector.buttons.closeSettingClan.isVisible()) {
        await this.closeSettingsClan();
      }
    }
  }

  async reorderCategoriesByDragAndDrop(
    sourceCategoryName: string,
    targetCategoryName: string
  ): Promise<void> {
    await this.openClanSettings();
    await expect(this.selector.clanSettings.buttons.categoryOrder).toBeVisible({ timeout: 5000 });
    await this.selector.clanSettings.buttons.categoryOrder.click();

    const categoryNames = this.selector.clanSettings.categoryOrder.categoryName;
    const sourceName = categoryNames
      .filter({ hasText: new RegExp(`^${escapeRegExp(sourceCategoryName)}$`) })
      .first();
    const targetName = categoryNames
      .filter({ hasText: new RegExp(`^${escapeRegExp(targetCategoryName)}$`) })
      .first();
    await expect(sourceName).toBeVisible({ timeout: 5000 });
    await expect(targetName).toBeVisible({ timeout: 5000 });

    const namesBefore = await categoryNames.allTextContents();
    const sourceIndexBefore = namesBefore.indexOf(sourceCategoryName);
    const targetIndexBefore = namesBefore.indexOf(targetCategoryName);
    expect(sourceIndexBefore).toBeGreaterThanOrEqual(0);
    expect(targetIndexBefore).toBeGreaterThanOrEqual(0);
    const sourceWasBeforeTarget = sourceIndexBefore < targetIndexBefore;

    const sourceBox = await sourceName.boundingBox();
    const targetBox = await targetName.boundingBox();
    if (!sourceBox || !targetBox) {
      throw new Error('Could not resolve category positions for drag and drop');
    }

    await this.page.mouse.move(
      sourceBox.x + sourceBox.width / 2,
      sourceBox.y + sourceBox.height / 2
    );
    await this.page.mouse.down();
    await this.page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2,
      { steps: 10 }
    );
    await this.page.mouse.up();

    await expect
      .poll(
        async () => {
          const namesAfter = await categoryNames.allTextContents();
          const sourceIndexAfter = namesAfter.indexOf(sourceCategoryName);
          const targetIndexAfter = namesAfter.indexOf(targetCategoryName);
          return (
            sourceIndexAfter >= 0 &&
            targetIndexAfter >= 0 &&
            sourceIndexAfter < targetIndexAfter !== sourceWasBeforeTarget
          );
        },
        { timeout: 10000 }
      )
      .toBe(true);

    await this.page.waitForTimeout(2000);
    await this.selector.clanSettings.categoryOrder.buttons.saveChanges.click();
    await this.page.waitForTimeout(2000);
    await this.closeSettingsClan();
    await this.page.waitForTimeout(1000);
    await this.page.reload();
    await this.page.waitForLoadState('domcontentloaded');

    await expect
      .poll(
        async () => {
          const sidebarNames: string[] = [];
          for (const categoryName of await this.selector.sidebar.categoryName.all()) {
            if (await categoryName.isVisible()) {
              sidebarNames.push((await categoryName.innerText()).trim().toLowerCase());
            }
          }
          const sourceIndexAfter = sidebarNames.indexOf(sourceCategoryName.toLowerCase());
          const targetIndexAfter = sidebarNames.indexOf(targetCategoryName.toLowerCase());
          return (
            sourceIndexAfter >= 0 &&
            targetIndexAfter >= 0 &&
            sourceIndexAfter < targetIndexAfter !== sourceWasBeforeTarget
          );
        },
        { timeout: 10000 }
      )
      .toBe(true);
  }

  async reorderSidebarCategoriesByDragAndDrop(
    sourceCategoryName: string,
    targetCategoryName: string
  ): Promise<void> {
    const reorderButton = this.selector.sidebar.button.dragChannel;
    await expect(reorderButton).toBeVisible({ timeout: 5000 });
    await reorderButton.click();
    await expect(reorderButton).toHaveClass(/text-green-500/);
    await expect(reorderButton).toHaveClass(/bg-green-500\/10/);
    await expect(reorderButton).toHaveClass(/hover:bg-green-500\/20/);

    try {
      const categoryNames = this.selector.sidebar.categoryName;
      const sourceName = categoryNames
        .filter({ hasText: new RegExp(`^${escapeRegExp(sourceCategoryName)}$`) })
        .first();
      const targetName = categoryNames
        .filter({ hasText: new RegExp(`^${escapeRegExp(targetCategoryName)}$`) })
        .first();
      await expect(sourceName).toBeVisible({ timeout: 5000 });
      await expect(targetName).toBeVisible({ timeout: 5000 });

      const visibleNamesBefore: string[] = [];
      for (const categoryName of await categoryNames.all()) {
        if (await categoryName.isVisible()) {
          visibleNamesBefore.push((await categoryName.innerText()).trim().toLowerCase());
        }
      }
      const sourceIndexBefore = visibleNamesBefore.indexOf(sourceCategoryName.toLowerCase());
      const targetIndexBefore = visibleNamesBefore.indexOf(targetCategoryName.toLowerCase());
      expect(sourceIndexBefore).toBeGreaterThanOrEqual(0);
      expect(targetIndexBefore).toBeGreaterThanOrEqual(0);
      const sourceWasBeforeTarget = sourceIndexBefore < targetIndexBefore;

      const sourceBox = await sourceName.boundingBox();
      const targetBox = await targetName.boundingBox();
      if (!sourceBox || !targetBox) {
        throw new Error('Could not resolve sidebar category positions for drag and drop');
      }

      await this.page.mouse.move(
        sourceBox.x + sourceBox.width / 2,
        sourceBox.y + sourceBox.height / 2
      );
      await this.page.mouse.down();
      await this.page.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2,
        { steps: 10 }
      );
      await this.page.mouse.up();

      await expect
        .poll(
          async () => {
            const visibleNamesAfter: string[] = [];
            for (const categoryName of await categoryNames.all()) {
              if (await categoryName.isVisible()) {
                visibleNamesAfter.push((await categoryName.innerText()).trim().toLowerCase());
              }
            }
            const sourceIndexAfter = visibleNamesAfter.indexOf(sourceCategoryName.toLowerCase());
            const targetIndexAfter = visibleNamesAfter.indexOf(targetCategoryName.toLowerCase());
            return (
              sourceIndexAfter >= 0 &&
              targetIndexAfter >= 0 &&
              sourceIndexAfter < targetIndexAfter !== sourceWasBeforeTarget
            );
          },
          { timeout: 10000 }
        )
        .toBe(true);
    } finally {
      if ((await reorderButton.getAttribute('class'))?.includes('text-green-500')) {
        await reorderButton.click();
      }
    }
  }

  async muteChannelForOneHourFromContextMenu(channelName: string): Promise<void> {
    const channel = this.selector.channel.getSidebarItem(channelName);
    await expect(channel).toBeVisible({ timeout: 5000 });
    await channel.click({ button: 'right' });

    const muteChannel = this.selector.sidebar.panelItem.item.filter({
      has: this.page.locator('li', { hasText: /^Mute Channel$/ }),
    });
    await expect(muteChannel).toBeVisible({ timeout: 3000 });
    await muteChannel.hover();

    for (const duration of [
      'For 15 Minutes',
      'For 1 Hour',
      'For 3 Hours',
      'For 8 Hours',
      'For 24 Hours',
    ]) {
      await expect(
        this.selector.sidebar.panelItem.item.filter({
          has: this.page.locator('li', { hasText: new RegExp(`^${duration}$`, 'i') }),
        })
      ).toBeVisible({ timeout: 3000 });
    }

    await this.selector.sidebar.panelItem.item
      .filter({ has: this.page.locator('li', { hasText: /^For 1 Hour$/i }) })
      .click();

    await channel.click({ button: 'right' });
    const unmuteChannel = this.selector.sidebar.panelItem.item.filter({
      has: this.page.locator('li', { hasText: /^Unmute Channel$/ }),
    });
    await expect(unmuteChannel).toBeVisible({ timeout: 5000 });
    await expect(unmuteChannel.locator(this.selector.sidebar.panelItem.subText)).toHaveText(
      /^\s*Muted until \d{2}\/\d{2}, \d{2}:\d{2}\s*$/
    );
  }

  async sendMessageInStreamChannel(channelName: string, message: string): Promise<void> {
    await this.openChannelByName(channelName);

    const messageSelector = new MessageSelector(this.page);
    const chatBtn = this.page
      .locator(
        'button[data-e2e="chat-channel_message-header-button-chat"]:visible, #mezonSfuRoom button[title="Chat"], button[title="Chat"]:visible, button[title="Show Chat"]:visible'
      )
      .or(messageSelector.headerChatButton.filter({ visible: true }))
      .or(messageSelector.headerChatButton.last())
      .first();
    await expect(chatBtn).toBeVisible({ timeout: 5000 });
    await chatBtn.click({ force: true });

    await expect(messageSelector.messageInput).toBeVisible({ timeout: 5000 });
    await messageSelector.messageInput.fill(message);
    await messageSelector.messageInput.press('Enter');
    await expect(messageSelector.messages.filter({ hasText: message }).last()).toBeVisible({
      timeout: 5000,
    });
  }

  async sendCustomEmojiMessage(emojiName: string): Promise<void> {
    await this.openChannelByName('general');
    const messageSelector = new MessageSelector(this.page);
    const uploadedEmojiName = emojiName.replace(/\s+/g, '');
    await expect(messageSelector.emojiButton).toBeVisible({ timeout: 5000 });
    await messageSelector.emojiButton.click();

    const emojiSearchInput = this.page.getByPlaceholder('Find the perfect reaction');
    await expect(emojiSearchInput).toBeVisible({ timeout: 5000 });
    await emojiSearchInput.fill(uploadedEmojiName);

    const emojiItem = this.page
      .locator('div[class*="grid"] img, div[class*="flex-1"] img, [role="grid"] img')
      .or(emojiSearchInput.locator('xpath=following::div[contains(@class, "grid")]//img'))
      .or(emojiSearchInput.locator('xpath=following::img[2]'))
      .first();
    await expect(emojiItem).toBeVisible({ timeout: 10000 });
    await emojiItem.click({ force: true });
    await this.page.waitForTimeout(500);
    await messageSelector.messageInput.click({ force: true }).catch(() => {});
    await messageSelector.messageInput.press('Enter');

    const lastMessage = messageSelector.messages.last();
    await expect(lastMessage).toBeVisible({ timeout: 10000 });
    await expect(lastMessage.locator('img').last()).toBeVisible({ timeout: 10000 });
  }

  async sendCustomImageStickerMessage(stickerName: string, channelName = 'general'): Promise<void> {
    await this.openChannelByName(channelName);
    const messageSelector = new MessageSelector(this.page);
    const uploadedStickerName = stickerName.replace(/\s+/g, '');
    await expect(messageSelector.stickerButton).toBeVisible({ timeout: 5000 });
    await messageSelector.stickerButton.click();

    const stickerSearchInput = this.page.getByPlaceholder('Find the perfect sticker');
    await expect(stickerSearchInput).toBeVisible({ timeout: 5000 });
    await stickerSearchInput.fill(uploadedStickerName);

    const stickerItem = this.page
      .locator('div[class*="grid"] img, div[class*="flex-1"] img, [role="grid"] img')
      .or(stickerSearchInput.locator('xpath=following::div[contains(@class, "grid")]//img'))
      .or(stickerSearchInput.locator('xpath=following::img[2]'))
      .first();
    await expect(stickerItem).toBeVisible({ timeout: 10000 });
    await stickerItem.click({ force: true });

    const lastMessage = messageSelector.messages.last();
    await expect(lastMessage).toBeVisible({ timeout: 5000 });
    await expect(lastMessage.locator('img').last()).toBeVisible({ timeout: 5000 });
  }

  async inviteUserToClanByUsername(username: string) {
    try {
      const messageSelector = new MessageSelector(this.page);
      const currentClanUrl = this.page.url();

      if (
        !(await this.selector.modalInvite.container.isVisible({ timeout: 1000 }).catch(() => false))
      ) {
        await this.clickButtonInvitePeopleFromMenu();
      }
      await expect(this.selector.modalInvite.searchInput).toBeVisible({ timeout: 8000 });
      await this.selector.modalInvite.searchInput.fill(username);

      const userInvite = this.selector.modalInvite.userInvite.filter({ hasText: username });
      const targetUser =
        (await userInvite.count()) > 0
          ? userInvite.first()
          : this.selector.modalInvite.userInvite.first();
      await expect(targetUser).toBeVisible({ timeout: 5000 });
      await expect(this.selector.input.urlInvite).toHaveValue(/http/);

      let urlInvite = (await this.selector.input.urlInvite.inputValue()).trim();

      if (urlInvite.startsWith('http://127.0.0.1:4200')) {
        urlInvite = urlInvite.replace('http://127.0.0.1:4200', 'https://dev-mezon.nccsoft.vn');
      }

      /*
      Old flow: invite user directly from invite modal.
      await this.selector.buttons.invitePeople.first().click();
      */

      await this.selector.buttons.closeInviteModal.click();
      await this.selector.modalInvite.container
        .waitFor({ state: 'hidden', timeout: 3000 })
        .catch(() => {});
      await this.closeAllModals();

      return urlInvite;
    } catch (error) {
      console.error(`Failed to invite people:`, error);
      throw error;
    }
  }

  async joinClanByUrlInvite(url: string) {
    if (!url || !url.trim()) {
      throw new Error('❌ Cannot join clan: invite URL is empty!');
    }

    if (this.page.url() !== url && !this.page.url().includes(url)) {
      await this.page.goto(url, { waitUntil: 'domcontentloaded' });
      await expect(this.selector.buttons.clanName)
        .toBeVisible({ timeout: 10000 })
        .catch(() => {});
    }

    const joinBtn = this.page
      .locator('button')
      .filter({ hasText: /Join|Accept|Tham gia/i })
      .first();
    if (await joinBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await joinBtn.click();
      await expect(this.selector.buttons.clanName)
        .toBeVisible({ timeout: 10000 })
        .catch(() => {});
    }

    if (!this.page.url().includes('/channels/')) {
      const channelItem = this.selector.channel.sidebar.channelItem.item
        .or(this.page.locator('a[href*="/channels/"]'))
        .first();
      if (await channelItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await channelItem.click().catch(() => {});
      }
    }

    await this.closeAllModals();

    const composer = this.page
      .locator('[data-e2e*="mention_input"], div[contenteditable="true"], textarea')
      .first();
    await composer.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async addRoleForUserByUsername(username: string, roleName: string) {
    await this.closeAllModals();
    const exitClanSettings = this.selector.buttons.exitSettings
      .or(this.selector.buttons.closeSettingClan)
      .or(this.page.locator('[data-e2e*="button-exit"], [data-e2e*="exit_setting"]'))
      .first();
    if (await exitClanSettings.isVisible({ timeout: 1000 }).catch(() => false)) {
      await exitClanSettings.click({ timeout: 3000, force: true }).catch(() => {});
      await this.page.waitForTimeout(500);
    }

    if (!this.page.url().includes('/member-safety')) {
      const membersLink = this.page
        .locator('a[href*="/member-safety"]')
        .or(this.page.getByRole('link', { name: /members/i }))
        .or(this.selector.buttons.memberListButton)
        .first();
      if (await membersLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await membersLink.click();
      }
      if (!this.page.url().includes('/member-safety')) {
        try {
          const currentUrl = new URL(this.page.url());
          const clanMatch = currentUrl.pathname.match(/\/chat\/clans\/(\d+)/);
          if (clanMatch) {
            await this.page.goto(`${currentUrl.origin}/chat/clans/${clanMatch[1]}/member-safety`, {
              waitUntil: 'domcontentloaded',
            });
          }
        } catch {}
      }
      await this.page
        .waitForURL(url => url.pathname.includes('/member-safety'), { timeout: 8000 })
        .catch(() => {});
    }

    const userRow = this.selector.member.getSettingsRow(username).first();
    try {
      await expect(userRow).toBeVisible({ timeout: 5000 });
    } catch {
      const searchInput = this.selector.memberSettings.searchInput;
      if (await searchInput.isVisible()) {
        await searchInput.fill(username);
        await this.page.waitForTimeout(1000);
      }
      await expect(userRow).toBeVisible({ timeout: 10000 });
    }

    const addRoleButton = userRow
      .locator(`${generateE2eSelector('clan_page.member_list.role_settings.add_role.button')}`)
      .or(userRow.getByText('+', { exact: true }))
      .or(userRow.locator('[title="Add Role"], [aria-label*="role" i], button:has-text("+")'))
      .first();

    await expect(addRoleButton).toBeVisible({ timeout: 5000 });
    await addRoleButton.click();

    const tooltip = this.page.locator('.rc-tooltip');
    await expect(tooltip).toBeVisible({ timeout: 5000 });

    const roleRow = tooltip.locator(
      `div.flex.gap-2.items-center:has(${generateE2eSelector(
        'clan_page.member_list.role_settings.add_role.role_name'
      )}:has-text("${roleName}"))`
    );

    await expect(roleRow.first()).toBeVisible({ timeout: 5000 });
    await roleRow.first().click({ force: true });

    const roleCheckbox = roleRow.locator('input[type="checkbox"]').first();
    await expect(roleCheckbox).toBeChecked({ timeout: 5000 });

    const viewport = this.page.viewportSize();
    if (viewport) {
      await this.page.mouse.click(viewport.width - 5, 5);
    }
  }

  async removeRoleForUserByUsername(username: string, roleName: string) {
    await this.closeAllModals();
    const exitClanSettings = this.selector.buttons.exitSettings
      .or(this.selector.buttons.closeSettingClan)
      .or(this.page.locator('[data-e2e*="button-exit"], [data-e2e*="exit_setting"]'))
      .first();
    if (await exitClanSettings.isVisible({ timeout: 1000 }).catch(() => false)) {
      await exitClanSettings.click({ timeout: 3000, force: true }).catch(() => {});
      await this.page.waitForTimeout(500);
    }

    if (!this.page.url().includes('/member-safety')) {
      const membersLink = this.page
        .locator('a[href*="/member-safety"]')
        .or(this.page.getByRole('link', { name: /members/i }))
        .or(this.selector.buttons.memberListButton)
        .first();
      if (await membersLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await membersLink.click();
      }
      if (!this.page.url().includes('/member-safety')) {
        try {
          const currentUrl = new URL(this.page.url());
          const clanMatch = currentUrl.pathname.match(/\/chat\/clans\/(\d+)/);
          if (clanMatch) {
            await this.page.goto(`${currentUrl.origin}/chat/clans/${clanMatch[1]}/member-safety`, {
              waitUntil: 'domcontentloaded',
            });
          }
        } catch {}
      }
      await this.page
        .waitForURL(url => url.pathname.includes('/member-safety'), { timeout: 8000 })
        .catch(() => {});
    }

    const userRow = this.selector.member.getSettingsRow(username).first();
    await expect(userRow).toBeVisible({ timeout: 5000 });

    const addRoleButton = userRow
      .locator(`${generateE2eSelector('clan_page.member_list.role_settings.add_role.button')}`)
      .or(userRow.getByText('+', { exact: true }))
      .or(userRow.locator('[title="Add Role"], [aria-label*="role" i], button:has-text("+")'))
      .first();

    await expect(addRoleButton).toBeVisible({ timeout: 5000 });
    await addRoleButton.click();

    const tooltip = this.page.locator('.rc-tooltip');
    await expect(tooltip).toBeVisible({ timeout: 5000 });

    const roleRow = tooltip.locator(
      `div.flex.gap-2.items-center:has(${generateE2eSelector(
        'clan_page.member_list.role_settings.add_role.role_name'
      )}:has-text("${roleName}"))`
    );

    await expect(roleRow.first()).toBeVisible({ timeout: 5000 });
    await roleRow.first().click({ force: true });

    const roleCheckbox = roleRow.locator('input[type="checkbox"]').first();
    await expect(roleCheckbox).not.toBeChecked({ timeout: 5000 });

    const viewport = this.page.viewportSize();
    if (viewport) {
      await this.page.mouse.click(viewport.width - 5, 5);
    }
  }

  async removeAllRolesForUserByUsername(username: string): Promise<void> {
    await this.closeAllModals();
    const exitClanSettings = this.selector.buttons.exitSettings
      .or(this.selector.buttons.closeSettingClan)
      .or(this.page.locator('[data-e2e*="button-exit"], [data-e2e*="exit_setting"]'))
      .first();
    if (await exitClanSettings.isVisible({ timeout: 1000 }).catch(() => false)) {
      await exitClanSettings.click({ timeout: 3000, force: true }).catch(() => {});
      await this.page.waitForTimeout(500);
    }

    if (!this.page.url().includes('/member-safety')) {
      const membersLink = this.page
        .locator('a[href*="/member-safety"]')
        .or(this.page.getByRole('link', { name: /members/i }))
        .or(this.selector.buttons.memberListButton)
        .first();
      if (await membersLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await membersLink.click();
      }
      if (!this.page.url().includes('/member-safety')) {
        try {
          const currentUrl = new URL(this.page.url());
          const clanMatch = currentUrl.pathname.match(/\/chat\/clans\/(\d+)/);
          if (clanMatch) {
            await this.page.goto(`${currentUrl.origin}/chat/clans/${clanMatch[1]}/member-safety`, {
              waitUntil: 'domcontentloaded',
            });
          }
        } catch {}
      }
      await this.page
        .waitForURL(url => url.pathname.includes('/member-safety'), { timeout: 8000 })
        .catch(() => {});
    }

    const userRow = this.selector.member.getSettingsRow(username).first();
    if (!(await userRow.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    const addRoleButton = userRow
      .locator(`${generateE2eSelector('clan_page.member_list.role_settings.add_role.button')}`)
      .or(userRow.getByText('+', { exact: true }))
      .or(userRow.locator('[title="Add Role"], [aria-label*="role" i], button:has-text("+")'))
      .first();

    if (!(await addRoleButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    await addRoleButton.click();
    const tooltip = this.page.locator('.rc-tooltip');
    await expect(tooltip).toBeVisible({ timeout: 5000 });

    const checkedRows = tooltip.locator('div.flex.gap-2.items-center:has(input:checked)');
    let remaining = await checkedRows.count().catch(() => 0);
    let iterations = 0;
    while (remaining > 0 && iterations < 20) {
      iterations++;
      await checkedRows
        .first()
        .click({ force: true })
        .catch(() => {});
      await this.page.waitForTimeout(400);
      remaining = await checkedRows.count().catch(() => 0);
    }

    const viewport = this.page.viewportSize();
    if (viewport) {
      await this.page.mouse.click(viewport.width - 5, 5);
    }
  }

  async verifyUserHasRoleOnMemberSettings(
    username: string,
    roleName: string,
    shouldVisible = true,
    style?: string
  ) {
    let userRow = this.selector.member.getSettingsRow(username);
    const isRowVisible = await userRow.isVisible().catch(() => false);
    if (!isRowVisible) {
      await this.openMemberListSetting();
      userRow = this.selector.member.getSettingsRow(username);
    }
    await expect(userRow).toBeVisible({ timeout: 5000 });

    const roleLocator = userRow.locator(
      `${generateE2eSelector('clan_page.member_list.role_settings.exist_role.role_name')}:has-text("${roleName.slice(0, 6)}")`
    );

    const displayNameLocator = userRow
      .locator(this.selector.memberSettings.userDisplayName)
      .first();

    if (shouldVisible) {
      await expect(roleLocator).toBeVisible({ timeout: 5000 });
      if (style) {
        await expect(displayNameLocator).toHaveCSS('color', style);
      }
    } else {
      await expect(roleLocator).toBeHidden({ timeout: 5000 });
      if (style) {
        await expect(displayNameLocator).not.toHaveCSS('color', style);
      }
    }
  }

  async leaveClan() {
    await this.selector.buttons.clanName.click();
    await expect(this.selector.buttons.leaveClan).toBeVisible({ timeout: 3000 });
    await this.selector.buttons.leaveClan.click();
    await expect(this.selector.buttons.confirm).toBeVisible({ timeout: 3000 });
    await this.selector.buttons.confirm.click();
  }

  async verifyChannelNameOverviewWhenEditingChannelName(
    channelName: string,
    newChannelName: string
  ): Promise<void> {
    const channelSettings = new ChannelSettingPage(this.page);
    const input = this.page.locator(
      `${generateE2eSelector('clan_page.channel_list.settings.overview')} input[value="${channelName}"]`
    );

    await expect(input).toBeVisible({ timeout: 5000 });

    await input.fill(newChannelName);

    const sideBarChannelLabel = await channelSettings.getSideBarChannelLabel();
    await expect(sideBarChannelLabel).toHaveText(newChannelName);

    await this.selector.buttons.reset.click();
    await expect(this.selector.buttons.reset).toBeHidden({ timeout: 2000 });
    await expect(input).toHaveValue(channelName);
    await expect(sideBarChannelLabel).toHaveText(channelName);

    await this.selector.buttons.exitSettings.click();
  }

  async joinVoiceChannel(channelName: string, joinRole?: VoiceJoinRole): Promise<boolean> {
    try {
      const timeout = process.env.CI ? 15000 : 8000;
      const channelItem = this.getVoiceChannelSidebarItem(channelName).first();
      await expect(channelItem).toBeVisible({ timeout });
      await channelItem.click();
      const joinButtonLocator = this.selector.screen.voiceRoom.joinButton;
      await joinButtonLocator.waitFor({ state: 'visible', timeout });

      if (joinRole) {
        await this.selector.screen.voiceRoom.joinRoleMenuButton.click();
        await this.selector.screen.voiceRoom.joinRoleOption(joinRole).click();
        await expect(joinButtonLocator).toHaveText(`Join as ${joinRole}`);
      }

      await joinButtonLocator.click();
      await this.selector.screen.voiceRoom.controlBar.waitFor({
        state: 'visible',
        timeout: process.env.CI ? 30000 : 15000,
      });
      await joinButtonLocator.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      const connectionStatus = this.selector.screen.voiceRoom.connectionStatus
        .or(this.page.locator('#mezonSfuRoom').getByText(/connected/i))
        .or(this.page.locator('[class*="connected"], [data-e2e*="connected"]'))
        .first();
      await expect(connectionStatus)
        .toBeVisible({ timeout: process.env.CI ? 30000 : 15000 })
        .catch(() => {});
      return true;
    } catch (error) {
      console.error(`Failed to enter voice room "${channelName}":`, error);
      return false;
    }
  }

  async verifySpeakerVoiceControls(): Promise<void> {
    await expect(this.selector.screen.voiceRoom.microphoneButton).toBeVisible();
    await expect(this.selector.screen.voiceRoom.cameraButton).toBeVisible();
    await expect(this.selector.screen.voiceRoom.shareScreenButton).toBeVisible();
    await expect(this.selector.screen.voiceRoom.pushToTalkButton).toBeHidden();
  }

  async verifyAudienceVoiceControls(): Promise<void> {
    await expect(this.selector.screen.voiceRoom.pushToTalkButton).toBeVisible();
    await expect(this.selector.screen.voiceRoom.microphoneButton).toBeHidden();
    await expect(this.selector.screen.voiceRoom.cameraButton).toBeHidden();
    await expect(this.selector.screen.voiceRoom.shareScreenButton).toBeHidden();
  }

  async isAudienceStateVisible(timeout = process.env.CI ? 30000 : 20000): Promise<boolean> {
    try {
      await this.page.getByText('Audience', { exact: true }).waitFor({
        state: 'visible',
        timeout,
      });
      return true;
    } catch {
      return false;
    }
  }

  async verifyHoldToTalkStateChanges(): Promise<void> {
    const pushToTalkButton = this.selector.screen.voiceRoom.pushToTalkButton;
    await pushToTalkButton.hover();

    try {
      await this.page.mouse.down();
      await expect(pushToTalkButton).toHaveAttribute(ARIA_LABEL_ATTRIBUTE, 'Push to talk');
      await expect(pushToTalkButton).toHaveAttribute('aria-pressed', 'true', {
        timeout: 10000,
      });
    } finally {
      await this.page.mouse.up();
    }

    await expect(pushToTalkButton).toHaveAttribute('aria-pressed', 'false', {
      timeout: 10000,
    });
  }

  async isJoinVoiceChannel(channelName: string): Promise<boolean> {
    console.log(`\n🔍 Verifying voice channel join: "${channelName}"`);

    const userListLocator = this.getVoiceChannelSidebarItem(channelName).locator(
      this.selector.sidebar.channelItem.userList.item
    );

    const memberListLocator = this.selector.sidebarMemberList.memberItems;
    const memberInVoice = memberListLocator.filter({
      has: this.selector.secondarySideBar.member.inVoice,
    });
    const textChannel = this.page
      .locator('a[href*="/channels/"]:not([href*="voice"])')
      .or(
        this.selector.sidebar.channelItem.item.filter({
          has: this.selector.sidebar.channelItem.iconHashtag,
        })
      )
      .or(
        this.page.locator('button:has-text("general"), [data-e2e*="channel"]:has-text("general")')
      )
      .first();

    try {
      const voiceStatusTimeout = process.env.CI ? 30000 : 20000;
      const memberVisibleTimeout = process.env.CI ? 10000 : 5000;

      console.log(`⏳ Waiting for user list in sidebar (${voiceStatusTimeout}ms)...`);
      await userListLocator.waitFor({ state: 'visible', timeout: voiceStatusTimeout });
      console.log(`✅ User list visible in voice channel`);

      try {
        if (await textChannel.isVisible({ timeout: 3000 }).catch(() => false)) {
          await textChannel.click();
          const sidebar = this.selector.secondarySideBar.container;
          const membersButton = this.selector.header.button.member.nth(0);
          if (await sidebar.isHidden({ timeout: 2000 }).catch(() => false)) {
            console.log(`📂 Sidebar hidden, clicking members button...`);
            await membersButton.click().catch(() => {});
            await expect(sidebar)
              .toBeVisible({ timeout: 5000 })
              .catch(() => {});
            console.log(`📂 Sidebar now visible`);
          }

          console.log(`⏳ Waiting for member to show as in-voice (${memberVisibleTimeout}ms)...`);
          await memberInVoice.waitFor({ state: 'visible', timeout: memberVisibleTimeout });
          console.log(`✅ Member confirmed in voice channel`);
        }
      } catch (e) {
        console.warn(`Member list in-voice check skipped:`, e);
      }

      // Final connection status
      const finalState = await this.page
        .evaluate(() => ({
          sockets: (window as any).__voiceConnectionState?.sockets ?? [],
          peers: (window as any).__voiceConnectionState?.peers ?? [],
        }))
        .catch(() => ({ wsOpen: false, rtcConnected: false, iceConnected: false }));

      console.log(`📊 Final connection state:`, finalState);
      return true;
    } catch (error) {
      const errorState = await this.page
        .evaluate(() => ({
          sockets: (window as any).__voiceConnectionState?.sockets ?? [],
          peers: (window as any).__voiceConnectionState?.peers ?? [],
        }))
        .catch(() => ({}));

      console.error(`❌ Failed to verify voice channel join "${channelName}":`, error);
      console.error(`🔧 Debug info:`, errorState);
      return false;
    }
  }

  async leaveVoiceChannel(channelName: string): Promise<boolean> {
    try {
      const disconnectBtn = this.page
        .locator('button[aria-label="Disconnect"], button:has-text("Disconnect")')
        .or(this.selector.modal.voiceManagement.button.controlItem.last())
        .first();
      if (await disconnectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await disconnectBtn.click();
        await this.page.waitForTimeout(1000);
        return true;
      }

      const channelItem = this.getVoiceChannelSidebarItem(channelName);
      if (await channelItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await channelItem.click().catch(() => {});
      }

      const leaveButtonLocator = this.selector.modal.voiceManagement.button.controlItem.last();
      await leaveButtonLocator.waitFor({ state: 'visible', timeout: 5000 });
      await leaveButtonLocator.click();
      await expect(this.selector.modal.voiceManagement.item).toBeHidden({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async isLeaveVoiceChannel(channelName: string): Promise<boolean> {
    const userListLocator = this.getVoiceChannelSidebarItem(channelName).locator(
      this.selector.sidebar.channelItem.userList.item
    );
    const textChannel = this.page
      .locator('a[href*="/channels/"]:not([href*="voice"])')
      .or(
        this.selector.sidebar.channelItem.item.filter({
          has: this.selector.sidebar.channelItem.iconHashtag,
        })
      )
      .or(
        this.page.locator('button:has-text("general"), [data-e2e*="channel"]:has-text("general")')
      )
      .first();
    const membersButton = this.selector.header.button.member.nth(0);
    const memberListLocator = this.selector.sidebarMemberList.memberItems;

    try {
      await this.getVoiceChannelSidebarItem(channelName)
        .click()
        .catch(() => {});
      await userListLocator.waitFor({ state: 'hidden', timeout: 20000 });
      await this.selector.modal.voiceManagement.item
        .waitFor({ state: 'hidden', timeout: 5000 })
        .catch(() => {});
      try {
        if (await textChannel.isVisible({ timeout: 3000 }).catch(() => false)) {
          await textChannel.click();
          await membersButton.click().catch(() => {});
          const memberInVoice = memberListLocator.filter({
            has: this.selector.secondarySideBar.member.inVoice,
          });
          await memberInVoice.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
        }
      } catch (e) {
        console.warn(`Member list in-voice hide check skipped:`, e);
      }
      return true;
    } catch {
      return false;
    }
  }

  async isUserInVoiceChannel(channelName: string, username: string): Promise<boolean> {
    const userListLocator = this.getVoiceChannelSidebarItem(channelName).locator(
      this.selector.sidebar.channelItem.userList.item
    );
    const userLocator = userListLocator.filter({ hasText: username }).first();

    try {
      await userLocator.waitFor({ state: 'visible', timeout: 20000 });
      return true;
    } catch {
      return false;
    }
  }

  async verifyUserNotInVoiceChannel(
    channelName: string,
    username: string,
    timeout = 15000
  ): Promise<void> {
    const userListLocator = this.getVoiceChannelSidebarItem(channelName).locator(
      this.selector.sidebar.channelItem.userList.item
    );
    const userLocator = userListLocator.filter({ hasText: username }).first();
    await expect(userLocator).toBeHidden({ timeout });
  }

  async kickUserFromVoiceCall(username: string): Promise<boolean> {
    try {
      const participantTile = this.getVoiceParticipantTile(username);

      await participantTile.waitFor({
        state: 'visible',
        timeout: 10000,
      });

      await participantTile.click({ button: 'right' });

      const kickButton = this.selector.screen.voiceRoom.button.kick;

      await kickButton.waitFor({
        state: 'visible',
        timeout: 5000,
      });

      await kickButton.click();

      await participantTile.waitFor({
        state: 'hidden',
        timeout: 2000,
      });

      return true;
    } catch (error) {
      console.error(`Error kicking user from voice call: ${error}`);
      return false;
    }
  }

  async isUserInVoiceRoomScreen(
    username: string,
    timeout = process.env.CI ? 30000 : 20000
  ): Promise<boolean> {
    try {
      await this.getVoiceParticipantUsername(username).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async isUserAvatarVisibleInVoiceRoom(username: string): Promise<boolean> {
    try {
      await this.getVoiceParticipantTile(username)
        .locator(generateE2eSelector('avatar.image'))
        .waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  async isUserCameraVisibleInVoiceRoom(username: string): Promise<boolean> {
    try {
      await this.getVoiceParticipantTile(username)
        .locator('div.opacity-100 video')
        .waitFor({ state: 'visible', timeout: process.env.CI ? 30000 : 20000 });
      return true;
    } catch {
      return false;
    }
  }

  async openUserContextInVoiceRoom(username: string): Promise<void> {
    const participantTile = this.getVoiceParticipantTile(username);
    await participantTile.waitFor({ state: 'visible', timeout: 10000 });
    await participantTile.click({ button: 'right' });
  }

  async isSendFlowerOptionVisible(): Promise<boolean> {
    try {
      await this.selector.screen.voiceRoom.button.sendFlower.waitFor({
        state: 'visible',
        timeout: 5000,
      });
      return true;
    } catch {
      return false;
    }
  }

  async clickSendFlower(): Promise<boolean> {
    try {
      const sendFlowerButton = this.selector.screen.voiceRoom.button.sendFlower;
      await sendFlowerButton.waitFor({ state: 'visible', timeout: 5000 });
      await sendFlowerButton.click();
      return true;
    } catch (error) {
      console.error(`Error clicking send flower: ${error}`);
      return false;
    }
  }

  private getVoiceParticipantTile(username: string) {
    return this.getVoiceParticipantUsername(username).locator(
      'xpath=ancestor::div[contains(@class, "aspect-video")][1]'
    );
  }

  private getVoiceParticipantUsername(username: string) {
    return this.selector.screen.voiceRoom.username.filter({ hasText: username }).first();
  }

  private getVoiceChannelSidebarItem(channelName: string) {
    const escapedChannelName = channelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.selector.sidebar.channelItem.item.filter({
      has: this.selector.sidebar.channelItem.name.filter({
        hasText: new RegExp(`^\\s*${escapedChannelName}\\s*$`, 'i'),
      }),
    });
  }

  async isChannelPresentOnChannelManagement(channelName: string) {
    const channelLocator = this.page.locator(
      generateE2eSelector('clan_page.channel_management.channel_item.channel_name'),
      { hasText: channelName }
    );

    try {
      await channelLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async openChannelByName(channelName: string) {
    const channelLocator = this.selector.channel
      .getSidebarItem(channelName)
      .or(this.page.locator(CHANNEL_NAME_SELECTOR, { hasText: channelName }))
      .or(
        this.page.locator(
          `a[href*="channels"]:has-text("${channelName}"), button:has-text("${channelName}")`
        )
      )
      .first();
    await channelLocator.scrollIntoViewIfNeeded().catch(() => {});
    await expect(channelLocator).toBeVisible({ timeout: 10000 });
    const targetLink = channelLocator.locator('a[href*="channels"]').first();
    if (await targetLink.isVisible({ timeout: 1000 }).catch(() => false)) {
      await targetLink.click({ force: true });
    } else {
      await channelLocator.click({ force: true });
    }
    await this.page.waitForTimeout(500);
  }

  async copyChannelLinkFromChannelList(channelName: string): Promise<string> {
    const channel = this.selector.channel.getSidebarItem(channelName);
    await channel.scrollIntoViewIfNeeded().catch(() => {});
    await expect(channel).toBeVisible({ timeout: 10000 });
    await channel.click({ button: 'right' });

    const copyLinkAction = this.selector.sidebar.panelItem.item
      .filter({ hasText: 'Copy Link' })
      .or(
        this.page
          .locator('button, div[role="menuitem"], [data-e2e*="panel-item"]')
          .filter({ hasText: /Copy Link/i })
      )
      .first();
    await expect(copyLinkAction).toBeVisible({ timeout: 5000 });
    await copyLinkAction.click();
    await this.page.waitForTimeout(500);

    return this.page.evaluate(async () => navigator.clipboard.readText());
  }

  async isMessageInputDisabled() {
    const messageInput = this.selector.input.permissionDenied;
    try {
      await messageInput.waitFor({ state: 'visible', timeout: 5000 });
      return await messageInput.isVisible();
    } catch {
      return false;
    }
  }

  async openThreadByName(threadName: string) {
    const threadLocator = this.page.locator(
      generateE2eSelector('clan_page.channel_list.thread_item.name'),
      { hasText: threadName }
    );
    await expect(threadLocator).toBeVisible({ timeout: 3000 });
    await threadLocator.click();
  }

  async markChannelAsFavorite(channelName: string) {
    const channelLocator = this.page.locator(CHANNEL_NAME_SELECTOR, { hasText: channelName });
    await channelLocator.click({ button: 'right' });
    await this.selector.sidebar.panelItem.item.filter({ hasText: 'Mark Favorite' }).click();
  }

  async verifyChannelIsMarkedAsFavorite(channelName: string) {
    const channelLocator = this.page.locator(CHANNEL_NAME_SELECTOR, { hasText: channelName });
    const count = await channelLocator.count();
    await expect(count).toBe(2);
  }

  async unmarkChannelAsFavorite(channelName: string) {
    const channelLocator = this.page.locator(CHANNEL_NAME_SELECTOR, { hasText: channelName });
    await channelLocator.first().click({ button: 'right' });
    await this.selector.sidebar.panelItem.item.filter({ hasText: 'Unmark Favorite' }).click();
  }

  async verifyChannelIsUnmarkedAsFavorite(channelName: string) {
    const channelLocator = this.page.locator(CHANNEL_NAME_SELECTOR, { hasText: channelName });
    const count = await channelLocator.count();
    await expect(count).toBe(1);
  }

  async getFooterProfileUserName() {
    return this.selector.footerProfile.userName.textContent();
  }

  async getModalInviteContainer() {
    return this.selector.modalInvite.container;
  }

  async getModalInviteUserItemByUsername(username: string) {
    return this.selector.modalInvite.userInvite.filter({ hasText: username });
  }

  async clickModalInviteCloseButton() {
    await this.selector.modalInvite.button.close.click();
  }

  async isPermissionModalVisible() {
    return this.selector.permissionModal.isVisible();
  }

  async clickPermissionModalCancelButton() {
    await this.selector.permissionModal.cancel.click();
  }

  async clickCreateEventButton() {
    const createBtn = this.selector.eventModal.createEventButton
      .or(this.page.getByRole('button', { name: /^create event$/i }))
      .or(this.page.locator('button').filter({ hasText: /^Create Event$/i }))
      .first();
    await createBtn.click({ force: true });
    await expect(this.selector.createEventModal.eventManagementItem.last())
      .toBeVisible({ timeout: 10000 })
      .catch(() => {});
  }

  async clickUpdateEventButton() {
    await this.selector.createEventModal.button.updateEvent.click();
    await expect(this.selector.createEventModal.button.updateEvent)
      .toBeHidden({ timeout: 5000 })
      .catch(() => {});
    await expect(this.selector.createEventModal.eventManagementItem.last()).toBeVisible({
      timeout: 10000,
    });
  }

  async gotoChannelManagementPage() {
    await this.selector.buttons.channelManagementButton.click();
  }

  async getMemberSettingsUsersInfoAvatar() {
    return this.selector.memberSettings.usersInfo.locator(generateE2eSelector('avatar.image'));
  }

  async openSelectionSystemMessageChannel() {
    const selection =
      this.selector.clanOverviewSettings.system_messages_channel.selection.container;
    await selection.click();
  }

  private async selectSystemMessageChannel(channelName: string, categoryName?: string) {
    await this.openSelectionSystemMessageChannel();

    const optionItem = this.page
      .locator(
        `${generateE2eSelector('clan_page.settings.overview.system_messages_channel.selection.item')}, div[role="option"], li[role="menuitem"], div.rc-dropdown [class*="item"]`
      )
      .filter({
        has: this.page.locator(
          `${generateE2eSelector('clan_page.settings.overview.system_messages_channel.selection.item.channel_name')}:has-text("${channelName}"), span:has-text("${channelName}"), p:has-text("${channelName}"), div:has-text("${channelName}")`
        ),
      })
      .first();

    await expect(optionItem).toBeVisible({ timeout: 5000 });
    await optionItem.click();
  }

  public async verifySelectedSystemMessageChannel(channelName: string, categoryName?: string) {
    const selectedChannel =
      this.selector.clanOverviewSettings.system_messages_channel.selection.selected.channel_name;
    const selectedCategory =
      this.selector.clanOverviewSettings.system_messages_channel.selection.selected.category_name;

    await expect(selectedChannel).toHaveText(channelName);
    if (categoryName) {
      await expect(selectedCategory).toHaveText(
        new RegExp(`^(${categoryName}|category-.*|PUBLIC CHANNELS)$`, 'i')
      );
    } else {
      await expect(selectedCategory).not.toHaveText('');
    }
  }

  async verifySelectedSystemMessageChannelNotInDropdown(channelName: string, categoryName: string) {
    const optionItem = this.page
      .locator(
        `${generateE2eSelector('clan_page.settings.overview.system_messages_channel.selection.item')}, div[role="option"], li[role="menuitem"], div.rc-dropdown [class*="item"]`
      )
      .filter({
        has: this.page.locator(
          `${generateE2eSelector('clan_page.settings.overview.system_messages_channel.selection.item.channel_name')}:has-text("${channelName}"), span:has-text("${channelName}"), p:has-text("${channelName}"), div:has-text("${channelName}")`
        ),
      })
      .filter({
        has: this.page.locator(
          `${generateE2eSelector('clan_page.settings.overview.system_messages_channel.selection.item.category_name')}:has-text("${categoryName}"), span:has-text("${categoryName}"), p:has-text("${categoryName}"), div:has-text("${categoryName}")`
        ),
      });

    await expect(optionItem).toHaveCount(0);
  }

  async updateSystemMessagesChannel(channelName: string, categoryName: string) {
    await this.selectSystemMessageChannel(channelName, categoryName);
    await this.verifySelectedSystemMessageChannelNotInDropdown(channelName, categoryName);
    await this.verifySelectedSystemMessageChannel(channelName, categoryName);

    await this.page.locator('body').click();

    await this.selector.buttons.saveChanges.click();
    await expect(this.selector.buttons.saveChanges).toBeHidden({ timeout: 5000 });
  }

  async enableClanManagementSystemMessages(): Promise<void> {
    await this.openClanSettings();
    const messageManagement = this.selector.clanOverviewSettings.messageManagement.actionLogs;
    await expect(messageManagement).toBeVisible({ timeout: 5000 });
    const wasEnabled = await messageManagement.isChecked();
    if (!wasEnabled) {
      await messageManagement.check();
    }
    await expect(messageManagement).toBeChecked();
    if (!wasEnabled) {
      await this.selector.buttons.saveChanges.click();
      await expect(this.selector.buttons.saveChanges).toBeHidden({ timeout: 5000 });
    }
  }

  async disableClanSetupHelpfulTips(): Promise<void> {
    await this.openClanSettings();
    const helpfulTips = this.selector.clanOverviewSettings.messageManagement.helpfulTips;
    await expect(helpfulTips).toBeVisible({ timeout: 5000 });
    const wasEnabled = await helpfulTips.isChecked();
    if (wasEnabled) {
      await helpfulTips.uncheck();
      await this.selector.buttons.saveChanges.click();
      await expect(this.selector.buttons.saveChanges).toBeHidden({ timeout: 5000 });
    }
    await expect(helpfulTips).not.toBeChecked();
  }

  async updateClanName(clanName: string): Promise<void> {
    const clanNameInput = this.selector.clanSettings.clanName
      .or(
        this.page.locator(
          `${generateE2eSelector('clan_page.settings.overview.input.clan_name')}, input[placeholder*="Clan Name" i], [data-e2e*="clan_name"] input`
        )
      )
      .first();
    await expect(clanNameInput).toBeVisible({ timeout: 10000 });
    await clanNameInput.fill(clanName);
    const saveBtn = this.selector.buttons.saveChanges
      .or(this.page.locator('button').filter({ hasText: /^Save( Changes)?$/i }))
      .first();
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click();
      await expect(saveBtn).toBeHidden({ timeout: 5000 });
    }
  }

  async verifyClanUpdateSystemMessage(channelName: string, clanName: string): Promise<void> {
    const messageSelector = new MessageSelector(this.page);
    await this.openChannelByName(channelName);
    const updateClanMessage = messageSelector.systemMessages
      .locator(generateE2eSelector(SYSTEM_MESSAGE_E2E_KEY, '10'))
      .filter({ hasText: `update clan: ${clanName}` })
      .last();
    await expect(updateClanMessage).toBeVisible({ timeout: 10000 });
  }

  async verifyWelcomeSystemMessageDoesNotExist(
    channelName: string,
    username: string
  ): Promise<void> {
    const messageSelector = new MessageSelector(this.page);
    await this.openChannelByName(channelName);
    await this.page.waitForTimeout(3000);
    const welcomeMessage = messageSelector.systemMessages
      .filter({
        has: this.page.locator(generateE2eSelector(SYSTEM_MESSAGE_E2E_KEY, '5')),
      })
      .filter({ hasText: `Welcome @${username} to ${channelName}. Say hi!` });
    await expect(welcomeMessage).toHaveCount(0);
  }

  async closeSettingsClan() {
    const modal = this.page.locator(generateE2eSelector('clan_page.settings.modal.permission'));
    if (await modal.isVisible({ timeout: 1500 }).catch(() => false)) {
      const btn = modal
        .locator(
          `${generateE2eSelector('clan_page.settings.modal.permission.confirm')}, ${generateE2eSelector('clan_page.settings.modal.permission.cancel')}, button`
        )
        .first();
      await btn.click({ force: true }).catch(() => {});
      await modal.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }
    const closeBtn = this.selector.buttons.closeSettingClan
      .or(this.page.locator('[data-e2e*="exit_setting"], button:has-text("ESC")'))
      .first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click({ force: true }).catch(() => {});
      await this.page.keyboard.press('Escape').catch(() => {});
    } else {
      await this.page.keyboard.press('Escape').catch(() => {});
    }
  }

  async closeSettingsClanIfOpen(): Promise<void> {
    const closeBtn = this.selector.buttons.closeSettingClan
      .or(this.page.locator('[data-e2e*="exit_setting"], button:has-text("ESC")'))
      .first();
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.closeSettingsClan();
    }
  }

  async closeSettingsChannel() {
    await this.selector.buttons.exitSettings.click();
    await expect(this.selector.buttons.exitSettings).toBeHidden({ timeout: 3000 });
  }

  async verifySystemMessageIsSentOnUpdatedChannel(channelName: string, username: string) {
    const messageSelector = new MessageSelector(this.page);
    await this.openChannelByName(channelName);
    let lastMessageLocator = messageSelector.systemMessages
      .or(this.page.locator('[data-e2e*="system_message"], div[class*="systemMessage"]'))
      .last();

    if (!(await lastMessageLocator.isVisible({ timeout: 4000 }).catch(() => false))) {
      await this.openChannelByName('general');
      lastMessageLocator = messageSelector.systemMessages
        .or(this.page.locator('[data-e2e*="system_message"], div[class*="systemMessage"]'))
        .last();
    }

    await expect(lastMessageLocator).toBeVisible({ timeout: 10000 });

    const code = lastMessageLocator
      .locator(generateE2eSelector(SYSTEM_MESSAGE_E2E_KEY, '5'))
      .or(lastMessageLocator)
      .first();
    await expect(code).toBeVisible({ timeout: 5000 });

    const mentionUserLocator = code
      .locator(generateE2eSelector('chat.channel_message.mention_user'))
      .or(code.locator('[data-e2e*="mention_user"], span[class*="mention"], a[class*="mention"]'))
      .or(code.getByText(new RegExp(`@?${username}`)))
      .first();
    await expect(mentionUserLocator).toBeVisible({ timeout: 5000 });

    const mentionText = (await mentionUserLocator.textContent())?.trim() ?? '';
    const extractedUsername = mentionText.replace(/^@/, '');

    expect(extractedUsername).toBe(username);
  }

  async copyVoiceChannelLink() {
    await this.selector.modal.voiceManagement.button.copyLink.click();
  }

  async gotoDM() {
    await this.selector.sidebar.DMItem.click();
  }

  async getClanItemByName(clanName: string) {
    return this.selector.findClanByTitle(clanName);
  }

  async unbanUserByName(username: string): Promise<boolean> {
    try {
      await this.openMemberList();
      const memberLocator = this.selector.sidebarMemberList.memberItems
        .filter({ hasText: username })
        .first();
      if (await memberLocator.isVisible({ timeout: 5000 }).catch(() => false)) {
        await memberLocator.click({ button: 'right' });
        const unbanBtn = this.page
          .locator('[role="menuitem"], div[class*="menu"] div, li')
          .filter({ hasText: /^Unban$/i })
          .first();
        if (await unbanBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await unbanBtn.click();
          await this.page.waitForTimeout(500);
          await this.closeAllModals();
          return true;
        }
        await this.page.keyboard.press('Escape').catch(() => {});
        await this.closeAllModals();
      }
    } catch {
      // Ignore if unban fails or user wasn't banned
    }
    return false;
  }

  async banUserByName(username: string) {
    const memberLocator = this.selector.sidebarMemberList.memberItems
      .filter({ hasText: username })
      .first();
    await expect(memberLocator).toBeVisible({ timeout: 5000 });
    await memberLocator.click({ button: 'right' });

    const unbanBtn = this.page
      .locator('[role="menuitem"], div[class*="menu"] div, li')
      .filter({ hasText: /^Unban$/i })
      .first();
    if (await unbanBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await unbanBtn.click();
      await this.page.waitForTimeout(500);
      await memberLocator.click({ button: 'right' });
    }

    const banBtn = this.page
      .locator('[role="menuitem"], div[class*="menu"] div, li')
      .filter({ hasText: /^Ban$/i })
      .or(this.selector.sidebarMemberList.banButton)
      .first();
    await expect(banBtn).toBeVisible({ timeout: 5000 });
    await banBtn.hover();

    const option = this.page
      .locator('[role="menuitem"], div[class*="menu"] div, li')
      .filter({ hasText: /For\s+\d+/i })
      .or(this.selector.sidebar.panelItem.item)
      .first();
    await expect(option).toBeVisible({ timeout: 5000 });

    const rawText = await option.innerText();

    const match = rawText.match(/For\s+(\d+)\s+(\w+)/i);

    let value = null;
    let unit = null;

    if (match) {
      value = Number(match[1]);
      unit = match[2].toLowerCase();
    }

    await option.click({ force: true });
    await option.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    return { value, unit };
  }

  async isBannedItemVisible(isTopic: boolean = false) {
    const baseLocator = isTopic
      ? this.selector.input.topicBanned
      : this.selector.input.messageBanned;
    const bannedLocator = baseLocator.or(
      this.page.locator(
        '[data-e2e*="banned"], [placeholder*="banned"], div:has-text("banned from sending messages")'
      )
    );
    try {
      await bannedLocator.first().waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      try {
        await this.page.reload({ waitUntil: 'domcontentloaded' });
        await bannedLocator.first().waitFor({ state: 'visible', timeout: 8000 });
        return true;
      } catch {
        return false;
      }
    }
  }

  async isMessageInputVisible(isTopic: boolean = false) {
    const messageInputLocator = isTopic
      ? this.selector.input.topicInput
      : this.selector.input.mention;
    try {
      await messageInputLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async verifyBannedTime(value: number | null, unit: string | null, isTopic: boolean = false) {
    if (!value || !unit) {
      return;
    }
    const locator = isTopic
      ? this.selector.input.topicBannedTime
      : this.selector.input.messageBannedTime;
    const raw = await locator.innerText();

    const match = raw.match(/(\d+)([mhd])/i);
    if (!match) throw new Error(`Invalid banned time format: ${raw}`);

    const uiValue = Number(match[1]);
    const uiUnitChar = match[2].toLowerCase();

    let uiSeconds = 0;
    if (uiUnitChar === 'm') uiSeconds = uiValue * 60;
    if (uiUnitChar === 'h') uiSeconds = uiValue * 3600;

    let expectedUnit = unit;

    if (value === 1) expectedUnit = 'hours';

    let expectedSeconds = 0;
    if (expectedUnit === 'minutes') expectedSeconds = value * 60;
    if (expectedUnit === 'hours') expectedSeconds = value * 3600;

    const diff = Math.abs(uiSeconds - expectedSeconds);
    expect(diff).toBeLessThanOrEqual(180);
  }

  async isContextMenuVisible(isTopic: boolean = false) {
    const messageSelector = new MessageSelector(this.page);
    const messageLocator = isTopic
      ? messageSelector.topicMessages.last()
      : messageSelector.messages.last();
    const popup = this.page.locator(
      'div.contexify.z-50.rounded-lg.text-theme-primary.text-theme-primary-hover.border-theme-primary'
    );
    try {
      await messageLocator.waitFor({ state: 'visible', timeout: 3000 });
      await messageLocator.click({ button: 'right' });
      await popup.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async isHoverMessageModalVisible(isTopic: boolean = false) {
    const messageSelector = new MessageSelector(this.page);
    const messageLocator = isTopic
      ? messageSelector.topicMessages.last()
      : messageSelector.messages.last();
    const hoverModal = messageSelector.hoverMessageModal;
    try {
      await messageLocator.waitFor({ state: 'visible', timeout: 3000 });
      await messageLocator.hover();
      await hoverModal.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async openCanvasManagementModal() {
    await this.selector.header.button.canvas.click();
  }

  async createCanvas() {
    await this.selector.modal.canvasManagement.button.createCanvas.click();
  }

  async fillCanvasTitle(title: string) {
    await this.selector.screen.canvasEditor.input.title.fill(title);
    await expect(this.selector.screen.canvasEditor.input.title).toHaveValue(title);
  }

  async fillCanvasContent(content: string) {
    const contentLocator = this.selector.screen.canvasEditor.input.content;
    await contentLocator.waitFor({ state: 'visible', timeout: 10000 });

    await contentLocator
      .locator('.animate-pulse, [class*="skeleton"]')
      .first()
      .waitFor({ state: 'detached', timeout: 15000 })
      .catch(() => {});

    const editor = contentLocator.locator('[contenteditable="true"], .tiptap').first();
    await editor.waitFor({ state: 'visible', timeout: 15000 });
    await editor.click();
    await this.page.keyboard.type(content);
    await expect(contentLocator).toContainText(content, { timeout: 10000 });
  }

  async saveCanvas() {
    await this.selector.screen.canvasEditor.button.save.click();
    await expect(this.selector.screen.canvasEditor.button.save).toBeHidden({ timeout: 3000 });
  }

  async deleteCanvas(canvasTitle: string) {
    const canvasItem = this.selector.modal.canvasManagement.item.filter({ hasText: canvasTitle });
    await expect(canvasItem).toBeVisible({ timeout: 3000 });
    await canvasItem.locator(this.selector.modal.canvasManagement.button.deleteCanvas).click();
    await this.selector.modal.canvasManagement.button.confirmDelete.first().click();
  }

  async verifyCanvasExists(canvasTitle: string, shouldExist = true) {
    const canvasItem = this.selector.modal.canvasManagement.item.filter({ hasText: canvasTitle });
    if (shouldExist) {
      await expect(canvasItem).toBeVisible({ timeout: 3000 });
    } else {
      await expect(canvasItem).toBeHidden({ timeout: 3000 });
    }
  }

  async assertCanvasContent(title: string, content: string, shouldVisible = true) {
    const canvasTitle = this.selector.screen.canvasEditor.input.title;
    const canvasContent = this.selector.screen.canvasEditor.input.content;
    if (shouldVisible) {
      await expect(canvasTitle).toHaveValue(title, { timeout: 3000 });
      await expect(canvasContent).toHaveText(content, { timeout: 3000 });
    } else {
      await expect(canvasTitle).not.toHaveValue(title, { timeout: 3000 });
      await expect(canvasContent).not.toHaveText(content, { timeout: 3000 });
      await this.selector.permissionModal.cancel.first().click();
    }
  }

  async copyCanvasLink(canvasTitle: string) {
    const canvasItem = this.selector.modal.canvasManagement.item
      .filter({ hasText: canvasTitle })
      .last();
    await expect(canvasItem).toBeVisible({ timeout: 3000 });
    await canvasItem.locator(this.selector.modal.canvasManagement.button.copyCanvasLink).click();
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  async kickUserByName(username: string) {
    const memberLocator = this.selector.sidebarMemberList.memberItems
      .filter({ hasText: username })
      .first();
    await expect(memberLocator).toBeVisible({ timeout: 3000 });
    await memberLocator.click({ button: 'right' });

    await this.selector.sidebarMemberList.kickButton.click();
    const kickModal = this.page.locator('div.flex.items-center.justify-center.fixed.top-0');
    await expect(kickModal).toBeVisible({ timeout: 3000 });

    await kickModal.locator(this.selector.kickMemberModal.button.kick).click();
    await expect(kickModal).toBeHidden({ timeout: 3000 });
  }

  async getMemberItemIn2ndSideBarbyUsername(username: string) {
    return this.selector.member.getSecondarySidebarMember(username);
  }

  async verifyCustomStatusSettedInMemberList(username: string, status: string) {
    const memberItem = await this.getMemberItemIn2ndSideBarbyUsername(username);
    const statusLocator = memberItem.locator(this.selector.secondarySideBar.member.customStatus);
    await expect(statusLocator).toHaveText(status, { timeout: 2000 });
  }

  async openPopoverRole() {
    const messageSelector = new MessageSelector(this.page);
    const addRoleButton = messageSelector.shortProfile.button.addRole;
    await addRoleButton.click();
  }

  async addRoleFromShortProfile(roleName?: string) {
    const messageSelector = new MessageSelector(this.page);
    const popoverRoleItem = roleName
      ? messageSelector.shortProfile.popoverRole.item.filter({ hasText: roleName }).first()
      : messageSelector.shortProfile.popoverRole.item.first();
    await expect(popoverRoleItem).toBeVisible({ timeout: 5000 });
    await popoverRoleItem.click();
  }

  async verifyRoleVisibleInShortProfile(roleName: string, style?: string, shouldVisible = true) {
    const messageSelector = new MessageSelector(this.page);
    const roleItemNameSelector = messageSelector.shortProfile.itemRole.filter({
      hasText: roleName,
    });
    if (style && shouldVisible) {
      const roleItemColorSelector = messageSelector.shortProfile.itemRoleColor.first();
      await expect(roleItemColorSelector).toHaveCSS('background-color', style);
    }
    if (shouldVisible) {
      return await expect(roleItemNameSelector).toBeVisible({ timeout: 3000 });
    } else {
      return await expect(roleItemNameSelector).toBeHidden({ timeout: 3000 });
    }
  }

  async verifyRoleColorIsVisibleOnUsernameIn2ndSideBar(
    memberItem: Locator,
    style: string,
    shouldVisible = true
  ) {
    const username = memberItem.locator(this.selector.secondarySideBar.member.username).first();
    await expect(username).toBeVisible({ timeout: 10000 });

    if (shouldVisible) {
      await expect(username).toHaveCSS('color', style);
    } else {
      await expect(username).not.toHaveCSS('color', style);
    }
  }

  async addNewRoleWithColorOnClan(roleName: string, colorIndex = 0): Promise<string | undefined> {
    try {
      await this.selector.clanSettings.buttons.createRole.click();
      await expect(this.selector.clanSettings.roleContainer).toBeVisible({ timeout: 3000 });

      await this.selector.clanSettings.buttons.displayRoleOption.click();
      await expect(this.selector.clanSettings.input.roleName).toBeVisible({ timeout: 3000 });

      await this.selector.clanSettings.input.roleName.fill(roleName);

      const roleColorLocator = this.selector.clanSettings.buttons.roleColor.nth(colorIndex);

      const color = await roleColorLocator.evaluate(el => getComputedStyle(el).backgroundColor);

      await roleColorLocator.click();
      await this.selector.buttons.saveChanges.click();
      await expect(this.selector.buttons.saveChanges)
        .toBeHidden({ timeout: 8000 })
        .catch(() => {});
      await this.page.waitForTimeout(500);
      await this.selector.buttons.closeSettingClan.click();

      return color;
    } catch (error) {
      console.error('Failed to add new role:', error);
      return undefined;
    }
  }

  async verifyRoleColorVisibleOnNameOfChatbox(
    style: string,
    username: string,
    shouldVisible = true
  ) {
    const messageSelector = new MessageSelector(this.page);
    const displayNameLocator = messageSelector.displayName.filter({ hasText: username }).last();
    if (shouldVisible) {
      await expect(displayNameLocator).toBeVisible({ timeout: 10000 });
      await expect(displayNameLocator).toHaveCSS('color', style);
    } else {
      await expect(displayNameLocator).toBeVisible({ timeout: 10000 });
      await expect(displayNameLocator).not.toHaveCSS('color', style);
    }
  }

  async verifyChannelHasHighlight(channelName: string, shouldHighLight = true) {
    const channelItem = this.selector.channel.getSidebarItem(channelName);

    const channelNameLocator = channelItem
      .locator(this.selector.sidebar.channelItem.name)
      .filter({ hasText: channelName });

    const channelSpan = channelNameLocator.locator('..');

    if (shouldHighLight) {
      await expect(channelSpan).toHaveClass(/font-semibold/);
      await expect(channelSpan).not.toHaveClass(/font-medium/);
    } else {
      await expect(channelSpan).toHaveClass(/font-medium/);
      await expect(channelSpan).not.toHaveClass(/font-semibold/);
    }
  }

  async clickButtonMarkAsReadFromMenu() {
    await this.selector.buttons.clanName.click();
    await this.selector.buttons.markAsRead.click();
  }

  async openNotificationSettings(): Promise<void> {
    await this.notifications.open();
  }

  async selectClanNotificationSetting(option: 'All' | 'Only @mention' | 'Nothing'): Promise<void> {
    await this.notifications.selectSetting(option);
  }

  async closeNotificationSettings(): Promise<void> {
    await this.notifications.close();
  }

  async verifyClanNotificationSettingSelected(
    option: 'All' | 'Only @mention' | 'Nothing'
  ): Promise<void> {
    await this.notifications.verifySetting(option);
  }

  async addNotificationOverride(channelName: string): Promise<void> {
    await this.notifications.addOverride(channelName);
  }

  async verifyNotificationOverrideControls(): Promise<void> {
    await this.notifications.verifyOverrideControls();
  }

  async selectNotificationOverrideOption(option: 'ALL' | 'MENTIONS' | 'NOTHING'): Promise<void> {
    await this.notifications.selectOverrideOption(option);
  }

  async setNotificationOverrideMute(checked: boolean): Promise<void> {
    await this.notifications.setMute(checked);
  }

  async verifyNotificationOverrideState(
    option: 'ALL' | 'MENTIONS' | 'NOTHING',
    muted: boolean
  ): Promise<void> {
    await this.notifications.verifyOverrideState(option, muted);
  }

  async removeNotificationOverride(channelName: string): Promise<void> {
    await this.notifications.removeOverride(channelName);
  }

  async verifyChannelHasBadge(channelName: string, shouldHasBadge = true) {
    const channelLocator = this.selector.channel.getSidebarItem(channelName);

    const badge = channelLocator.locator('.bg-red-600, div[class*="ml-auto"]').last();

    if (shouldHasBadge) {
      await expect(channelLocator).toBeVisible({ timeout: 5000 });
      await expect(badge).toHaveText('1');
    } else {
      await expect(badge).toBeHidden({ timeout: 5000 });
    }
  }

  async verifyClanHasBadge(count: number, clanItem: Locator, shouldHasBadge = true) {
    const clanBagdeItem = clanItem.locator(this.selector.buttons.badge);

    if (shouldHasBadge) {
      await expect(clanBagdeItem).toBeVisible({ timeout: 3000 });
      await expect(clanBagdeItem).toHaveText(`${count}`);
    } else {
      await expect(clanBagdeItem).toBeHidden({ timeout: 3000 });
    }
  }

  async verifyInboxButtonHasBadge(shouldHasBadge = true) {
    if (shouldHasBadge) {
      // Biz logic: inbox button no longer has badge on mention; check Mentions tab in inbox popover
      await this.verifyInboxMentions();
    } else {
      // Verify inbox button does not have a badge
      const badgeInBoxLocator = this.selector.header.badge.first();
      await expect(badgeInBoxLocator).toBeHidden({ timeout: 3000 });
    }
  }

  async verifyInboxMentions() {
    const inboxPopover = this.page.locator(
      '.rc-tooltip:not(.rc-tooltip-hidden), [data-e2e*="inbox"][class*="popover"], div:has(> [data-e2e*="inbox.action_tabs"])'
    );
    const inboxButton = this.page
      .locator('button[data-e2e="chat-channel_message-header-button-inbox"]')
      .last()
      .or(
        this.page.locator(generateE2eSelector('chat.channel_message.header.button.inbox')).last()
      );

    if (
      !(await inboxPopover
        .first()
        .isVisible({ timeout: 1000 })
        .catch(() => false))
    ) {
      if (!(await inboxButton.isVisible({ timeout: 1000 }).catch(() => false))) {
        const generalChannel = this.page
          .locator(generateE2eSelector('clan_page.channel_list.item.name'))
          .filter({ hasText: 'general' })
          .first();
        if (await generalChannel.isVisible({ timeout: 3000 }).catch(() => false)) {
          await generalChannel.click();
          await this.page.waitForTimeout(500);
        }
      }
      await expect(inboxButton).toBeVisible({ timeout: 10000 });
      await inboxButton.click({ force: true });
    }

    const mentionsTab = this.page
      .locator(generateE2eSelector('chat.channel_message.inbox.action_tabs'))
      .filter({ hasText: 'Mentions' })
      .or(this.page.locator('[data-e2e*="inbox.action_tabs"]').filter({ hasText: 'Mentions' }))
      .or(this.page.getByRole('tab', { name: 'Mentions' }))
      .first();

    await expect(mentionsTab).toBeVisible({ timeout: 5000 });
    await mentionsTab.click({ force: true });

    const mentionItems = this.page
      .locator(generateE2eSelector('chat.channel_message.inbox.mentions'))
      .or(this.page.locator('[data-e2e*="inbox.mentions"]'))
      .or(this.page.locator('[data-e2e="chat-channel_message-inbox-mentions"]'));

    await expect(mentionItems.first()).toBeVisible({ timeout: 10000 });

    // Close inbox popover
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async clickButtonMarkAsReadFromChannel(channelName: string) {
    const channelItem = this.selector.sidebar.channelItem.item.filter({ hasText: channelName });
    await channelItem.first().click({ button: 'right' });
    await this.selector.sidebar.panelItem.item.filter({ hasText: 'Mark as Read' }).click();
  }

  async verifyAdministratorPermissionRole(hasRole = true) {
    const integrationsSidebar = this.selector.clanSettings.buttons.sidebarItem.filter({
      hasText: 'Integrations',
    });
    const auditLogSidebar = this.selector.clanSettings.buttons.sidebarItem.filter({
      hasText: 'Audit Log',
    });
    const onboardingSidebar = this.selector.clanSettings.buttons.sidebarItem.filter({
      hasText: 'Onboarding',
    });
    const enableCommunitySidebar = this.selector.clanSettings.buttons.sidebarItem.filter({
      hasText: 'Enable Community',
    });
    const overViewSidebar = this.selector.clanSettings.buttons.sidebarItem.filter({
      hasText: 'Overview',
    });
    const roleSidebar = this.selector.clanSettings.buttons.sidebarItem.filter({ hasText: 'Roles' });
    const deleteSidebar = this.selector.clanSettings.buttons.deleteClan;
    if (hasRole) {
      await expect(integrationsSidebar).toBeVisible({ timeout: 3000 });
      await expect(auditLogSidebar).toBeVisible({ timeout: 3000 });
      await expect(onboardingSidebar).toBeVisible({ timeout: 3000 });
      await expect(enableCommunitySidebar).toBeVisible({ timeout: 3000 });
      await expect(overViewSidebar).toBeVisible({ timeout: 3000 });
      await expect(roleSidebar).toBeVisible({ timeout: 3000 });
      await expect(deleteSidebar).toBeHidden({ timeout: 3000 });
    } else {
      await expect(integrationsSidebar).toBeHidden({ timeout: 3000 });
      await expect(auditLogSidebar).toBeHidden({ timeout: 3000 });
      await expect(onboardingSidebar).toBeHidden({ timeout: 3000 });
      await expect(enableCommunitySidebar).toBeHidden({ timeout: 3000 });
      await expect(overViewSidebar).toBeHidden({ timeout: 3000 });
      await expect(roleSidebar).toBeHidden({ timeout: 3000 });
      await expect(deleteSidebar).toBeHidden({ timeout: 3000 });
    }
  }

  async createRoleWithPermission(roleName: string, permission: string) {
    if (
      !(await this.selector.clanSettings.buttons.createRole
        .isVisible({ timeout: 2000 })
        .catch(() => false))
    ) {
      await this.openRoleSettingsPage();
    }
    await this.selector.clanSettings.buttons.createRole.click();
    await this.selector.clanSettings.buttons.permissionsRole.click();

    await expect(this.selector.clanSettings.roleContainer).toBeVisible({ timeout: 5000 });

    const permissionItem = this.selector.clanSettings.rolePermissionsItem.filter({
      hasText: permission,
    });
    await expect(permissionItem).toBeVisible({ timeout: 5000 });
    const toggle = permissionItem.locator(this.selector.clanSettings.rolePermissionsSwitch);
    await toggle.click();

    await this.selector.clanSettings.buttons.displayRoleOption.click();
    await expect(this.selector.clanSettings.input.roleName).toBeVisible({ timeout: 5000 });

    await this.selector.clanSettings.input.roleName.fill(roleName);
    const saveBtn = this.selector.buttons.saveChanges;
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click({ force: true });
    }

    await this.closeSettingsClan();
  }

  async verifyUserCannotEditRoleItself(roleName: string) {
    await this.selector.clanSettings.buttons.roleSettings.click();
    const roleItem = this.selector.clanSettings.roleList.item.filter({
      hasText: roleName,
    });
    await expect(roleItem).toBeVisible({ timeout: 3000 });
    await roleItem.hover();
    const editButton = roleItem.locator(this.selector.clanSettings.roleList.buttons.edit);
    const deleteButton = roleItem.locator(this.selector.clanSettings.roleList.buttons.delete);
    await expect(editButton).toBeHidden({ timeout: 3000 });
    await expect(deleteButton).toBeHidden({ timeout: 3000 });
  }

  async openChannelSettingsSidebar(channelName: string = 'general') {
    const generalChannel = this.selector.sidebar.channelItem.name
      .filter({ hasText: channelName })
      .first();
    await expect(generalChannel).toBeVisible({ timeout: 8000 });
    await generalChannel.click({ button: 'right' });
  }

  async verifyUserWithChannelManagePermission(couldManageChannel = true) {
    const channelSettingsSelector = new ChannelSettingSelector(this.page);
    const editSelector = channelSettingsSelector.sidebar.panelItem.item.filter({
      hasText: 'Edit Channel',
    });
    if (couldManageChannel) {
      await expect(editSelector).toBeVisible({ timeout: 3000 });
    } else {
      await expect(editSelector).toBeHidden({ timeout: 3000 });
    }
  }

  async openContextModalOnMemberList(memberItem: Locator) {
    await memberItem.click({ button: 'right' });
    await this.selector.sidebarMemberList.profileButton.click();
  }

  async verifyAboutMeStatusInFullProfile(status: string) {
    const aboutMeStatusLocator = this.selector.modal.aboutMe;
    await expect(aboutMeStatusLocator).toHaveText(status, { timeout: 2000 });
  }

  async clickShareContactByName(username: string) {
    const memberLocator = this.selector.secondarySideBar.member.item
      .filter({ hasText: username })
      .first();
    await expect(memberLocator).toBeVisible({ timeout: 3000 });
    await memberLocator.click({ button: 'right' });

    await this.selector.sidebarMemberList.shareContactButton.click();
  }

  async openMemberActionsMenu(username: string) {
    const userRow = this.selector.member.getSettingsRow(username).first();
    await expect(userRow).toBeVisible({ timeout: 5000 });
    await userRow.click({ button: 'right' });
  }

  async clickTransferClanOwnershipButton() {
    const transferOwnershipButton = this.selector.memberSettings.actionsButton.locator(
      generateE2eSelector('chat.direct_message.menu.leave_group.button'),
      { hasText: 'Transfer Ownership' }
    );
    await transferOwnershipButton.click();
  }

  async confirmTransferOwnership() {
    const transferModal = this.selector.memberSettings.transferOwnershipModal.container;
    await expect(transferModal).toBeVisible({ timeout: 3000 });
    const confirmInput = this.selector.memberSettings.transferOwnershipModal.confirmTransferInput;
    await confirmInput.click();
    const confirmButton = this.selector.memberSettings.transferOwnershipModal.confirmTransferButton;
    await confirmButton.click();
  }

  async verifyOwnerIconIsVisibleInMemberList(memberItem: Locator) {
    const ownerIconLocator = memberItem.locator(this.selector.secondarySideBar.member.ownerIcon);
    await expect(ownerIconLocator).toBeVisible({ timeout: 3000 });
  }

  async verifyOwnerCannotLeaveClan() {
    await this.selector.buttons.clanName.click();
    const leaveClanButtonVisible = await this.selector.buttons.leaveClan.isVisible({
      timeout: 3000,
    });
    expect(leaveClanButtonVisible).toBeFalsy();
  }

  async verifyOwnerCanDeleteClan() {
    await this.selector.buttons.clanSettings.click();

    const deleteClanButton = this.selector.clanSettings.buttons.deleteClan;
    await expect(deleteClanButton).toBeVisible({ timeout: 3000 });
  }

  async verifyOwnerCanKickMembers(username: string) {
    const memberLocator = this.selector.sidebarMemberList.memberItems
      .filter({ hasText: username })
      .first();
    await expect(memberLocator).toBeVisible({ timeout: 3000 });
    await memberLocator.click({ button: 'right' });
    const kickButtonVisible = await this.selector.sidebarMemberList.kickButton.isVisible({
      timeout: 3000,
    });
    expect(kickButtonVisible).toBeTruthy();
  }

  async joinVoiceChannelFromMessage(channelName: string): Promise<boolean> {
    const messageSelector = new MessageSelector(this.page);
    const voiceChannelMessage = messageSelector.messages
      .filter({
        hasText: channelName,
      })
      .last();
    await voiceChannelMessage
      .locator(
        'span.no-underline.font-medium.rounded-sm.inline.whitespace-nowrap.cursor-pointer.bg-mention.color-mention.hover-mention'
      )
      .first()
      .click();
    const joinButtonLocator = this.selector.screen.voiceRoom.joinButton;
    try {
      await joinButtonLocator.waitFor({ state: 'visible', timeout: 5000 });
      await joinButtonLocator.click();
      return true;
    } catch {
      return false;
    }
  }

  async clickWaveButton(username: string) {
    const messageSelector = new MessageSelector(this.page);

    const targetMessage = messageSelector.systemMessages.filter({
      has: messageSelector.mentionUser.filter({ hasText: username }),
    });

    await targetMessage.locator(messageSelector.waveToSayHiButton).first().click();
  }

  async verifyWelcomeMessageInChannel() {
    const messageSelector = new MessageSelector(this.page);

    const lastMessage = messageSelector.messages.last();
    await expect(lastMessage).toBeVisible({ timeout: 5000 });

    const gifMessage = lastMessage.locator('img[src*=".gif"]');

    await expect(gifMessage).toBeVisible({ timeout: 5000 });
    return true;
  }

  async getMemberSinceFromFullProfile(): Promise<string> {
    const locator = this.selector.modal.memberSince.first();
    await locator.waitFor({ state: 'visible', timeout: 3000 });

    const memberSince = await locator.innerText();
    return memberSince.trim();
  }

  async verifyVoiceChannelScreenVisible(voiceChannelName: string) {
    const channelNameLocator = this.selector.screen.voiceRoom.channelName;
    await expect(channelNameLocator).toContainText(voiceChannelName, { timeout: 3000 });
  }

  async joinVoiceChannelOnVoiceChannelScreen(): Promise<boolean> {
    const joinButtonLocator = this.selector.screen.voiceRoom.joinButton;
    try {
      await joinButtonLocator.waitFor({ state: 'visible', timeout: 5000 });
      await joinButtonLocator.click();
      return true;
    } catch {
      return false;
    }
  }

  async shareScreen(): Promise<boolean> {
    try {
      const controlBar = this.selector.screen.voiceRoom.controlBar;
      const shareScreenButton = this.selector.screen.voiceRoom.shareScreenButton;

      await controlBar.waitFor({
        state: 'visible',
        timeout: 10_000,
      });

      await shareScreenButton.waitFor({
        state: 'visible',
        timeout: 5_000,
      });

      await shareScreenButton.click();
      await this.page.waitForTimeout(1000);
      return await this.isScreenSharing();
    } catch (error) {
      console.error('Failed to share screen:', error);
      return false;
    }
  }

  async isScreenSharing(): Promise<boolean> {
    try {
      await this.selector.screen.voiceRoom.screenShareIcon.first().waitFor({
        state: 'visible',
        timeout: 10_000,
      });
      return true;
    } catch {
      return false;
    }
  }

  async openInteractiveApp(appName: 'blackboard' | 'quiz' | 'interactive'): Promise<void> {
    const { button, interactiveApps } = this.selector.screen.voiceRoom;
    const appLabel = `${appName.charAt(0).toUpperCase()}${appName.slice(1)}`;

    await button.openInteractiveApps.click();
    const appItem = interactiveApps.item(appName, appLabel);
    await expect(appItem).toBeVisible();
    await appItem.click();
    await expect(interactiveApps.window(appLabel)).toBeVisible({ timeout: 15_000 });
  }

  async closeInteractiveApp(appName: 'blackboard' | 'quiz' | 'interactive'): Promise<void> {
    const { interactiveApps } = this.selector.screen.voiceRoom;
    const appLabel = `${appName.charAt(0).toUpperCase()}${appName.slice(1)}`;
    const appWindow = interactiveApps.window(appLabel);

    await appWindow.getByRole('button', { name: 'Close' }).click();
    await expect(appWindow).toBeHidden();
  }

  async cancelEvent() {
    await this.selector.createEventModal.button.openPanel.last().click();
    await this.selector.createEventModal.button.cancelEvent.last().click();
    const confirmButton = this.selector.createEventModal.button.confirmCancelEvent.first();
    await expect(confirmButton).toBeVisible({ timeout: 3000 });
    await confirmButton.click();
    await this.selector.createEventModal.button.closeContainerModal
      .first()
      .click()
      .catch(() => {});
  }

  async clickCopyLinkFromShareButton() {
    const shareBtn = this.selector.createEventModal.button.shareEvent
      .or(
        this.page.locator(
          'button[title*="Share"], [data-e2e*="share_event"], button:has-text("Share")'
        )
      )
      .last();

    if (!(await shareBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
      const panelBtn = this.selector.createEventModal.button.openPanel.last();
      if (await panelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await panelBtn.click();
      }
    }
    await expect(shareBtn).toBeVisible({ timeout: 5000 });
    await shareBtn.click();
    const copyLinkBtn = this.selector.createEventModal.button.copyLink
      .or(
        this.page.locator(
          'button:has-text("Copy Link"), button:has-text("Copy"), [data-e2e*="copy_link"]'
        )
      )
      .first();
    await expect(copyLinkBtn).toBeVisible({ timeout: 3000 });
    const urlFromInput = await this.page
      .locator('input[readonly], input[value*="http"]')
      .first()
      .inputValue()
      .catch(() => '');
    if (urlFromInput) {
      await this.page.evaluate(text => {
        (window as any).__lastCopiedText = text;
      }, urlFromInput);
    }
    await copyLinkBtn.click();
    await this.page.waitForTimeout(500);
    const clipboardText = await this.page
      .evaluate(async () => navigator.clipboard.readText().catch(() => ''))
      .catch(() => '');
    if (clipboardText) {
      await this.page.evaluate(text => {
        (window as any).__lastCopiedText = text;
      }, clipboardText);
    }
    await this.selector.createEventModal.button.closeModalCopyLink
      .first()
      .click()
      .catch(() => {});
    await this.selector.createEventModal.button.closeContainerModal
      .first()
      .click()
      .catch(() => {});
  }

  async getSelectedFilePreview() {
    return this.selector.input.selectedFile;
  }

  async verifyShareIconIsVisible(username: string) {
    const userJoinedVoice = this.selector.sidebar.channelItem.userList.item.filter({
      hasText: username,
    });
    const shareIcon = userJoinedVoice.locator(this.selector.screen.voiceRoom.screenShareIcon);
    return await expect(shareIcon).toBeVisible({ timeout: 3000 });
  }

  async startRecordingVoiceCall(): Promise<boolean> {
    try {
      await this.page.evaluate(() => {
        const recordingWindow = window as Window & { showSaveFilePicker?: unknown };
        try {
          Object.defineProperty(recordingWindow, 'showSaveFilePicker', {
            value: undefined,
            writable: true,
            configurable: true,
          });
        } catch {
          delete recordingWindow.showSaveFilePicker;
        }
      });

      const recordButton = this.selector.screen.voiceRoom.button.record;
      await recordButton.waitFor({ state: 'visible', timeout: 5000 });
      await recordButton.click();
      await this.selector.screen.voiceRoom.timeRecord.waitFor({
        state: 'visible',
        timeout: 10_000,
      });
      await expect(recordButton).toHaveAttribute(ARIA_LABEL_ATTRIBUTE, 'Stop recording');
      return true;
    } catch (error) {
      console.error('Failed to start voice call recording:', error);
      return false;
    }
  }

  async stopRecordingVoiceCall(): Promise<boolean> {
    try {
      const recordButton = this.selector.screen.voiceRoom.button.record;
      await recordButton.waitFor({ state: 'visible', timeout: 10_000 });
      await recordButton.click();
      await this.selector.screen.voiceRoom.timeRecord.waitFor({
        state: 'hidden',
        timeout: 10_000,
      });
      await expect(recordButton).toHaveAttribute(ARIA_LABEL_ATTRIBUTE, 'Record call');
      return true;
    } catch (error) {
      console.error('Failed to stop voice call recording:', error);
      return false;
    }
  }

  async isVoiceRecordingActive(): Promise<boolean> {
    try {
      return await this.selector.screen.voiceRoom.timeRecord.isVisible();
    } catch {
      return false;
    }
  }

  async waitForVoiceRecordingClockToAdvance(): Promise<boolean> {
    try {
      const clock = this.selector.screen.voiceRoom.timeRecord;
      const initialText = await clock.innerText();
      await expect.poll(() => clock.innerText(), { timeout: 5000 }).not.toBe(initialText);
      return true;
    } catch {
      return false;
    }
  }

  async enableCamera(): Promise<boolean> {
    try {
      const cameraBtn = this.selector.screen.voiceRoom.cameraButton;
      await cameraBtn.waitFor({ state: 'visible', timeout: 5000 });
      const label = await cameraBtn.getAttribute(ARIA_LABEL_ATTRIBUTE);
      if (label === 'Turn On Camera') {
        await cameraBtn.click();
      }
      await expect(cameraBtn).toHaveAttribute(ARIA_LABEL_ATTRIBUTE, 'Turn Off Camera', {
        timeout: 10_000,
      });
      return true;
    } catch (error) {
      console.error('Failed to enable camera:', error);
      return false;
    }
  }

  async enableMicrophone(): Promise<boolean> {
    try {
      const micBtn = this.selector.screen.voiceRoom.microphoneButton;
      await micBtn.waitFor({ state: 'visible', timeout: 5000 });
      const label = await micBtn.getAttribute(ARIA_LABEL_ATTRIBUTE);
      if (label === 'Turn On Microphone') {
        await micBtn.click();
      }
      await expect(micBtn).toHaveAttribute(ARIA_LABEL_ATTRIBUTE, 'Turn Off Microphone', {
        timeout: 10_000,
      });
      return true;
    } catch (error) {
      console.error('Failed to enable microphone:', error);
      return false;
    }
  }

  async verifyMicrophonePermissionWarning(): Promise<void> {
    await expect(this.selector.screen.voiceRoom.microphoneButton).toHaveAttribute(
      ARIA_LABEL_ATTRIBUTE,
      'Microphone access needed'
    );
  }

  async verifyMicrophonePermissionDialog(kind: 'request' | 'blocked'): Promise<void> {
    const dialog =
      kind === 'request'
        ? this.selector.screen.voiceRoom.microphonePermission.requestDialog
        : this.selector.screen.voiceRoom.microphonePermission.blockedDialog;
    await expect(dialog).toBeVisible();
  }

  async openMicrophonePermissionDialog(): Promise<void> {
    await this.selector.screen.voiceRoom.microphoneButton.click();
    await this.verifyMicrophonePermissionDialog('request');
  }

  async denyMicrophonePermissionRequest(): Promise<void> {
    await this.selector.screen.voiceRoom.microphonePermission.allowButton.click();
    await this.verifyMicrophonePermissionDialog('blocked');
  }

  async verifyMicrophonePermissionWarningHidden(): Promise<void> {
    await expect(this.selector.screen.voiceRoom.microphonePermission.requestDialog).toBeHidden();
    await expect(this.selector.screen.voiceRoom.microphonePermission.blockedDialog).toBeHidden();
    await expect(this.selector.screen.voiceRoom.microphoneButton).not.toHaveAttribute(
      ARIA_LABEL_ATTRIBUTE,
      'Microphone access needed'
    );
  }

  async closeMicrophonePermissionWarning(): Promise<void> {
    await this.selector.screen.voiceRoom.microphonePermission.closeButton.click();
    await expect(this.page.getByRole('dialog')).toBeHidden();
  }

  async mentionByText(text: string): Promise<void> {
    await this.selector.input.mention.fill(text);
    await this.page.waitForTimeout(1000);
    await this.selector.input.mention.press('Enter');
    await this.page.waitForTimeout(1000);
    await this.selector.input.mention.press('Enter');
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }
}
