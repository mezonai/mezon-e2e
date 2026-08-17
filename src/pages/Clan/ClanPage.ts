import ChannelSettingSelector from '@/data/selectors/ChannelSettingSelector';
import ClanSelector from '@/data/selectors/ClanSelector';
import MessageSelector from '@/data/selectors/MessageSelector';
import { CategorySettingPage } from '@/pages/CategorySettingPage';
import { ROUTES } from '@/selectors';
import { ChannelStatus, ChannelType, ClanStatus, ThreadStatus } from '@/types/clan-page.types';
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
const SYSTEM_MESSAGE_E2E_KEY = 'chat.system_message' as const;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class ClanPage extends BasePage {
  private readonly selector: ClanSelector;
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
      await expect(await this.selector.findClanByTitle(clanName)).toBeVisible({ timeout: 10000 });
      return true;
    } catch (error) {
      console.error(`Error creating clan: ${error}`);
      return false;
    }
  }

  async isClanPresent(clanName: string): Promise<boolean> {
    const clanLocator = this.page.locator(generateE2eSelector('clan_page.header.title.clan_name'), {
      hasText: clanName,
    });

    try {
      await clanLocator.waitFor({ state: 'visible', timeout: 5000 });
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
    const clanElements = this.selector.sidebar.clanItem;
    const clanTitles = await this.mapLocator(clanElements, async element => {
      return element.getAttribute('title');
    });
    for (const clanName of clanTitles) {
      if (onlyDeleteExpired && clanName && !this.shouldDeleteClan(clanName)) {
        continue;
      }
      await this.deleteClan(clanName || '');
      // await this.page.goto(joinUrlPaths(this.page.url(), ROUTES.DIRECT_FRIENDS));
      await this.page.waitForLoadState('domcontentloaded');
    }
    return true;
  }

  async deleteClan(clanName: string): Promise<boolean> {
    try {
      const categoryPage = new ClanMenuPanel(this.page);
      const categorySettingPage = new CategorySettingPage(this.page);

      const clanLocator = await this.selector.findClanByTitle(clanName);

      await clanLocator.click();
      await expect(categoryPage.text.clanName).toContainText(
        new RegExp(escapeRegExp(clanName), 'i'),
        { timeout: 5000 }
      );

      await categoryPage.text.clanName.click();
      await categoryPage.buttons.clanSettings.click();
      await this.page.waitForLoadState('domcontentloaded');

      let isOwner = false;

      try {
        const deleteSidebarButton = await categorySettingPage.getDeleteSidebarButton();
        await deleteSidebarButton.waitFor({ state: 'visible', timeout: 5000 });
        isOwner = true;
      } catch {
        isOwner = false;
      }

      if (!isOwner) {
        console.error(`You are not the owner of the clan "${clanName}".`);
        await this.page.goto(ROUTES.DIRECT_FRIENDS);
        return false;
      }
      await categorySettingPage.clickDeleteSidebarButton();
      await categorySettingPage.fillDeleteInput(clanName || '');
      await categorySettingPage.clickConfirmDeleteButton();
      await this.page.waitForLoadState('domcontentloaded');
      while (await this.selector.permissionModal.isVisible()) {
        await this.selector.permissionModal.cancel.first().click();
      }
      return true;
    } catch (error) {
      console.error(`Error deleting clan: ${error}`);
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
      const categoryPage = new ClanMenuPanel(this.page);

      await categoryPage.text.clanName.click();
      await categoryPage.buttons.clanSettings.click();
      return true;
    } catch (error) {
      console.error(`Error deleting clan: ${error}`);
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
    const bannerInput = this.page.locator(
      generateE2eSelector('clan_page.settings.upload.clan_banner_input')
    );
    await bannerInput.setInputFiles(filePath);
    await expect(this.selector.buttons.saveChanges).toBeVisible({ timeout: 10000 });
    await this.selector.buttons.saveChanges.click();
    await expect(this.selector.buttons.saveChanges).toBeHidden({ timeout: 15000 });
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
    await this.selector.buttons.saveChanges.click();
    await expect(this.selector.buttons.saveChanges).toBeHidden({ timeout: 5000 });
  }

  async openChannelSettings(channelName: string): Promise<void> {
    const channelLocator = this.selector.sidebar.channelItem.name.filter({ hasText: channelName });
    await channelLocator.click({ button: 'right' });
    await this.selector.sidebar.panelItem.item.filter({ hasText: 'Edit Channel' }).click();
    await expect(this.selector.input.channelName.first()).toBeVisible({ timeout: 5000 });
  }

  async openMemberListSetting(): Promise<void> {
    await expect(this.selector.buttons.memberListButton).toBeVisible({ timeout: 3000 });
    await this.selector.buttons.memberListButton.click();
    await expect(this.selector.memberSettings.userContainer.first()).toBeVisible({ timeout: 5000 });
  }

  async openChannelsListSetting(): Promise<void> {
    await expect(this.selector.buttons.channelManagementButton).toBeVisible({ timeout: 3000 });
    await this.selector.buttons.channelManagementButton.click();
    await expect(this.selector.channelManagement.totalChannels).toBeVisible({ timeout: 5000 });
  }

  async createNewChannel(
    typeChannel: ChannelType,
    channelName: string,
    status?: ChannelStatus
  ): Promise<boolean> {
    try {
      await this.selector.buttons.createChannel.last().click();
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
      if (status === ChannelStatus.PRIVATE && typeChannel === ChannelType.TEXT) {
        await this.selector.createChannelModal.toggle.isPrivate.click();
      }
      await this.selector.createChannelModal.button.confirm.click();
      await expect(this.selector.createChannelModal.input.channelName).toBeHidden({
        timeout: 5000,
      });

      return true;
    } catch (error) {
      console.error(`Error creating channel: ${error}`);
      return false;
    }
  }

  async isNewChannelPresent(channelName: string): Promise<boolean> {
    const channelLocator = this.selector.channel.getSidebarItem(channelName);

    try {
      await channelLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
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

  async deleteCategory(categoryName: string): Promise<void> {
    try {
      const categoryLocator = this.selector.sidebar.category.filter({ hasText: categoryName });
      await categoryLocator.waitFor({ state: 'visible', timeout: 5000 });
      await categoryLocator.click({ button: 'right' });
      await this.selector.sidebar.panelItem.item.filter({ hasText: 'Edit Category' }).click();
      await expect(this.selector.buttons.deleteCategory).toBeVisible({ timeout: 5000 });
      await this.selector.buttons.deleteCategory.click();
    } catch (error) {
      console.error(`Error deleting category: ${error}`);
    }
  }

  async closeCreateThreadModal(): Promise<void> {
    await this.selector.threadBox.button.closeCreateThreadModal.waitFor({
      state: 'visible',
      timeout: 5000,
    });
    await this.selector.threadBox.button.closeCreateThreadModal.click();
  }

  async openThreadModalFromHeader(): Promise<void> {
    await this.selector.header.button.thread.click();
  }

  async verifyCreateThreadButtonIsOpen(shouldVisible = true): Promise<boolean> {
    const createThreadButtonLocator = this.selector.header.button.createThread;
    if (shouldVisible) {
      await expect(createThreadButtonLocator).toBeVisible({ timeout: 5000 });
      return true;
    } else {
      await expect(createThreadButtonLocator).toBeHidden({ timeout: 5000 });
      return false;
    }
  }

  async createThread(threadName: string, status?: ThreadStatus): Promise<void> {
    await this.selector.header.button.thread.click();
    await this.selector.header.button.createThread.click();
    await this.selector.threadBox.threadNameInput.fill(threadName);
    if (status === ThreadStatus.PRIVATE) {
      await this.selector.threadBox.threadPrivateCheckbox.click();
    }
    await this.selector.threadBox.threadInputMention.fill(threadName);
    await this.selector.threadBox.threadInputMention.press('Enter');
    await this.page.waitForTimeout(2000);
  }

  async clickThreadItem(threadName: string): Promise<void> {
    await this.selector.sidePanel.thread.item
      .filter({ hasText: threadName })
      .first()
      .waitFor({ state: 'visible', timeout: 45000 });
    await this.selector.sidePanel.thread.item.filter({ hasText: threadName }).first().click();
  }

  async openMemberList(): Promise<void> {
    await this.selector.header.button.member.nth(0).first().click();
    await this.page.waitForTimeout(1000);
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
    const threadLocator = this.selector.sidebar.threadItem.name.filter({
      hasText: threadName,
    });

    try {
      await threadLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async openThread(threadName: string): Promise<void> {
    await this.page.reload();
    await this.selector.header.button.thread.click();
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
      await this.selector.buttons.clanName.click();
      await this.selector.buttons.invitePeopleFromHeaderMenu.click();
      await expect(this.selector.modalInvite.container).toBeVisible({ timeout: 3000 });
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
      await expect(this.selector.modalInvite.userInvite.first()).toBeVisible();

      const userInviteItem = this.selector.modalInvite.userInvite.first();
      const usernameElement = userInviteItem.locator('p');
      await expect(usernameElement).toBeVisible();

      const username = (await usernameElement.innerText()).trim();

      await expect(this.selector.input.urlInvite).toHaveValue(/http/);
      const urlInvite = (await this.selector.input.urlInvite.inputValue()).trim();

      if (!username || !urlInvite) {
        throw new Error('Missing invite info or URL');
      }

      await this.selector.buttons.invitePeople.first().click();
      await this.selector.buttons.closeInviteModal.click();

      await this.selector.modalInvite.container.waitFor({ state: 'hidden', timeout: 5000 });

      return { success: true, username, urlInvite };
    } catch (error) {
      console.error('Error sending invite:', error);
      return { success: false };
    }
  }

  async openDirectMessageWithUser(username: string): Promise<void> {
    const messageSelector = new MessageSelector(this.page);

    await expect(messageSelector.userNamesInDM.getByText(username, { exact: true })).toBeVisible();

    await messageSelector.userNamesInDM.getByText(username, { exact: true }).click();
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
      await this.selector.createEventModal.modalStart.waitFor({ state: 'visible', timeout: 5000 });

      await this.selector.eventModal.createEventButton.click();

      switch (eventType) {
        case EventType.LOCATION:
          await this.selector.createEventModal.type.location.click();
          break;
        case EventType.VOICE:
          await this.selector.createEventModal.type.voice.click();
          break;
        case EventType.PRIVATE:
          await this.selector.createEventModal.type.private.click();
          break;
      }
      if (voiceChannelName) {
        if (eventType === EventType.VOICE) {
          await this.selector.createEventModal.selectVoiceChannel.first().click();
          const channelItem = this.selector.createEventModal.channelItem.filter({
            hasText: voiceChannelName,
          });
          await channelItem.click();
        } else if (eventType === EventType.LOCATION) {
          await this.selector.createEventModal.input.locationName.fill(voiceChannelName);
        }
      }

      if (status === ClanStatus.PRIVATE) {
        await this.selector.createEventModal.selectChannel.last().click({ force: true });
        const channelItem = this.selector.createEventModal.channelItem.filter({
          hasText: textChannelName,
        });
        await channelItem.click();
      }

      await this.selector.eventModal.nextButton.click();

      return true;
    } catch (error) {
      console.error(`Error creating channel: ${error}`);
      return false;
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

  async getLastEventData(eventType: EventType) {
    const lastEvent = this.selector.createEventModal.eventManagementItem.last();
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
    const lastEvent = await this.getLastEventData(expected.eventType);
    console.log(lastEvent);
    console.log(expected);

    await expect(lastEvent.topic).toBe(expected.eventTopic);

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
    await this.selector.createEventModal.button.closeDetailModal.click();
    await this.selector.createEventModal.button.closeContainerModal.click();
  }

  async closeEventManagementModal() {
    await this.selector.createEventModal.button.closeContainerModal.click();
  }

  async openLastEventDetailModal(): Promise<void> {
    await this.selector.createEventModal.openEventDetailModalButton.last().click();
    await this.selector.eventDetailModal.modal.waitFor({ state: 'visible', timeout: 5000 });
  }

  async openEditLastEventForm(): Promise<void> {
    await this.selector.createEventModal.button.openPanel.last().click();
    await expect(this.selector.createEventModal.button.editEvent).toBeVisible({ timeout: 5000 });
    await this.selector.createEventModal.button.editEvent.click();
    await this.selector.createEventModal.input.locationName.waitFor({
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
    await expect(this.selector.eventDetailModal.numberOfInterested).toBeVisible({
      timeout: 5000,
    });
    return this.parseCount(await this.selector.eventDetailModal.numberOfInterested.textContent());
  }

  async getInterestedCountFromEventDetail(): Promise<number> {
    await expect(this.selector.eventDetailModal.numberOfInterestedInModal).toBeVisible({
      timeout: 5000,
    });
    return this.parseCount(
      await this.selector.eventDetailModal.numberOfInterestedInModal.textContent()
    );
  }

  async getInterestedCountFromEventDetailTab(): Promise<number> {
    await this.selector.eventDetailModal.tab.numberOfInterested.click();
    return this.selector.eventDetailModal.userInterested.displayName.count();
  }

  async markInterestedInEventDetail(): Promise<void> {
    const interestedButton = this.selector.eventDetailModal.button.interested;
    if (await interestedButton.isVisible({ timeout: 3000 })) {
      await interestedButton.click();
    }
    await expect(this.selector.eventDetailModal.button.uninterested).toBeVisible({ timeout: 5000 });
  }

  async markUninterestedInEventDetail(): Promise<void> {
    const uninterestedButton = this.selector.eventDetailModal.button.uninterested;
    if (await uninterestedButton.isVisible({ timeout: 3000 })) {
      await uninterestedButton.click();
    }
    await expect(this.selector.eventDetailModal.button.interested).toBeVisible({ timeout: 5000 });
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
      await this.selector.buttons.clanName.click();
      await expect(this.selector.buttons.clanSettings).toBeVisible({ timeout: 3000 });

      await this.selector.buttons.clanSettings.click();
      await expect(this.selector.clanSettings.buttons.roleSettings).toBeVisible({ timeout: 3000 });

      await this.selector.clanSettings.buttons.roleSettings.click();
      await expect(this.selector.clanSettings.buttons.createRole).toBeVisible({ timeout: 3000 });
      return true;
    } catch (error) {
      console.error(`Error opening Role Settings page:`, error);
      return false;
    }
  }

  async addNewRoleOnClan(roleName: string) {
    try {
      await this.selector.clanSettings.buttons.createRole.click();
      await expect(this.selector.clanSettings.roleContainer).toBeVisible({ timeout: 3000 });

      await this.selector.clanSettings.buttons.displayRoleOption.click();
      await expect(this.selector.clanSettings.input.roleName).toBeVisible({ timeout: 3000 });

      await this.selector.clanSettings.input.roleName.fill(roleName);

      await this.selector.buttons.saveChanges.click();
      await this.selector.buttons.closeSettingClan.click();
    } catch (error) {
      console.error(`Failed to add new role:`, error);
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

    const roleRow = roleNameElement.locator('xpath=ancestor::tr[1]');
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

  async inviteUserToClanByUsername(username: string) {
    try {
      const messageSelector = new MessageSelector(this.page);
      const currentClanUrl = this.page.url();

      await this.selector.modalInvite.searchInput.fill(username);

      await expect(this.selector.modalInvite.userInvite).toBeVisible({ timeout: 3000 });
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
      await this.selector.modalInvite.container.waitFor({ state: 'hidden', timeout: 3000 });

      await this.page.keyboard.press('Control+k');
      await expect(messageSelector.searchModal).toBeVisible({ timeout: 5000 });
      await expect(messageSelector.searchInput).toBeVisible({ timeout: 5000 });

      await messageSelector.searchInput.fill(username);

      const userLocator = messageSelector.searchModal
        .locator(generateE2eSelector('suggest_item'), {
          hasText: username,
        })
        .first();

      await expect(userLocator).toBeVisible({ timeout: 5000 });
      await userLocator.click();
      await this.page.waitForTimeout(1000);

      await expect(messageSelector.messageInput).toBeVisible({ timeout: 5000 });
      await messageSelector.messageInput.fill(urlInvite);
      await this.page.waitForTimeout(2000);
      await messageSelector.messageInput.press('Enter');

      await expect(messageSelector.messages.filter({ hasText: urlInvite }).last()).toBeVisible({
        timeout: 5000,
      });
      await this.page.waitForTimeout(2000);
      await this.page.goto(currentClanUrl, { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(3000);

      return urlInvite;
    } catch (error) {
      console.error(`Failed to invite people:`, error);
      return '';
    }
  }

  async joinClanByUrlInvite(url: string) {
    await this.page.waitForTimeout(2000);
    const messageSelector = new MessageSelector(this.page);

    const messageWithUrl = messageSelector.messages.last().filter({
      hasText: url,
    });

    try {
      await expect(messageWithUrl.first()).toBeVisible({ timeout: 5000 });
    } catch {
      const allTexts = await messageSelector.messages.allInnerTexts();
      throw new Error(
        `❌ No message contains URL after 5s.\nExpected: ${url}\nMessages:\n${allTexts.join('\n---\n')}`
      );
    }
    await this.page.waitForTimeout(2000);

    const messageItem = messageWithUrl.last();
    const gotoClanButton = messageItem.locator(generateE2eSelector('invite_card.button.goto_clan'));

    await expect(gotoClanButton).toBeVisible({ timeout: 10000 });
    await gotoClanButton.click();
    await expect(this.selector.buttons.clanName).toBeVisible({ timeout: 10000 });
  }

  async addRoleForUserByUsername(username: string, roleName: string) {
    await this.selector.buttons.memberListButton.click();
    const userRow = this.selector.member.getSettingsRow(username);
    await expect(userRow).toBeVisible({ timeout: 5000 });

    const addRoleButton = userRow.locator(
      `${generateE2eSelector('clan_page.member_list.role_settings.add_role.button')}`
    );

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
    await expect(
      userRow.locator(
        `${generateE2eSelector('clan_page.member_list.role_settings.exist_role.role_name')}:has-text("${roleName.slice(0, 6)}")`
      )
    ).toBeVisible({ timeout: 5000 });

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
    await this.page.reload();

    const userRow = this.selector.member.getSettingsRow(username);
    await expect(userRow).toBeVisible({ timeout: 5000 });

    const roleLocator = userRow.locator(
      `${generateE2eSelector('clan_page.member_list.role_settings.exist_role.role_name')}:has-text("${roleName.slice(0, 6)}")`
    );

    const displayNameLocator = userRow
      .locator(this.selector.memberSettings.userDisplayName)
      .first();

    const isVisible = await roleLocator.isVisible();

    if (shouldVisible) {
      expect(
        isVisible,
        `❌ Expected role "${roleName}" to be visible for user "${username}", but it is not.`
      ).toBeTruthy();
      if (style) {
        await expect(displayNameLocator).toHaveCSS('color', style);
      }
    } else {
      expect(
        isVisible,
        `❌ Expected role "${roleName}" to NOT be visible for user "${username}", but it is visible.`
      ).toBeFalsy();
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

  async joinVoiceChannel(channelName: string): Promise<boolean> {
    await this.getVoiceChannelSidebarItem(channelName).click();
    const joinButtonLocator = this.selector.screen.voiceRoom.joinButton;
    await this.page.waitForTimeout(1000);
    try {
      await joinButtonLocator.waitFor({ state: 'visible', timeout: 5000 });
      await joinButtonLocator.click();
      await this.page.waitForTimeout(1000);
      return true;
    } catch {
      return false;
    }
  }

  async isJoinVoiceChannel(channelName: string): Promise<boolean> {
    const userListLocator = this.getVoiceChannelSidebarItem(channelName).locator(
      this.selector.sidebar.channelItem.userList.item
    );

    const memberListLocator = this.selector.sidebarMemberList.memberItems;
    const memberInVoice = memberListLocator.filter({
      has: this.selector.secondarySideBar.member.inVoice,
    });
    const generalChannel = this.getVoiceChannelSidebarItem('general');

    try {
      await userListLocator.waitFor({ state: 'visible', timeout: 20000 });
      const sidebar = this.selector.secondarySideBar.container;
      const membersButton = this.selector.header.button.member.nth(0);
      await generalChannel.click();

      if (await sidebar.isHidden({ timeout: 2000 })) {
        await membersButton.click();
        await expect(sidebar).toBeVisible({ timeout: 5000 });
      }

      await memberInVoice.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async leaveVoiceChannel(channelName: string): Promise<boolean> {
    await this.getVoiceChannelSidebarItem(channelName).click();
    const leaveButtonLocator = this.selector.modal.voiceManagement.button.controlItem.last();
    try {
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
    const generalChannel = this.getVoiceChannelSidebarItem('general');
    const membersButton = this.selector.header.button.member.nth(0);
    const memberListLocator = this.selector.sidebarMemberList.memberItems;

    try {
      await this.getVoiceChannelSidebarItem(channelName).click();
      await userListLocator.waitFor({ state: 'hidden', timeout: 20000 });
      await this.selector.modal.voiceManagement.item.waitFor({ state: 'hidden', timeout: 5000 });
      await generalChannel.click();
      await membersButton.click();
      const memberInVoice = memberListLocator.filter({
        has: this.selector.secondarySideBar.member.inVoice,
      });
      await memberInVoice.waitFor({ state: 'hidden', timeout: 20000 });
      return true;
    } catch {
      return false;
    }
  }

  private getVoiceChannelSidebarItem(channelName: string) {
    const escapedChannelName = channelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.selector.sidebar.channelItem.item.filter({
      has: this.selector.sidebar.channelItem.name.filter({
        hasText: new RegExp(`^${escapedChannelName}$`),
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
    const channelLocator = this.page.locator(CHANNEL_NAME_SELECTOR, { hasText: channelName });
    await expect(channelLocator).toBeVisible({ timeout: 3000 });
    await channelLocator.click();
  }

  async copyChannelLinkFromChannelList(channelName: string): Promise<string> {
    const channel = this.selector.channel.getSidebarItem(channelName);
    await expect(channel).toBeVisible({ timeout: 5000 });
    await channel.click({ button: 'right' });

    const copyLinkAction = this.selector.sidebar.panelItem.item.filter({ hasText: 'Copy Link' });
    await expect(copyLinkAction).toBeVisible({ timeout: 3000 });
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
    await this.selector.eventModal.createEventButton.click();
    await expect(this.selector.createEventModal.eventManagementItem.last()).toBeVisible({
      timeout: 10000,
    });
  }

  async clickUpdateEventButton() {
    await this.selector.createEventModal.button.updateEvent.click();
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

  private async selectSystemMessageChannel(channelName: string, categoryName: string) {
    await this.openSelectionSystemMessageChannel();

    // const wrapItem = this.selector.clanOverviewSettings.system_messages_channel.selection.wrap_item;
    const wrapItem = this.page.locator('div.rc-dropdown');

    const targetItem = wrapItem
      .filter({
        has: this.selector.clanOverviewSettings.system_messages_channel.selection.item.channel_name.filter(
          {
            hasText: channelName,
          }
        ),
      })
      .filter({
        has: this.selector.clanOverviewSettings.system_messages_channel.selection.item.category_name.filter(
          {
            hasText: categoryName,
          }
        ),
      });

    await expect(targetItem).toBeVisible({ timeout: 3000 });
    await targetItem.click();
  }

  public async verifySelectedSystemMessageChannel(channelName: string, categoryName: string) {
    const selectedChannel =
      this.selector.clanOverviewSettings.system_messages_channel.selection.selected.channel_name;
    const selectedCategory =
      this.selector.clanOverviewSettings.system_messages_channel.selection.selected.category_name;

    await expect(selectedChannel).toHaveText(channelName);
    await expect(selectedCategory).toHaveText(categoryName);
  }

  async verifySelectedSystemMessageChannelNotInDropdown(channelName: string, categoryName: string) {
    // const wrapItem = this.selector.clanOverviewSettings.system_messages_channel.selection.wrap_item;
    const wrapItem = this.page.locator('div.rc-dropdown');

    const exists = wrapItem.filter({ hasText: channelName }).filter({ hasText: categoryName });

    await expect(exists).toHaveCount(0);
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
    const clanNameInput = this.selector.clanSettings.clanName;
    await expect(clanNameInput).toBeVisible({ timeout: 5000 });
    await clanNameInput.fill(clanName);
    await this.selector.buttons.saveChanges.click();
    await expect(this.selector.buttons.saveChanges).toBeHidden({ timeout: 5000 });
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
    await this.selector.buttons.closeSettingClan.click();
    await expect(this.selector.buttons.closeSettingClan).toBeHidden({ timeout: 3000 });
  }

  async closeSettingsChannel() {
    await this.selector.buttons.exitSettings.click();
    await expect(this.selector.buttons.exitSettings).toBeHidden({ timeout: 3000 });
  }

  async verifySystemMessageIsSentOnUpdatedChannel(channelName: string, username: string) {
    const messageSelector = new MessageSelector(this.page);
    await this.openChannelByName(channelName);
    const lastMessageLocator = messageSelector.systemMessages.last();
    await expect(lastMessageLocator).toBeVisible({ timeout: 3000 });

    const code = lastMessageLocator.locator(generateE2eSelector(SYSTEM_MESSAGE_E2E_KEY, '5'));
    await expect(code).toBeVisible({ timeout: 3000 });

    const mentionUserLocator = code.locator(
      generateE2eSelector('chat.channel_message.mention_user')
    );
    await expect(mentionUserLocator).toBeVisible();

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

  async banUserByName(username: string) {
    const memberLocator = this.selector.sidebarMemberList.memberItems
      .filter({ hasText: username })
      .first();
    await expect(memberLocator).toBeVisible({ timeout: 3000 });
    await memberLocator.click({ button: 'right' });

    await this.selector.sidebarMemberList.banButton.hover();

    const option = this.selector.sidebar.panelItem.item.first();

    const rawText = await option.innerText();

    const match = rawText.match(/For\s+(\d+)\s+(\w+)/i);

    let value = null;
    let unit = null;

    if (match) {
      value = Number(match[1]);
      unit = match[2].toLowerCase();
    }

    await option.click();

    return { value, unit };
  }

  async isBannedItemVisible(isTopic: boolean = false) {
    const bannedLocator = isTopic
      ? this.selector.input.topicBanned
      : this.selector.input.messageBanned;
    try {
      await bannedLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
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
    expect(diff).toBeLessThanOrEqual(20);
  }

  async isContextMenuVisible(isTopic: boolean = false) {
    const messageSelector = new MessageSelector(this.page);
    const messageLocator = isTopic
      ? messageSelector.topicMessages.last()
      : messageSelector.messages.last();
    await messageLocator.click({ button: 'right' });
    const popup = this.page.locator(
      'div.contexify.z-50.rounded-lg.text-theme-primary.text-theme-primary-hover.border-theme-primary'
    );
    try {
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
    await messageLocator.hover();
    const hoverModal = messageSelector.hoverMessageModal;
    try {
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
    await this.selector.screen.canvasEditor.input.content.click();
    await this.page.keyboard.type(content);
    await expect(this.selector.screen.canvasEditor.input.content).toContainText(content);
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

  async addRoleFromShortProfile() {
    const messageSelector = new MessageSelector(this.page);
    const popoverRoleItem = messageSelector.shortProfile.popoverRole.item.first();
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

    if (shouldVisible) {
      await expect(username).toBeVisible({ timeout: 3000 });
      await expect(username).toHaveCSS('color', style);
    } else {
      await expect(username).not.toHaveCSS('color', style);
    }
  }

  async addNewRoleWithColorOnClan(roleName: string): Promise<string | undefined> {
    try {
      await this.selector.clanSettings.buttons.createRole.click();
      await expect(this.selector.clanSettings.roleContainer).toBeVisible({ timeout: 3000 });

      await this.selector.clanSettings.buttons.displayRoleOption.click();
      await expect(this.selector.clanSettings.input.roleName).toBeVisible({ timeout: 3000 });

      await this.selector.clanSettings.input.roleName.fill(roleName);

      const firstRoleColorLocator = this.selector.clanSettings.buttons.roleColor.first();

      const color = await firstRoleColorLocator.evaluate(
        el => getComputedStyle(el).backgroundColor
      );

      await firstRoleColorLocator.click();
      await this.selector.buttons.saveChanges.click();
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
    const displayNameLocator = messageSelector.messages.locator(
      messageSelector.displayName.filter({ hasText: username }).first()
    );
    if (shouldVisible) {
      await expect(displayNameLocator).toHaveCSS('color', style);
    } else {
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

    const badge = channelLocator.locator('div[class*="absolute"][class*="ml-auto"]').last();

    if (shouldHasBadge) {
      await expect(channelLocator).toBeVisible({ timeout: 3000 });
      await expect(badge).toHaveText('1');
    } else {
      await expect(badge).toBeHidden({ timeout: 3000 });
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
    const badgeInBoxLocator = this.selector.header.badge.first();
    if (shouldHasBadge) {
      await expect(badgeInBoxLocator).toBeVisible({ timeout: 3000 });
    } else {
      await expect(badgeInBoxLocator).toBeHidden({ timeout: 3000 });
    }
  }

  async clickButtonMarkAsReadFromChannel(channelName: string) {
    const channelItem = this.selector.sidebar.channelItem.item.filter({ hasText: channelName });
    await channelItem.first().click({ button: 'right' });
    await this.selector.sidebar.panelItem.item.filter({ hasText: 'Mark as Read' }).click();
  }

  async verifyAdministratorPermissionRole(hasRole = true) {
    const intergrationsSidebar = this.selector.clanSettings.buttons.sidebarItem.filter({
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
      await expect(intergrationsSidebar).toBeVisible({ timeout: 3000 });
      await expect(auditLogSidebar).toBeVisible({ timeout: 3000 });
      await expect(onboardingSidebar).toBeVisible({ timeout: 3000 });
      await expect(enableCommunitySidebar).toBeVisible({ timeout: 3000 });
      await expect(overViewSidebar).toBeVisible({ timeout: 3000 });
      await expect(roleSidebar).toBeVisible({ timeout: 3000 });
      await expect(deleteSidebar).toBeHidden({ timeout: 3000 });
    } else {
      await expect(intergrationsSidebar).toBeHidden({ timeout: 3000 });
      await expect(auditLogSidebar).toBeHidden({ timeout: 3000 });
      await expect(onboardingSidebar).toBeHidden({ timeout: 3000 });
      await expect(enableCommunitySidebar).toBeHidden({ timeout: 3000 });
      await expect(overViewSidebar).toBeHidden({ timeout: 3000 });
      await expect(roleSidebar).toBeHidden({ timeout: 3000 });
      await expect(deleteSidebar).toBeHidden({ timeout: 3000 });
    }
  }

  async createRoleWithPermission(roleName: string, permission: string) {
    await this.selector.clanSettings.buttons.createRole.click();
    await this.selector.clanSettings.buttons.permissionsRole.click();

    await expect(this.selector.clanSettings.roleContainer).toBeVisible({ timeout: 3000 });

    const permissionItem = this.selector.clanSettings.rolePermissionsItem.filter({
      hasText: permission,
    });
    await expect(permissionItem).toBeVisible({ timeout: 3000 });
    const toggle = permissionItem.locator(this.selector.clanSettings.rolePermissionsSwitch);
    await toggle.click();

    await this.selector.clanSettings.buttons.displayRoleOption.click();
    await expect(this.selector.clanSettings.input.roleName).toBeVisible({ timeout: 3000 });

    await this.selector.clanSettings.input.roleName.fill(roleName);
    await this.selector.buttons.saveChanges.click();

    await this.selector.buttons.closeSettingClan.click();
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
    const generalChannel = this.selector.sidebar.channelItem.name.filter({ hasText: channelName });
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
    const userRow = this.selector.member.getSettingsRow(username);
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

  async cancelEvent() {
    await this.selector.createEventModal.button.openPanel.click();
    await this.selector.createEventModal.button.cancelEvent.click();
    const confirmButton = this.selector.createEventModal.button.confirmCancelEvent;
    await expect(confirmButton).toBeVisible({ timeout: 3000 });
    await confirmButton.click();
    await this.selector.createEventModal.button.closeContainerModal.click();
  }

  async clickCopyLinkFromShareButton() {
    await this.selector.createEventModal.button.shareEvent.click();
    await expect(this.selector.createEventModal.button.copyLink).toBeVisible({ timeout: 3000 });
    await this.selector.createEventModal.button.copyLink.click();
    await this.selector.createEventModal.button.closeModalCopyLink.click();
    await this.selector.createEventModal.button.closeContainerModal.click();
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
}
