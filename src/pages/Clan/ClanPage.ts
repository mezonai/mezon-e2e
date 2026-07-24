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

interface SelectorResult {
  found: boolean;
  element?: Locator;
}

export class ClanPage extends BasePage {
  private readonly selector: ClanSelector;
  constructor(page: Page) {
    super(page);
    this.selector = new ClanSelector(page);
  }

  async createNewClan(clanName: string): Promise<boolean> {
    try {
      await this.selector.input.clanName.fill(clanName);
      await this.page.waitForTimeout(2000);
      await this.selector.buttons.createClanConfirm.click();
      await this.page.waitForTimeout(5000);
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
    if (this.selector.buttons.createClan) {
      await this.selector.buttons.createClan.click();
      return true;
    }

    return false;
  }

  async clickCreateMyOwnClan(): Promise<boolean> {
    // if (this.selector.buttons.createMyOwnClan) {
    //   await this.selector.buttons.createMyOwnClan.click();
    //   return true;
    // }
    if (this.page.locator('button:has-text("Create My Own")')) {
      await this.page.locator('button:has-text("Create My Own")').first().click();
      return true;
    }
    return false;
  }

  async mapLocator(locator: Locator, callback: (element: Locator) => Promise<any>): Promise<any> {
    let count = 0;
    try {
      await locator.first().waitFor({ state: 'visible', timeout: 5000 });
      count = await locator.count();
    } catch {
      console.warn('No elements found for the provided locator.');
      return [];
    }
    const results = [];
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
      await this.page.waitForTimeout(1000);

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
    } catch (error) {
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

  async preventAnonymous() {
    const buttonSettings = this.selector.buttons.preventAnoSettings;
    await buttonSettings.click();
    await this.selector.buttons.saveChanges.click();
    await expect(this.selector.buttons.saveChanges).toBeHidden({ timeout: 5000 });
  }

  async createEvent(): Promise<void> {
    this.selector.buttons.eventButton.click();
    this.selector.eventModal.createEventButton.click();
    this.selector.eventModal.nextButton.click();
  }

  async openChannelSettings(channelName: string): Promise<void> {
    const channelLocator = this.selector.sidebar.channelItem.name.filter({ hasText: channelName });
    await channelLocator.click({ button: 'right' });
    await this.selector.sidebar.panelItem.item.filter({ hasText: 'Edit Channel' }).click();
    await this.page.waitForTimeout(500);
  }

  async openMemberListSetting(): Promise<void> {
    await expect(this.selector.buttons.memberListButton).toBeVisible({ timeout: 3000 });
    await this.selector.buttons.memberListButton.click();
    await this.page.waitForTimeout(500);
  }

  async openChannelsListSetting(): Promise<void> {
    await expect(this.selector.buttons.channelManagementButton).toBeVisible({ timeout: 3000 });
    await this.selector.buttons.channelManagementButton.click();
    await this.page.waitForTimeout(500);
  }

  async createNewChannel(
    typeChannel: ChannelType,
    channelName: string,
    status?: ChannelStatus
  ): Promise<boolean> {
    try {
      await this.selector.buttons.createChannel.last().click();

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

      return true;
    } catch (error) {
      console.error(`Error creating channel: ${error}`);
      return false;
    }
  }

  async isNewChannelPresent(channelName: string): Promise<boolean> {
    const channelLocator = this.page.locator(
      generateE2eSelector('clan_page.channel_list.item.name'),
      { hasText: channelName }
    );

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
      await this.page.waitForTimeout(500);

      await this.selector.clanSettings.category.input.categoryName.waitFor({
        state: 'visible',
        timeout: 5000,
      });
      await this.selector.clanSettings.category.input.categoryName.fill(newCategoryName);
      await this.selector.buttons.saveChanges.click();
      await this.selector.buttons.exitSettings.click();
      await this.page.waitForTimeout(500);
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
      await this.page.waitForTimeout(500);
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
    // await this.page.waitForLoadState('networkidle');
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
    await this.selector.header.button.member.nth(0).click();
    await this.page.waitForTimeout(500);
  }

  async getMemberFromMemberList(memberName: string): Promise<Locator> {
    const memberLocator = this.selector.sidebarMemberList.memberItems.filter({
      hasText: memberName,
    });
    await memberLocator.waitFor({ state: 'visible', timeout: 5000 });
    return memberLocator;
  }

  async getProfileFromMemberList(memberName: string): Promise<void> {
    const memberItem = await this.getMemberFromMemberList(memberName);
    await memberItem.click({ button: 'right' });
    await this.selector.sidebarMemberList.profileButton.click();
    await this.page.waitForTimeout(1000);
  }

  async clickAddFriendButtonFromModal() {
    const addFriendLocator = this.selector.sidebarMemberList.addFriendButton;
    await addFriendLocator.waitFor({ state: 'visible', timeout: 5000 });
    await addFriendLocator.click();
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
      await this.page.waitForTimeout(2000);

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
      console.log(startDate);
      console.log(startTime);

      await this.page.waitForTimeout(2000);

      const { formattedDate, formattedTime } = await this.formatDateTimeFromInputs(
        startDate,
        startTime
      );

      await this.selector.createEventModal.input.eventTopic.fill(eventTopic);
      await this.selector.createEventModal.input.description.fill(description);
      await this.page.waitForTimeout(2000);

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
      await expect(startDateTimeLocator).toHaveText(startDateTime);
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

  async countChannelsOnChannelList() {
    await this.page.waitForTimeout(3000);
    return await this.selector.sidebar.channelsList.count();
  }

  async getTotalChannels() {
    await this.selector.buttons.channelManagementButton.click();
    await this.selector.channelManagement.totalChannels.isVisible({ timeout: 5000 });
    await this.page.waitForTimeout(2000);
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
    await this.page.waitForTimeout(2000);
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

  async inviteUserToClanByUsername(username: string) {
    try {
      const messageSelector = new MessageSelector(this.page);
      const currentClanUrl = this.page.url();

      await this.selector.modalInvite.searchInput.fill(username);

      await expect(this.selector.modalInvite.userInvite).toBeVisible({ timeout: 3000 });
      await expect(this.selector.input.urlInvite).toHaveValue(/http/);

      const urlInvite = (await this.selector.input.urlInvite.inputValue()).trim();

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
    } catch (e) {
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

    /*
    Old flow: click invite URL, open invite page in a new tab, then accept invite.
    const [newPage] = await Promise.all([
      this.page.waitForEvent('popup'),
      messageWithUrl.getByText(url, { exact: false }).last().click(),
    ]);

    await newPage.waitForLoadState('domcontentloaded');

    const clanInviteModal = new ClanInviteModal(newPage);

    await expect(clanInviteModal.button.acceptInvite).toBeVisible({ timeout: 5000 });

    const [redirectedPage] = await Promise.all([
      newPage.waitForEvent('framenavigated'),
      clanInviteModal.button.acceptInvite.click(),
    ]);

    await redirectedPage.waitForLoadState('networkidle');
    */
  }

  async addRoleForUserByUsername(username: string, roleName: string) {
    await this.selector.buttons.memberListButton.click();
    const userRow = this.page.locator(
      `${generateE2eSelector('clan_page.member_list')}:has(${generateE2eSelector('clan_page.member_list.user_info.username')}:has-text("${username}"))`
    );
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
    await this.page.waitForTimeout(2000);

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

    const userRow = this.page.locator(
      `${generateE2eSelector('clan_page.member_list')}:has(${generateE2eSelector('clan_page.member_list.user_info.username')}:has-text("${username}"))`
    );
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

  async verifyUserHasRoleOnChannel(username: string, roleName: string, shouldVisible = true) {
    await this.selector.sidebar.channelsList.first().click();
    await expect(this.selector.header.button.member).toBeVisible({ timeout: 5000 });
    await this.selector.header.button.member.click();

    const memberRow = this.page.locator(
      `${generateE2eSelector('chat.channel_message.member_list.item')}:has-text("${username}"))`
    );
    await expect(memberRow).toBeVisible({ timeout: 3000 });

    await memberRow.click();

    const popup = this.page.locator('div.fixed.z-50');
    await expect(popup).toBeVisible({ timeout: 5000 });

    const roleLocator = popup.locator(
      `${generateE2eSelector('clan_page.channel_list.members.role.role_name')}:has-text("${roleName.slice(0, 6)}")`
    );

    if (shouldVisible) {
      await expect(roleLocator).toBeVisible({ timeout: 3000 });
    } else {
      await expect(roleLocator).not.toBeVisible({ timeout: 3000 });
    }

    await this.page.keyboard.press('Escape');
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
    await this.selector.sidebar.channelItem.name.filter({ hasText: channelName }).click();
    const joinButtonLocator = this.selector.screen.voiceRoom.joinButton;
    try {
      await joinButtonLocator.waitFor({ state: 'visible', timeout: 5000 });
      await joinButtonLocator.click();
      return true;
    } catch {
      return false;
    }
  }

  async isJoinVoiceChannel(channelName: string): Promise<boolean> {
    const userListLocator = this.selector.sidebar.channelItem.item
      .filter({ has: this.selector.sidebar.channelItem.name.filter({ hasText: channelName }) })
      .locator(this.selector.sidebar.channelItem.userList.item);

    const memberListLocator = this.selector.sidebarMemberList.memberItems;
    const memberInVoice = memberListLocator.filter({
      has: this.selector.secondarySideBar.member.inVoice,
    });
    const generalChannel = this.selector.sidebar.channelItem.name.filter({ hasText: 'general' });

    try {
      await userListLocator.waitFor({ state: 'visible', timeout: 5000 });
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
    await this.selector.sidebar.channelItem.name.filter({ hasText: channelName }).click();
    const leaveButtonLocator = this.selector.modal.voiceManagement.button.controlItem.last();
    try {
      await leaveButtonLocator.waitFor({ state: 'visible', timeout: 5000 });
      await leaveButtonLocator.click();
      await this.page.waitForTimeout(500);
      return true;
    } catch {
      return false;
    }
  }

  async isLeaveVoiceChannel(channelName: string): Promise<boolean> {
    await this.page.waitForTimeout(3000);
    const userListLocator = this.selector.sidebar.channelItem.item
      .filter({ has: this.selector.sidebar.channelItem.name.filter({ hasText: channelName }) })
      .locator(this.selector.sidebar.channelItem.userList.item);
    const generalChannel = this.selector.sidebar.channelItem.name.filter({ hasText: 'general' });
    const membersButton = this.selector.header.button.member.nth(0);
    const memberListLocator = this.selector.sidebarMemberList.memberItems;

    try {
      await this.selector.sidebar.channelItem.name.filter({ hasText: channelName }).click();
      await userListLocator.waitFor({ state: 'hidden', timeout: 5000 });
      await this.selector.modal.voiceManagement.item.waitFor({ state: 'hidden', timeout: 5000 });
      await generalChannel.click();
      await membersButton.click();
      const memberInVoice = memberListLocator.filter({
        has: this.selector.secondarySideBar.member.inVoice,
      });
      await memberInVoice.waitFor({ state: 'hidden', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
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
    const channelLocator = this.page.locator(
      generateE2eSelector('clan_page.channel_list.item.name'),
      { hasText: channelName }
    );
    await expect(channelLocator).toBeVisible({ timeout: 3000 });
    await channelLocator.click();
  }

  async isMessageInputDisabled() {
    const messageInput = this.selector.input.mention;
    try {
      await messageInput.waitFor({ state: 'visible', timeout: 5000 });
      return await messageInput.isDisabled();
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
    const channelLocator = this.page.locator(
      generateE2eSelector('clan_page.channel_list.item.name'),
      { hasText: channelName }
    );
    await channelLocator.click({ button: 'right' });
    await this.selector.sidebar.panelItem.item.filter({ hasText: 'Mark Favorite' }).click();
  }

  async verifyChannelIsMarkedAsFavorite(channelName: string) {
    const channelLocator = this.page.locator(
      generateE2eSelector('clan_page.channel_list.item.name'),
      { hasText: channelName }
    );
    const count = await channelLocator.count();
    await expect(count).toBe(2);
  }

  async unmarkChannelAsFavorite(channelName: string) {
    const channelLocator = this.page.locator(
      generateE2eSelector('clan_page.channel_list.item.name'),
      { hasText: channelName }
    );
    await channelLocator.first().click({ button: 'right' });
    await this.selector.sidebar.panelItem.item.filter({ hasText: 'Unmark Favorite' }).click();
  }

  async verifyChannelIsUnmarkedAsFavorite(channelName: string) {
    const channelLocator = this.page.locator(
      generateE2eSelector('clan_page.channel_list.item.name'),
      { hasText: channelName }
    );
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

    const code = lastMessageLocator.locator(generateE2eSelector('chat.system_message', '5'));
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
    return await this.page.locator(
      `[data-e2e="clan_page-side_bar-clan_item"][title="${clanName}"]`
    );
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
    await this.page.waitForTimeout(500);
  }

  async fillCanvasContent(content: string) {
    await this.selector.screen.canvasEditor.input.content.click();
    await this.page.keyboard.type(content);
    await this.page.waitForTimeout(1000);
  }

  async saveCanvas() {
    await this.selector.screen.canvasEditor.button.save.click();
    await expect(this.selector.screen.canvasEditor.button.save).toBeHidden({ timeout: 3000 });
  }

  async discardCanvas() {
    await this.selector.screen.canvasEditor.button.discardChanges.click();
    await expect(this.selector.screen.canvasEditor.button.discardChanges).toBeHidden({
      timeout: 3000,
    });
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
    return this.selector.secondarySideBar.member.item.filter({ hasText: username });
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
    const channelItem = this.selector.sidebar.channelItem.item.filter({
      has: this.selector.sidebar.channelItem.name.filter({ hasText: channelName }),
    });

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

  async verifyChannelHasBadge(channelName: string, shouldHasBadge = true) {
    const channelLocator = this.selector.sidebar.channelItem.item.filter({
      hasText: channelName,
    });

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
    const userRow = this.page.locator(
      `${generateE2eSelector('clan_page.member_list')}:has(${generateE2eSelector('clan_page.member_list.user_info.username')}:has-text("${username}"))`
    );
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
    await voiceChannelMessage.click();
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

      await this.page.waitForTimeout(2_000);

      return await this.isScreenSharing();
    } catch (error) {
      console.error('Failed to share screen:', error);
      return false;
    }
  }

  async isScreenSharing(): Promise<boolean> {
    try {
      const shareScreenButton = this.selector.screen.voiceRoom.shareScreenButton;
      await shareScreenButton.waitFor({ state: 'visible', timeout: 5000 });
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
