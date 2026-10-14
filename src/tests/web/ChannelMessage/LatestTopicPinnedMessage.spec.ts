import { AccountCredentials, MEZON_DEV } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { ClanSettingsPage } from '@/pages/ClanSettingsPage';
import { MessagePage } from '@/pages/MessagePage';
import { ChannelType } from '@/types/clan-page.types';
import { AllureConfig } from '@/config/allure.config';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { MessageTestHelpers } from '@/utils/messageHelpers';
import TestSuiteHelper from '@/utils/testSuite.helper';
import { FileSizeTestHelpers, UploadType } from '@/utils/uploadFileHelpers';
import test, { expect, Locator, Page } from '@playwright/test';
import path from 'path';

const FEATURE_TAGS = ['channel-message', 'latest-topic', 'latest-pinned-message'];

type TestContext = {
  clanPage: ClanPage;
  messagePage: MessagePage;
  messageHelper: MessageTestHelpers;
  channelName: string;
};

async function addCaseMetadata(description: string, tags: string[] = []): Promise<void> {
  await AllureReporter.addTestParameters({
    testType: AllureConfig.TestTypes.E2E,
    userType: AllureConfig.UserTypes.AUTHENTICATED,
    severity: AllureConfig.Severity.CRITICAL,
  });
  await AllureReporter.addDescription(description);
  await AllureReporter.addLabels({ tag: [...FEATURE_TAGS, ...tags] });
}

