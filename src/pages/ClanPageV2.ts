import ClanSelector from '@/data/selectors/ClanSelector';
import { CategorySettingPage } from '@/pages/CategorySettingPage';
import { ChannelStatus, ChannelType, ClanStatus, ThreadStatus } from '@/types/clan-page.types';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import { expect, Locator, Page } from '@playwright/test';
import { EventType } from './../types/clan-page.types';
import { DirectMessageHelper } from './../utils/directMessageHelper';
import { CategoryPage } from './CategoryPage';

interface SelectorResult {
  found: boolean;
  element?: Locator;
}

export class ClanPageV2 extends ClanSelector {
  constructor(page: Page) {
    super(page);
  }

  async createNewClan(clanName: string): Promise<boolean> {
    try {
      await this.input.clanName.fill(clanName);
      await this.page.waitForTimeout(2000);
      await this.buttons.createClanConfirm.click();
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
    if (this.buttons.createClan) {
      await this.buttons.createClan.click();
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
    const clanElements = this.sidebar.clanItem;
    const clanTitles = await this.mapLocator(clanElements, async element => {
      return element.getAttribute('title');
    });
    for (const clanName of clanTitles) {
      if (onlyDeleteExpired && clanName && !this.shouldDeleteClan(clanName)) {
        continue;
      }
      await this.deleteClan(clanName || '');
      await this.page.goto(joinUrlPaths(this.page.url(), '/chat/direct/friends'));
      await this.page.waitForLoadState('domcontentloaded');
    }
    return true;
  }

  async deleteClan(clanName: string): Promise<boolean> {
    try {
      const categoryPage = new CategoryPage(this.page);
      const categorySettingPage = new CategorySettingPage(this.page);

      const clanLocator = await this.findClanByTitle(clanName);

      await clanLocator.click();
      await this.page.waitForTimeout(1000);

      await categoryPage.text.clanName.click();
      await categoryPage.buttons.clanSettings.click();
      try {
        await categorySettingPage.buttons.deleteSidebar.waitFor({
          state: 'visible',
          timeout: 3000,
        });
      } catch {
        console.error(`You are not the owner of the clan "${clanName}".`);
        return false;
      }
      await categorySettingPage.buttons.deleteSidebar.click();
      await categorySettingPage.input.delete.fill(clanName || '');
      await categorySettingPage.buttons.confirmDelete.click();
      await this.page.waitForLoadState('domcontentloaded');
      if (await this.permissionModal.isVisible()) {
        await this.permissionModal.cancel.click();
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
      const categoryPage = new CategoryPage(this.page);

      await categoryPage.text.clanName.click();
      await categoryPage.buttons.clanSettings.click();
      return true;
    } catch (error) {
      console.error(`Error deleting clan: ${error}`);
      return false;
    }
  }

  async createEvent(): Promise<void> {
    this.buttons.eventButton.click();
    this.eventModal.createEventButton.click();
    this.eventModal.nextButton.click();
  }

  async openChannelSettings(channelName: string): Promise<void> {
    const channelLocator = this.sidebar.channelItem.name.filter({ hasText: channelName });
    await channelLocator.click({ button: 'right' });
    await this.sidebar.panelItem.item.filter({ hasText: 'Edit Channel' }).click();
    await this.page.waitForTimeout(500);
  }

  async openMemberListSetting(): Promise<void> {
    await this.buttons.memberListButton.click();
    await this.page.waitForTimeout(500);
  }

  async createNewChannel(
    typeChannel: ChannelType,
    channelName: string,
    status?: ChannelStatus
  ): Promise<boolean> {
    try {
      await this.buttons.createChannel.click();

      switch (typeChannel) {
        case ChannelType.TEXT:
          await this.createChannelModal.type.text.click();
          break;
        case ChannelType.VOICE:
          await this.createChannelModal.type.voice.click();
          break;
        case ChannelType.STREAM:
          await this.createChannelModal.type.stream.click();
          break;
      }
      await this.createChannelModal.input.channelName.fill(channelName);
      if (status === ChannelStatus.PRIVATE && typeChannel === ChannelType.TEXT) {
        await this.createChannelModal.toggle.isPrivate.click();
      }
      await this.createChannelModal.button.confirm.click();

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

  async createThread(threadName: string, status?: ThreadStatus): Promise<void> {
    await this.header.button.thread.click();
    await this.header.button.createThread.click();
    await this.threadBox.threadNameInput.fill(threadName);
    if (status === ThreadStatus.PRIVATE) {
      await this.threadBox.threadPrivateCheckbox.click();
    }
    await this.threadBox.threadInputMention.fill(threadName);
    await this.threadBox.threadInputMention.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async openMemberList(): Promise<void> {
    await this.header.button.member.nth(0).click();
    await this.page.waitForTimeout(500);
  }

  async getMemberFromMemberList(memberName: string): Promise<Locator> {
    const memberLocator = this.sidebarMemberList.memberItems.filter({ hasText: memberName });
    await memberLocator.waitFor({ state: 'visible', timeout: 5000 });
    return memberLocator;
  }

  async getProfileFromMemberList(memberName: string): Promise<void> {
    const memberItem = await this.getMemberFromMemberList(memberName);
    await memberItem.click({ button: 'right' });
    await this.sidebarMemberList.profileButton.click();
    await this.page.waitForTimeout(1000);
  }

  async isNewThreadPresent(threadName: string): Promise<boolean> {
    const threadLocator = this.sidebar.threadItem.name.filter({
      hasText: threadName,
    });

    try {
      await threadLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async getAllClan(): Promise<number> {
    const clanElements = this.sidebar.clanItem;
    return await clanElements.count();
  }

  async isLimitCreationModalPresent(): Promise<boolean> {
    const limitCreationModalLocator = this.modal.limitCreation.title;
    try {
      await limitCreationModalLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async clickButtonInvitePeopleFromMenu(): Promise<boolean> {
    try {
      await this.buttons.clanName.click();
      await this.buttons.invitePeopleFromHeaderMenu.click();
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
      await expect(this.modalInvite.userInvite.first()).toBeVisible();

      const userInviteItem = this.modalInvite.userInvite.first();
      const usernameElement = userInviteItem.locator('p');
      await expect(usernameElement).toBeVisible();

      const username = (await usernameElement.innerText()).trim();

      await expect(this.input.urlInvite).toHaveValue(/http/);
      const urlInvite = (await this.input.urlInvite.inputValue()).trim();

      if (!username || !urlInvite) {
        throw new Error('Missing invite info or URL');
      }

      await this.buttons.invitePeople.first().click();

      await this.buttons.closeInviteModal.click();

      await this.modalInvite.container.waitFor({ state: 'hidden', timeout: 5000 });

      return { success: true, username, urlInvite };
    } catch (error) {
      console.error('Error sending invite:', error);
      return { success: false };
    }
  }

  async openDirectMessageWithUser(username: string): Promise<void> {
    const directMessageHelpers = new DirectMessageHelper(this.page);

    await expect(
      directMessageHelpers.userNamesInDM.getByText(username, { exact: true })
    ).toBeVisible();

    await directMessageHelpers.userNamesInDM.getByText(username, { exact: true }).click();
  }

  async getLastMessageInChat(): Promise<string> {
    const messageHelpers = new MessageTestHelpers(this.page);
    const lastMessage = await messageHelpers.messages.last();

    await expect(lastMessage).toBeVisible();

    return (await lastMessage.innerText()).trim();
  }

  async editChannelName(channelName: string, newChannelName: string): Promise<void> {
    await this.openChannelSettings(channelName);
    const input = this.page.locator(
      `${generateE2eSelector('clan_page.channel_list.settings.overview')} input[value="${channelName}"]`
    );

    await input.fill(newChannelName);
    await this.buttons.saveChanges.click();
    await this.buttons.exitSettings.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickButtonInvitePeopleFromChannel(): Promise<boolean> {
    try {
      await this.buttons.invitePeopleFromChannel.click();
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
      await this.buttons.eventButton.click();
      await this.createEventModal.modalStart.waitFor({ state: 'visible', timeout: 5000 });

      await this.eventModal.createEventButton.click();

      switch (eventType) {
        case EventType.LOCATION:
          await this.createEventModal.type.location.click();
          break;
        case EventType.VOICE:
          await this.createEventModal.type.voice.click();
          break;
        case EventType.PRIVATE:
          await this.createEventModal.type.private.click();
          break;
      }
      if (voiceChannelName) {
        if (eventType === EventType.VOICE) {
          await this.createEventModal.selectChannel.first().click();
          const channelItem = this.createEventModal.channelItem.filter({
            hasText: voiceChannelName,
          });
          await channelItem.click();
        } else if (eventType === EventType.LOCATION) {
          await this.createEventModal.input.locationName.fill(voiceChannelName);
        }
      }

      if (status === ClanStatus.PRIVATE) {
        await this.createEventModal.selectChannel.last().click({ force: true });
        const channelItem = this.createEventModal.channelItem.filter({ hasText: textChannelName });
        await channelItem.click();
      }

      await this.eventModal.nextButton.click();

      return true;
    } catch (error) {
      console.error(`Error creating channel: ${error}`);
      return false;
    }
  }

  async sendFirstMessage(message: string): Promise<boolean> {
    try {
      await this.input.mention.fill(message);
      await this.input.mention.press('Enter');
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
    const [day, month, year] = startDate.split('/');
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
      const startDate = await this.createEventModal.input.startDateInput.inputValue();
      const startTime = await this.createEventModal.input.startTime.inputValue();

      const { formattedDate, formattedTime } = await this.formatDateTimeFromInputs(
        startDate,
        startTime
      );
      await this.createEventModal.input.eventTopic.fill(eventTopic);
      await this.createEventModal.input.description.fill(description);

      await this.eventModal.nextButton.click();

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

      const eventTopicLocator = this.createEventModal.eventTopicReview;
      await expect(eventTopicLocator).toHaveText(eventTopic);

      if (description) {
        const descriptionLocator = this.createEventModal.descriptionReview;
        await expect(descriptionLocator).toHaveText(description);
      }

      const startDateTime = `${startDate} - ${startTime}`;
      const startDateTimeLocator = this.createEventModal.startTimeReview;
      await expect(startDateTimeLocator).toHaveText(startDateTime);
      const typeClanLocator = this.createEventModal.typeClanReview;
      if (data.eventType === EventType.VOICE || data.eventType === EventType.LOCATION) {
        if (data.clanStatus === ClanStatus.PUBLIC) {
          await expect(typeClanLocator).toHaveText('Clan Event');
        } else if (data.clanStatus === ClanStatus.PRIVATE) {
          await expect(typeClanLocator).toHaveText('Channel Event');
        }
      } else if (data.eventType === EventType.PRIVATE) {
        await expect(typeClanLocator).toHaveText('Private Event');
      }

      if (voiceChannelName) {
        if (data.eventType === EventType.VOICE) {
          const voiceChannelLocator = this.createEventModal.voiceChannelReview;
          await expect(voiceChannelLocator).toHaveText(voiceChannelName);
        } else if (data.eventType === EventType.LOCATION) {
          const locationNameLocator = this.createEventModal.locationNameReview;
          await expect(locationNameLocator).toHaveText(voiceChannelName);
        }
      }

      if (data.clanStatus === ClanStatus.PRIVATE && textChannelName) {
        const textChannelLocator = this.createEventModal.textChannelReview;
        await expect(textChannelLocator).toHaveText(textChannelName);
      }
      return true;
    } catch (error) {
      console.error(`Error verifying data on review tab: ${error}`);
      return false;
    }
  }

  async waitForModalToBeHidden(): Promise<void> {
    await this.createEventModal.modal.waitFor({ state: 'hidden', timeout: 5000 });
  }

  async getLastEventData(eventType: EventType) {
    await this.buttons.eventButton.click();
    await this.createEventModal.modalStart.waitFor({ state: 'visible', timeout: 5000 });

    const lastEvent = this.createEventModal.eventManagementItem.last();
    await lastEvent.waitFor({ state: 'visible', timeout: 5000 });

    const startTime = await lastEvent.locator(this.createEventModal.startTimeReview).textContent();
    const type = await lastEvent.locator(this.createEventModal.typeClanReview).textContent();
    const topic = await lastEvent.locator(this.createEventModal.eventTopicReview).textContent();
    const description = await lastEvent
      .locator(this.createEventModal.descriptionReview)
      .textContent();
    const voiceChannel =
      eventType === EventType.VOICE
        ? ((
            await lastEvent
              .locator(this.createEventModal.voiceChannelReview)
              .textContent()
              .catch(() => null)
          )?.trim() ?? '')
        : eventType === EventType.LOCATION
          ? ((
              await lastEvent
                .locator(this.createEventModal.locationNameReview)
                .textContent()
                .catch(() => null)
            )?.trim() ?? '')
          : '';

    const textChannelLocator = lastEvent.locator(this.createEventModal.textChannelReview);
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
      await expect(lastEvent.startTime).toBe(expected.startTime);
    }

    const typeClanLocator = lastEvent.type;
    if (expected.eventType === EventType.VOICE || expected.eventType === EventType.LOCATION) {
      if (expected.clanStatus === ClanStatus.PUBLIC) {
        await expect(typeClanLocator).toBe('Clan Event');
      } else if (expected.clanStatus === ClanStatus.PRIVATE) {
        await expect(typeClanLocator).toBe('Channel Event');
      }
    } else if (expected.eventType === EventType.PRIVATE) {
      await expect(typeClanLocator).toBe('Private Event');
    }

    return true;
  }
  async verifyInEventDetailModal(expected: {
    eventTopic: string;
    description?: string;
    channelName?: string;
    startTime: string;
  }): Promise<boolean> {
    await this.createEventModal.openEventDetailModalButton.last().click();
    await this.eventDetailModal.modal.waitFor({ state: 'visible', timeout: 5000 });

    const topic = this.eventDetailModal.topic;
    await expect(topic).toHaveText(expected.eventTopic);

    if (expected.description) {
      const description = this.eventDetailModal.description;
      await expect(description).toHaveText(expected.description);
    }

    if (expected.channelName) {
      const channelName = this.eventDetailModal.channelName;
      await expect(channelName).toHaveText(expected.channelName);
    }

    const startDateTime = this.eventDetailModal.startDateTime;
    await expect(startDateTime).toHaveText(expected.startTime);
    return true;
  }

  async closeEventModal() {
    await this.createEventModal.button.closeDetailModal.click();
    await this.createEventModal.button.closeContainerModal.click();
  }

  async countChannelsOnChannelList() {
    return await this.sidebar.channelsList.count();
  }

  async getTotalChannels() {
    await this.buttons.channelManagementButton.click();
    await this.channelManagement.totalChannels.isVisible({ timeout: 5000 });
    await this.page.waitForTimeout(2000);
    const text = await this.channelManagement.totalChannels.innerText();
    const countChannelItems = await this.channelManagement.channelItem.count();

    const match = text.match(/channel of\s+(\d+)/i);
    return { totalChannels: match ? Number(match[1]) : null, countChannelItems };
  }
}
