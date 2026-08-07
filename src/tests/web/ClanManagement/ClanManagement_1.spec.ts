import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, GLOBAL_CONFIG } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ROUTES } from '@/selectors';
import { MezonCredentials } from '@/types';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { expect, test } from '@playwright/test';

test.describe('Clan Management - Categories, Invitations, and Voice Events', () => {
  const clanFactory = new ClanFactory();
  const credentials: MezonCredentials = AccountCredentials.account4;
  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.configs.clanManagement2,
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      parrent_issue: '63510',
    });

    await TestSuiteHelper.setupBeforeEach({
      page,
      clanFactory,
      credentials,
    });
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({
      browser,
      clanFactory,
      credentials,
    });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test('Verify that I can create a public category', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a user can successfully create a new public category within a clan.
      
      **Test Steps:**
      1. Generate unique category name
      2. Create new public category
      3. Verify category appears in category list
      
      **Expected Result:** Public category is created and visible in the clan's category list.
    `);

    await AllureReporter.addLabels({
      tag: ['category-creation', 'public-category'],
    });

    const categoryPublicName = `category-public-${new Date().getTime()}`;
    const categoryPage = new ClanMenuPanel(page);

    await AllureReporter.addParameter('categoryName', categoryPublicName);
    await AllureReporter.addParameter('categoryType', 'public');

    await AllureReporter.step(`Create new public category: ${categoryPublicName}`, async () => {
      await categoryPage.createCategory(categoryPublicName);
    });

    await AllureReporter.step('Verify category is present in category list', async () => {
      const isCreatedCategory = await categoryPage.isCategoryPresent(categoryPublicName);
      expect(isCreatedCategory).toBeTruthy();
    });

    await AllureReporter.attachScreenshot(page, `Public Category Created - ${categoryPublicName}`);
  });

  test('Verify that the clan notification setting persists after reopening the modal', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that a clan notification setting is saved and remains selected after reopening the modal.

      **Test Steps:**
      1. Open the clan menu
      2. Open Notification Settings
      3. Select Nothing
      4. Close the modal
      5. Reopen Notification Settings
      6. Verify Nothing is still selected

      **Expected Result:** Nothing remains selected after the Notification Settings modal is reopened.
    `);

    await AllureReporter.addLabels({
      tag: ['clan-notification-setting', 'notification-persistence'],
    });

    const clanPage = new ClanPage(page);

    await AllureReporter.step('Open Notification Settings and select Nothing', async () => {
      await clanPage.openNotificationSettings();
      await clanPage.selectClanNotificationSetting('Nothing');
    });

    await AllureReporter.step('Close and reopen Notification Settings', async () => {
      await clanPage.closeNotificationSettings();
      await clanPage.openNotificationSettings();
    });

    await AllureReporter.step('Verify Nothing remains selected', async () => {
      await clanPage.verifyClanNotificationSettingSelected('Nothing');
    });
  });

  test('Verify notification override options and mute setting for a clan channel', async ({
    page,
  }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify notification override behavior for a clan channel.

      **Test Steps:**
      1. Open Notification Settings
      2. Add the general channel to Notification Overrides
      3. Verify the override has ALL, MENTIONS, NOTHING, and MUTE controls
      4. Select MENTIONS and verify ALL and NOTHING are not selected
      5. Enable MUTE and verify MENTIONS remains selected
      6. Close and reopen the modal
      7. Verify the MENTIONS and MUTE settings persist
      8. Remove the general channel override

      **Expected Result:** The first three options are mutually exclusive, MUTE can be selected independently, and the override settings persist after reopening the modal.
    `);

    await AllureReporter.addLabels({
      tag: ['clan-notification-override', 'notification-persistence'],
    });

    const clanPage = new ClanPage(page);

    await AllureReporter.step('Add general to Notification Overrides', async () => {
      await clanPage.openNotificationSettings();
      await clanPage.addNotificationOverride('general');
      await clanPage.verifyNotificationOverrideControls();
    });

    await AllureReporter.step(
      'Select MENTIONS and verify notification options are mutually exclusive',
      async () => {
        await clanPage.selectNotificationOverrideOption('MENTIONS');
      }
    );

    await AllureReporter.step('Enable MUTE independently from MENTIONS', async () => {
      await clanPage.setNotificationOverrideMute(true);
      await clanPage.verifyNotificationOverrideState('MENTIONS', true);
    });

    await AllureReporter.step('Close and reopen Notification Settings', async () => {
      await clanPage.closeNotificationSettings();
      await clanPage.openNotificationSettings();
    });

    await AllureReporter.step('Verify the override settings persist', async () => {
      await clanPage.verifyNotificationOverrideState('MENTIONS', true);
    });

    await AllureReporter.step('Remove the general notification override', async () => {
      await clanPage.removeNotificationOverride('general');
    });
  });

  test('Verify that I can invite people to a clan from sidebar', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63379',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can successfully invite people to a clan from sidebar.

    **Test Steps:**
    1. Open invite people dialog
    2. Pick first user on list
    3. Send invitation
    4. Verify invitation is sent

    **Expected Result:** Invitation is successfully sent to the user.
  `);

    await AllureReporter.addLabels({
      tag: ['invite-people', 'user-invitations'],
    });

    const clanPage = new ClanPage(page);

    await AllureReporter.step('Open invite people dialog', async () => {
      await clanPage.clickButtonInvitePeopleFromMenu();
    });

    const inviteResult = await AllureReporter.step('Send invitation via modal', async () => {
      return await clanPage.sendInviteOnModal();
    });

    expect(inviteResult.success).toBeTruthy();

    await AllureReporter.step('Navigate to direct friends page', async () => {
      await page.goto(joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS));
    });

    await AllureReporter.step(`Open DM with invited user`, async () => {
      await clanPage.openDirectMessageWithUser(inviteResult.username!);
    });

    await AllureReporter.step('Verify last message in DM equals urlInvite', async () => {
      const messageHelper = new MessageTestHelpers(page);
      const lastMessage = await messageHelper.getLastMessageInChat();
      const isMatch = lastMessage.includes(inviteResult.urlInvite ?? '');
      expect(isMatch).toBeTruthy();
      return isMatch;
    });

    await AllureReporter.attachScreenshot(page, 'Invite People Sent');
  });

  test('Verify that I can invite people to a clan from channel', async ({ page }) => {
    await AllureReporter.addWorkItemLinks({
      tms: '63380',
    });
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });
    await AllureReporter.addDescription(`
    **Test Objective:** Verify that a user can successfully invite people to a clan from a channel.
    **Test Steps:**
    1. create a channel in clan
    2. Open invite people dialog from channel
    3. Pick first user on list
    4. Send invitation
    5. Verify invitation is sent
    **Expected Result:** Invitation is successfully sent to the user.
  `);
    await AllureReporter.addLabels({
      tag: ['invite-people', 'user-invitations'],
    });

    const unique = Date.now().toString(36).slice(-6);
    const channelName = `tc-${unique}`.slice(0, 20);
    const clanPage = new ClanPage(page);

    await AllureReporter.addParameter('channelName', channelName);
    await AllureReporter.addParameter('channelType', ChannelType.TEXT);
    await AllureReporter.addParameter('channelStatus', ChannelStatus.PUBLIC);

    await AllureReporter.step(`Create new public text channel: ${channelName}`, async () => {
      await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PUBLIC);
    });

    await AllureReporter.step('Verify channel is present in channel list', async () => {
      const isNewChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isNewChannelPresent).toBe(true);
    });

    await AllureReporter.step('Open invite people dialog from channel', async () => {
      await clanPage.clickButtonInvitePeopleFromChannel();
    });
    const inviteResult = await AllureReporter.step('Send invitation via modal', async () => {
      return await clanPage.sendInviteOnModal();
    });
    expect(inviteResult.success).toBeTruthy();
    await AllureReporter.step('Navigate to direct friends page', async () => {
      await page.goto(joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS));
    });
    await AllureReporter.step(`Open DM with invited user`, async () => {
      await clanPage.openDirectMessageWithUser(inviteResult.username!);
    });
    await AllureReporter.step('Verify last message in DM equals urlInvite', async () => {
      const messageHelper = new MessageTestHelpers(page);
      const lastMessage = await messageHelper.getLastMessageInChat();
      const isMatch = lastMessage.includes(inviteResult.urlInvite ?? '');
      expect(isMatch).toBeTruthy();
      return isMatch;
    });
  });
});