test.describe('Channel Messages - Latest Topic and Latest Pinned Message', () => {
  const credentials = AccountCredentials.account9;
  const clanFactory = new ClanFactory();

  test.beforeAll(async ({ browser }) => {
    await TestSuiteHelper.setupBeforeAll({
      browser,
      clanFactory,
      configs: ClanSetupHelper.createConfig({
        clanNamePrefix: 'LatestTopicPin',
        suiteName: 'Latest Topic and Latest Pinned Message',
      }),
      credentials,
    });
  });

  test.beforeEach(async ({ page }) => {
    await AllureReporter.addWorkItemLinks({ parrent_issue: '63366' });
    await TestSuiteHelper.setupBeforeEach({ page, clanFactory, credentials });
  });

  test.afterEach(async ({ page }) => {
    await AuthHelper.logout(page);
  });

  test.afterAll(async ({ browser }) => {
    await TestSuiteHelper.onAfterAll({ browser, clanFactory, credentials });
  });

  async function createIsolatedTextChannel(page: Page, prefix: string): Promise<TestContext> {
    const clanPage = new ClanPage(page);
    const messagePage = new MessagePage(page);
    const messageHelper = new MessageTestHelpers(page);
    const channelName = `${prefix}-${Date.now().toString(36)}`.slice(0, 20);

    expect(await clanPage.createNewChannel(ChannelType.TEXT, channelName)).toBe(true);
    await clanPage.verifyChannelVisibility(channelName, true);
    return { clanPage, messagePage, messageHelper, channelName };
  }

  async function createTopicFromText(
    messageHelper: MessageTestHelpers,
    message: string,
    topicReply: string
  ): Promise<void> {
    const messageItem = await messageHelper.sendTextMessageAndGetItem(message);
    await messageHelper.createTopicFromMessageItem(messageItem, topicReply);
  }

  async function uploadAndSendAttachment(
    page: Page,
    messageHelper: MessageTestHelpers,
    fileHelper: FileSizeTestHelpers,
    extension: string
  ): Promise<{ fileName: string; messageItem: Locator }> {
    const baseName = `latest-header-${extension}-${Date.now().toString(36)}`;
    const filePath = await fileHelper.createFileWithSize(baseName, 8 * 1024, extension);
    const fileName = path.basename(filePath);
    const messages = messageHelper.getMessageItemLocator();
    const messageCount = await messages.count();

    await fileHelper.uploadFileDefault(filePath);
    await expect(page.locator('[data-e2e="mention-selected_file"]')).toBeVisible({
      timeout: 10000,
    });
    const messageInput = await messageHelper.findMessageInput();
    await messageInput.press('Enter');
    await expect.poll(() => messages.count()).toBeGreaterThan(messageCount);
    const messageItem = messages.last();
    await expect(messageItem).toBeVisible({ timeout: 20000 });
    return { fileName, messageItem };
  }

  test('The header displays and opens the newest topic', async ({ page }) => {
    await addCaseMetadata(
      `
      **Test Objective:** Verify the header selects the latest topic when multiple topics exist.

      **Expected Result:** Only the newest topic is summarized and clicking it opens the matching topic.
      `,
      ['text', 'latest-order', 'open-topic']
    );
    const { messagePage, messageHelper } = await createIsolatedTextChannel(page, 'latest-topic');
    const unique = Date.now().toString(36);
    const firstMessage = `Older topic ${unique}`;
    const secondMessage = `Newest topic ${unique}`;
    const firstReply = `Older topic reply ${unique}`;
    const secondReply = `Newest topic reply ${unique}`;

    await createTopicFromText(messageHelper, firstMessage, firstReply);
    await createTopicFromText(messageHelper, secondMessage, secondReply);

    await messagePage.verifyLatestTopicInHeader(secondMessage, firstMessage);
    await messagePage.openLatestTopicFromHeader();
    await expect(messageHelper.getTopicMessageItemByText(secondReply)).toBeVisible({
      timeout: 10000,
    });
  });

  test('The header displays the newest pin and Remove from header only dismisses the banner', async ({
    page,
  }) => {
    await addCaseMetadata(
      `
      **Test Objective:** Verify newest-pin selection, jump navigation, and Remove from header.

      **Expected Result:** The newest pin is displayed and remains pinned after the header is dismissed.
      `,
      ['text', 'latest-order', 'remove-from-header']
    );
    const { messagePage, messageHelper } = await createIsolatedTextChannel(page, 'latest-pin');
    const unique = Date.now().toString(36);
    const firstMessage = `Older pinned message ${unique}`;
    const secondMessage = `Newest pinned message ${unique}`;

    const firstItem = await messageHelper.sendTextMessageAndGetItem(firstMessage);
    await messagePage.pinSpecificMessage(firstItem);
    const secondItem = await messageHelper.sendTextMessageAndGetItem(secondMessage);
    await messagePage.pinSpecificMessage(secondItem);

    await messagePage.verifyLatestPinnedMessageInHeader(secondMessage, firstMessage);
    await messagePage.openLatestPinnedMessageFromHeader();
    await messageHelper.verifyMessageIsHighlighted(secondMessage);
    await messagePage.dismissTopicPinBanner();
    await messagePage.verifyTopicPinBannerHidden();
    expect(await messagePage.isMessageStillPinned(secondMessage)).toBe(true);
  });

  test('Anonymous content is supported by both Latest Topic and Latest Pinned Message', async ({
    page,
  }) => {
    await addCaseMetadata(
      `
      **Test Objective:** Verify anonymous source messages are represented in both header sections.

      **Expected Result:** The topic and pin remain accessible and the pinned sender is Anonymous.
      `,
      ['anonymous']
    );
    const { messagePage, messageHelper } = await createIsolatedTextChannel(page, 'anon-header');
    const message = `Anonymous latest content ${Date.now().toString(36)}`;

    await messagePage.openAnonymous();
    await messagePage.sendMessageWithAnonymous(message);
    const anonymousItem = messageHelper.getMessageItemLocator(message).last();
    await expect(anonymousItem).toBeVisible({ timeout: 10000 });
    await messageHelper.createTopicFromMessageItem(
      anonymousItem,
      `Anonymous topic reply ${Date.now().toString(36)}`
    );
    const reloadedAnonymousItem = messageHelper.getMessageItemLocator(message).last();
    await messagePage.pinSpecificMessage(reloadedAnonymousItem);

    await messagePage.verifyLatestTopicInHeader(message);
    await messagePage.verifyLatestPinnedMessageInHeader(message);
    await expect(page.getByText('Anonymous', { exact: true }).last()).toBeVisible();
  });

  test('Emoji content is supported by both header sections', async ({ page }) => {
    await addCaseMetadata(
      `
      **Test Objective:** Verify an emoji message can be the source of a topic and a pin.

      **Expected Result:** Both header sections display the emoji content.
      `,
      ['emoji']
    );
    const { messagePage, messageHelper } = await createIsolatedTextChannel(page, 'emoji-header');
    const emojiMessage = `😀 🎉 ${Date.now().toString(36)}`;
    const emojiItem = await messageHelper.sendTextMessageAndGetItem(emojiMessage);
    await messageHelper.createTopicFromMessageItem(
      emojiItem,
      `Emoji topic reply ${Date.now().toString(36)}`
    );
    await messagePage.pinSpecificMessage(messageHelper.getMessageItemLocator(emojiMessage).last());

    await messagePage.verifyLatestTopicInHeader(emojiMessage);
    await messagePage.verifyLatestPinnedMessageInHeader(emojiMessage);
  });

  test('Sticker content is supported by both header sections', async ({ browser, page }) => {
    await addCaseMetadata(
      `
      **Test Objective:** Verify a sticker message can be the source of a topic and a pin.

      **Expected Result:** Creating the topic and pin keeps both header sections available.
      `,
      ['sticker']
    );
    const { channelName, clanPage, messagePage, messageHelper } = await createIsolatedTextChannel(
      page,
      'sticker-header'
    );
    const stickerName = `HeaderSticker${Date.now().toString(36).slice(-6)}`;
    const uploadContext = await browser.newContext();
    const uploadPage = await uploadContext.newPage();
    const fileHelper = new FileSizeTestHelpers(uploadPage);

    try {
      const auth = await AuthHelper.setupAuthWithEmailPassword(uploadPage, credentials);
      const clanPath = new URL(clanFactory.getClanUrl()).pathname;
      const devClanUrl = new URL(clanPath, `${MEZON_DEV}/`).toString();
      await AuthHelper.prepareBeforeTest(uploadPage, devClanUrl, auth);

      const uploadClanPage = new ClanPage(uploadPage);
      const clanSettingsPage = new ClanSettingsPage(uploadPage);
      const stickerPath = await fileHelper.createFileWithSize(
        `latest-header-sticker-${Date.now().toString(36)}`,
        100 * 1024,
        'png'
      );
      await uploadClanPage.openClanSettings();
      await clanSettingsPage.clickSettingClanSection('Image Stickers');
      await clanSettingsPage.clickUploadImageSticker();
      const uploadResult = await fileHelper.uploadByTypeAndVerify(
        stickerPath,
        UploadType.STICKER,
        true
      );
      expect(uploadResult.success).toBe(true);
      await clanSettingsPage.nameAndSaveImageSticker(stickerName);
    } finally {
      await fileHelper.cleanupFiles();
      await uploadContext.close();
    }

    await page.reload({ waitUntil: 'domcontentloaded' });
    const messageCount = await messageHelper.getMessageItemLocator().count();

    await clanPage.sendCustomImageStickerMessage(stickerName, channelName);
    await expect
      .poll(() => messageHelper.getMessageItemLocator().count())
      .toBeGreaterThan(messageCount);

    const stickerItem = messageHelper.getMessageItemLocator().last();
    await messageHelper.createTopicFromMessageItem(
      stickerItem,
      `Sticker topic reply ${Date.now().toString(36)}`,
      false
    );
    await messagePage.pinSpecificMessage(stickerItem);

    await messagePage.verifyLatestTopicInHeader();
    await messagePage.verifyLatestPinnedMessageInHeader();
  });

  const attachmentCases = [
    { label: 'image', extension: 'png' },
    { label: 'video', extension: 'mp4' },
    { label: 'sound/audio', extension: 'wav' },
    { label: 'file', extension: 'txt' },
  ];

  for (const attachmentCase of attachmentCases) {
    test(`${attachmentCase.label} content is supported by both header sections`, async ({
      page,
    }) => {
      await addCaseMetadata(
        `
        **Test Objective:** Verify ${attachmentCase.label} content can be the source of a topic and a pin.

        **Expected Result:** Latest Topic is available and Latest Pinned Message previews the attachment.
        `,
        ['attachment', attachmentCase.label]
      );
      const { messagePage, messageHelper } = await createIsolatedTextChannel(
        page,
        `${attachmentCase.extension}-header`
      );
      const fileHelper = new FileSizeTestHelpers(page);

      try {
        const { fileName, messageItem } = await uploadAndSendAttachment(
          page,
          messageHelper,
          fileHelper,
          attachmentCase.extension
        );
        await messageHelper.createTopicFromMessageItem(
          messageItem,
          `${attachmentCase.label} topic reply ${Date.now().toString(36)}`
        );
        await messagePage.pinSpecificMessage(messageItem);

        await messagePage.verifyLatestTopicInHeader();
        await messagePage.verifyLatestPinnedAttachmentInHeader(fileName);
      } finally {
        await fileHelper.cleanupFiles();
      }
    });
  }
});
