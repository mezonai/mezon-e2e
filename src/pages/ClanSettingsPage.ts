import { type Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { joinUrlPaths } from '../utils/joinUrlPaths';
import { WEBSITE_CONFIGS } from '../config/environment';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { isWebhookJustCreated } from '@/utils/clanSettingsHelper';
import { ClanMenuPanel } from './Clan/ClanMenuPanel';
import ClanSelector from '@/data/selectors/ClanSelector';

export class ClanSettingsPage extends BasePage {
  readonly buttons = {
    sidebarItem: this.page.locator(generateE2eSelector('clan_page.settings.sidebar.item')),
    uploadEmoji: this.page.locator(generateE2eSelector('clan_page.settings.emoji.upload')),
    uploadVoiceSticker: this.page.locator(
      generateE2eSelector('clan_page.settings.voice_sticker.button_upload')
    ),
    enableOnboarding: this.page.locator(
      generateE2eSelector('clan_page.settings.onboarding.button.enable_onboarding')
    ),
    editClanGuide: this.page.locator(
      generateE2eSelector('clan_page.settings.onboarding.button.clan_guide')
    ),
    addResource: this.page.locator(
      generateE2eSelector('clan_page.settings.onboarding.button.add_resources')
    ),
    enableCommunity: this.page.locator(
      generateE2eSelector('clan_page.settings.community.button.enable_community')
    ),
  };

  readonly integrations = {
    createWebhook: this.page.locator(
      generateE2eSelector('clan_page.settings.integrations.create_clan_webhook_button')
    ),
    newWebhook: this.page.locator(
      generateE2eSelector('clan_page.settings.integrations.new_clan_webhook_button')
    ),
    webhookItem: {
      item: this.page.locator(generateE2eSelector('clan_page.settings.integrations.webhook_item')),
      title: this.page.locator(
        generateE2eSelector('clan_page.settings.integrations.webhook_item.webhook_title')
      ),
      description: this.page.locator(
        generateE2eSelector('clan_page.settings.integrations.webhook_item.webhook_description')
      ),
    },
  };

  private readonly clanMenuSelectors = [
    '[data-testid="clan-menu"]',
    'button:has-text("Clan")',
    'a:has-text("Clan")',
    '[aria-label*="clan" i]',
    '.clan-menu',
    '#clan-menu',
  ];

  private readonly settingsSelectors = [
    '[data-testid="clan-settings"]',
    'button:has-text("Settings")',
    'a:has-text("Settings")',
    '[aria-label*="settings" i]',
    '.settings-menu',
    'svg[data-icon="cog"]',
    'svg[data-icon="gear"]',
    '.fa-cog',
    '.fa-gear',
  ];

  private readonly stickerSectionSelectors = [
    '[data-testid="image-stickers"]',
    'button:has-text("Image Stickers")',
    'a:has-text("Image Stickers")',
    'div:has-text("Image Stickers")',
    '[aria-label*="sticker" i]',
  ];

  private readonly emojiSectionSelectors = [
    '[data-testid="emoji-section"]',
    'button:has-text("Emoji")',
    'a:has-text("Emoji")',
    'div:has-text("Emoji")',
    '[aria-label*="emoji" i]',
  ];

  private readonly voiceStickerSectionSelectors = [
    '[data-testid="voice-stickers"]',
    'button:has-text("Voice Stickers")',
    'a:has-text("Voice Stickers")',
    'div:has-text("Voice Stickers")',
    '[aria-label*="voice" i]',
  ];

  private readonly uploadButtonSelectors = [
    '[data-testid="upload-stickers"]',
    'button:has-text("Upload Stickers")',
    'button:has-text("Upload")',
    '[aria-label*="upload" i]',
    'input[type="file"]',
  ];

  private readonly uploadEmojiButtonSelectors = [
    '[data-testid="upload-emoji"]',
    'button:has-text("Upload emoji")',
    'div:has-text("Upload emoji")',
    'text=Upload emoji',
  ];

  private readonly uploadVoiceButtonSelectors = [
    '[data-testid="upload-sound"]',
    'button:has-text("Upload sound")',
    'text=Upload sound',
  ];

  private readonly modalSelectors = [
    '.modal',
    '.dialog',
    '.popup',
    '[role="dialog"]',
    '[role="modal"]',
    '.overlay',
    '.modal-overlay',
    '.bg-modal-overlay',
    '[class*="modal-overlay"]',
    '[data-testid="modal"]',
    '[data-testid="upload-modal"]',
  ];

  constructor(page: Page, baseURL?: string) {
    super(page, baseURL);
  }

  async navigateToClanMenu(): Promise<void> {
    const currentUrl = this.page.url();

    if (!currentUrl.includes('/chat/clans/')) {
      const clanNavigationSelectors = [
        '[href*="/chat/clans/"]',
        'a:has-text("CLAN TEST LOCAL")',
        '[data-testid="clan-link"]',
        '.clan-item',
        '.sidebar-clan',
      ];

      let clanLinkFound = false;
      for (const selector of clanNavigationSelectors) {
        try {
          const element = this.page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            await element.click();
            clanLinkFound = true;

            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000);
            break;
          }
        } catch {
          // Ignore errors
          continue;
        }
      }

      if (!clanLinkFound) {
        const clanElements = this.page.getByText(/clan.*test.*local/i);
        const count = await clanElements.count();
        if (count > 0) {
          await clanElements.first().click();
          await this.page.waitForTimeout(2000);
        }
      }
    }

    const clanDropdownSelectors = [
      'button:has-text("CLAN TEST LOCAL")',
      '.clan-header button',
      '[data-testid="clan-dropdown"]',
      '.clan-name-dropdown',
      'button[aria-expanded]',

      'h1:has-text("CLAN") + button',
      'div:has-text("CLAN TEST LOCAL") button',
      '[role="button"]:has-text("CLAN")',
    ];

    let clanDropdownFound = false;
    for (const selector of clanDropdownSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          await element.click();
          clanDropdownFound = true;

          await this.page.waitForTimeout(1000);
          break;
        }
      } catch {
        // Ignore errors
        continue;
      }
    }

    if (!clanDropdownFound) {
      const clanTextElements = this.page.getByText(/CLAN.*TEST.*LOCAL/i);
      const textCount = await clanTextElements.count();

      if (textCount > 0) {
        for (let i = 0; i < textCount; i++) {
          try {
            const textElement = clanTextElements.nth(i);
            const parent = textElement.locator('..');

            const tagName = await parent.evaluate(el => el.tagName.toLowerCase());
            if (['button', 'a', 'div'].includes(tagName)) {
              await parent.click();

              clanDropdownFound = true;
              await this.page.waitForTimeout(1000);
              break;
            }
          } catch {
            // Ignore errors
            continue;
          }
        }
      }
    }

    if (!clanDropdownFound) {
      await this.takeScreenshot('clan-dropdown-not-found');
    }
  }

  async navigateToClanSettings(): Promise<void> {
    let settingsFound = false;

    for (const selector of this.settingsSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          settingsFound = true;

          break;
        }
      } catch {
        // Ignore errors
        continue;
      }
    }

    if (!settingsFound) {
      const settingsElements = this.page.getByText(/settings/i);
      const count = await settingsElements.count();
      if (count > 0) {
        await settingsElements.first().click();
      } else {
        await this.takeScreenshot('settings-not-found');
        throw new Error('Cannot find Settings option in clan menu');
      }
    }

    await this.page.waitForTimeout(1000);
  }

  async navigateToFullClanSettings(): Promise<void> {
    await this.navigateToClanMenu();
    await this.navigateToClanSettings();
  }

  async clickImageStickersSection(): Promise<void> {
    let stickerSectionFound = false;

    for (const selector of this.stickerSectionSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          await element.click();
          stickerSectionFound = true;

          break;
        }
      } catch {
        // Ignore errors
        continue;
      }
    }

    if (!stickerSectionFound) {
      const textElements = this.page.getByText(/sticker|image/i);
      const count = await textElements.count();
      if (count > 0) {
        await textElements.first().click();
      } else {
        await this.takeScreenshot('stickers-section-not-found');
        throw new Error('Cannot find Image Stickers section');
      }
    }

    await this.page.waitForTimeout(1000);
  }

  async clickSettingClanSection(section: string): Promise<void> {
    await this.buttons.sidebarItem.filter({ hasText: section }).click();
    await this.page.waitForTimeout(1000);
  }

  async createClanWebhookButton(): Promise<void> {
    const button = this.page.locator(
      generateE2eSelector('clan_page.settings.integrations.create_clan_webhook_button')
    );
    await button.click();
    await this.page.waitForTimeout(500);
    const new_clan_webhook_button = this.page.locator(
      generateE2eSelector('clan_page.settings.integrations.new_clan_webhook_button')
    );
    await new_clan_webhook_button.click();
    await this.page.waitForTimeout(1000);
    const navigate_webhook_button = this.page.locator(
      generateE2eSelector('clan_page.settings.integrations.navigate_webhook_button')
    );
    await navigate_webhook_button.click();
  }

  async clickVoiceStickersSection(): Promise<void> {
    let sectionFound = false;

    for (const selector of this.voiceStickerSectionSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          await element.click();
          sectionFound = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!sectionFound) {
      const textElements = this.page.getByText(/voice stickers|upload sound|sound effect/i);
      const count = await textElements.count();
      if (count > 0) {
        await textElements.first().click();
      } else {
        await this.takeScreenshot('voice-stickers-section-not-found');
        throw new Error('Cannot find Voice Stickers section');
      }
    }

    await this.page.waitForTimeout(500);
  }

  async clickUploadStickers(): Promise<void> {
    let uploadButtonFound = false;

    for (const selector of this.uploadButtonSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          if (selector === 'input[type="file"]') {
            const parent = element.locator('..');
            await parent.click();
          } else {
            await element.click();
          }
          uploadButtonFound = true;

          break;
        }
      } catch {
        // Ignore errors
        continue;
      }
    }

    if (!uploadButtonFound) {
      const uploadElements = this.page.getByText(/upload/i);
      const count = await uploadElements.count();
      if (count > 0) {
        await uploadElements.first().click();
      } else {
        await this.takeScreenshot('upload-button-not-found');
        throw new Error('Cannot find Upload Stickers button');
      }
    }

    await this.page.waitForTimeout(1000);
  }

  async clickUploadEmoji(): Promise<void> {
    await this.buttons.uploadEmoji.click();
    await this.page.waitForTimeout(1000);
  }

  async clickUploadVoiceStickers(): Promise<void> {
    await this.buttons.uploadVoiceSticker.click();
    await this.page.waitForTimeout(1000);
  }

  async openEditOnboardingResource(): Promise<void> {
    await this.buttons.enableOnboarding.click();
    await this.buttons.editClanGuide.click();
    await this.buttons.addResource.click();
  }

  async openCommunityModal(): Promise<void> {
    await this.buttons.enableCommunity.click();
  }

  async getVisibleModalCount(): Promise<number> {
    let visibleModals = 0;

    for (const selector of this.modalSelectors) {
      try {
        const modals = this.page.locator(selector);
        const count = await modals.count();

        for (let i = 0; i < count; i++) {
          const modal = modals.nth(i);
          if (await modal.isVisible()) {
            visibleModals++;
          }
        }
      } catch {
        // Element might not exist or be accessible, continue
      }
    }

    return visibleModals;
  }

  async isUploadModalDisplayed(): Promise<{ isDisplayed: boolean; selector?: string }> {
    for (const selector of this.modalSelectors) {
      try {
        const modal = this.page.locator(selector).first();
        await modal.waitFor({ state: 'visible', timeout: 5000 });

        return { isDisplayed: true, selector };
      } catch {
        continue;
      }
    }

    const contentSelectors = [
      this.page.getByText(/Upload a file/i).first(),
      this.page.getByText(/Sticker Name/i).first(),
      this.page.getByRole('button', { name: /Never Mind/i }).first(),
      this.page.getByRole('button', { name: /^Upload$/i }).first(),
    ];

    for (const locator of contentSelectors) {
      try {
        if (await locator.isVisible({ timeout: 1500 })) {
          return { isDisplayed: true, selector: 'content-match' };
        }
      } catch {}
    }

    const allElements = this.page.locator('*');
    const count = await allElements.count();

    for (let i = 0; i < Math.min(count, 50); i++) {
      try {
        const element = allElements.nth(i);
        const style = await element.getAttribute('style');
        if (style && style.includes('z-index')) {
          const isVisible = await element.isVisible();
          if (isVisible) {
            return { isDisplayed: true, selector: `Element with z-index at position ${i}` };
          }
        }
      } catch {
        // Element might not exist or be accessible, continue
      }
    }

    return { isDisplayed: false };
  }

  async pressEscKey(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
  }

  async isMentionInputVisible(): Promise<boolean> {
    const bottomChatInputSelectors = [
      'input[placeholder="Write your thoughts here..."]',
      'textarea[placeholder="Write your thoughts here..."]',
      'input[placeholder*="Write your thoughts"]',
      'textarea[placeholder*="Write your thoughts"]',
      '[placeholder*="thoughts"]',

      '.chat-input-container input',
      '.chat-input-container textarea',
      '.message-composer input',
      '.message-composer textarea',
      '.compose-area input',
      '.compose-area textarea',

      'div[class*="bottom"] input',
      'div[class*="bottom"] textarea',
      'div[class*="compose"] input',
      'div[class*="compose"] textarea',

      '.chat-input',
      '.message-input',
      '[data-testid="chat-input"]',
      '.input-container input',
      '.input-container textarea',
      '.bottom-input',
      '.compose-input',

      'input[class*="chat"]',
      'textarea[class*="chat"]',
      'input[class*="message"]',
      'textarea[class*="message"]',
    ];

    for (const selector of bottomChatInputSelectors) {
      try {
        const element = this.page.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 1000 });
        if (isVisible) {
          const placeholder = await element.getAttribute('placeholder').catch(() => '');
          const value = await element.inputValue().catch(() => '');

          const boundingBox = await element.boundingBox().catch(() => null);
          const viewportSize = this.page.viewportSize();
          const isInBottomHalf =
            boundingBox && viewportSize && boundingBox.y > viewportSize.height * 0.5;

          return true;
        }
      } catch {
        // Ignore errors
        continue;
      }
    }

    return false;
  }

  async getMentionInputDetails(): Promise<{
    found: boolean;
    selector?: string;
    placeholder?: string;
    value?: string;
    focused?: boolean;
    visible?: boolean;
  }> {
    const bottomChatInputSelectors = [
      'input[placeholder="Write your thoughts here..."]',
      'textarea[placeholder="Write your thoughts here..."]',
      'input[placeholder*="Write your thoughts"]',
      'textarea[placeholder*="Write your thoughts"]',
      '[placeholder*="thoughts"]',
      '.chat-input',
      '.message-input',
      '[data-testid="chat-input"]',
      '.input-container input',
      '.input-container textarea',
      '.bottom-input',
      '.compose-input',
    ];

    for (const selector of bottomChatInputSelectors) {
      try {
        const element = this.page.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 1000 });

        if (isVisible) {
          const placeholder = await element.getAttribute('placeholder').catch(() => '');
          const value = await element.inputValue().catch(() => '');
          const focused = await element
            .evaluate(el => el === document.activeElement)
            .catch(() => false);

          return {
            found: true,
            selector: selector,
            placeholder: placeholder || '',
            value: value || '',
            focused: focused,
            visible: isVisible,
          };
        }
      } catch {
        // Ignore errors
        continue;
      }
    }

    return { found: false };
  }

  /**
   * Take screenshot and analyze all input elements on page
   */
  async debugAllInputs(): Promise<void> {
    await this.takeScreenshot('debug-all-inputs');

    // Get all input and textarea elements
    const allInputs = await this.page.locator('input, textarea').all();

    for (let i = 0; i < Math.min(allInputs.length, 10); i++) {
      try {
        const input = allInputs[i];
        const isVisible = await input.isVisible();
        const tagName = await input.evaluate(el => el.tagName);
        const id = (await input.getAttribute('id')) || '';
        const className = (await input.getAttribute('class')) || '';
        const placeholder = (await input.getAttribute('placeholder')) || '';
        const type = (await input.getAttribute('type')) || '';

        if (isVisible) {
          console.log(
            `  Input ${i}: ${tagName} id="${id}" class="${className}" placeholder="${placeholder}" type="${type}"`
          );
        }
      } catch {
        // Ignore errors
      }
    }
  }

  /**
   * Test ESC key behavior - Check if mention input appears
   */
  async testEscKeyBehavior(): Promise<{
    initialModalCount: number;
    finalModalCount: number;
    closedAllAtOnce: boolean;
    mentionInputTest: {
      initialInputVisible: boolean;
      finalInputVisible: boolean;
      escTriggeredInput: boolean;
      testResult: 'PASS' | 'FAIL';
    };
    escPressResults: Array<{
      pressNumber: number;
      modalsBefore: number;
      modalsAfter: number;
      closedCount: number;
      mentionInputBefore: boolean;
      mentionInputAfter: boolean;
      inputTriggered: boolean;
    }>;
  }> {
    // Take initial screenshot and capture initial state
    await this.takeScreenshot('esc-test-initial-state');

    // Debug all inputs initially
    await this.debugAllInputs();

    const initialModalCount = await this.getVisibleModalCount();
    const initialInputVisible = await this.isMentionInputVisible();
    const initialInputDetails = await this.getMentionInputDetails();

    const escPressResults: Array<{
      pressNumber: number;
      modalsBefore: number;
      modalsAfter: number;
      closedCount: number;
      mentionInputBefore: boolean;
      mentionInputAfter: boolean;
      inputTriggered: boolean;
    }> = [];

    // Even if no modals detected, still test ESC key to see if it triggers mention input
    if (initialModalCount === 0) {
      // Test ESC key press even without visible modals
      const inputBeforeESC = await this.isMentionInputVisible();
      const inputDetailsBeforeESC = await this.getMentionInputDetails();

      await this.pressEscKey();
      await this.page.waitForTimeout(2000); // Wait longer for potential input to appear
      await this.takeScreenshot('esc-test-no-modals');

      // Debug all inputs after ESC

      await this.debugAllInputs();

      // Check if ESC triggered mention input or modal changes
      const modalCountAfterESC = await this.getVisibleModalCount();
      const inputAfterESC = await this.isMentionInputVisible();
      const inputDetailsAfterESC = await this.getMentionInputDetails();
      // Enhanced logic: check multiple ways ESC could trigger input behavior
      const newInputAppeared = !inputBeforeESC && inputAfterESC; // New input appeared
      const inputBecameFocused = !inputDetailsBeforeESC.focused && inputDetailsAfterESC.focused; // Input became focused
      const inputVisibilityChanged = !inputDetailsBeforeESC.found && inputDetailsAfterESC.found; // Input became visible
      const inputStateChanged =
        JSON.stringify(inputDetailsBeforeESC) !== JSON.stringify(inputDetailsAfterESC);

      // Test should FAIL if any of these conditions are true:
      const inputTriggered = newInputAppeared || inputBecameFocused || inputVisibilityChanged;

      if (inputStateChanged) {
        // Specific change analysis
        if (inputDetailsBeforeESC.focused !== inputDetailsAfterESC.focused) {
          console.log(
            `   🎯 Focus changed: ${inputDetailsBeforeESC.focused} → ${inputDetailsAfterESC.focused}`
          );
        }
        if (inputDetailsBeforeESC.visible !== inputDetailsAfterESC.visible) {
          console.log(
            `   👁️ Visibility changed: ${inputDetailsBeforeESC.visible} → ${inputDetailsAfterESC.visible}`
          );
        }
      }

      escPressResults.push({
        pressNumber: 1,
        modalsBefore: 0,
        modalsAfter: modalCountAfterESC,
        closedCount: 0,
        mentionInputBefore: inputBeforeESC,
        mentionInputAfter: inputAfterESC,
        inputTriggered: inputTriggered,
      });

      const finalInputVisible = await this.isMentionInputVisible();
      const finalInputDetails = await this.getMentionInputDetails();

      // Enhanced final check
      const escTriggeredInput = inputTriggered; // Use the enhanced logic
      const testResult: 'PASS' | 'FAIL' = escTriggeredInput ? 'FAIL' : 'PASS';

      console.log(
        `   Reason: ${escTriggeredInput ? 'ESC triggered mention input (FAIL)' : 'ESC did not trigger mention input (PASS)'}`
      );

      return {
        initialModalCount: 0,
        finalModalCount: modalCountAfterESC,
        closedAllAtOnce: false,
        mentionInputTest: {
          initialInputVisible: initialInputVisible,
          finalInputVisible: finalInputVisible,
          escTriggeredInput: escTriggeredInput,
          testResult: testResult,
        },
        escPressResults,
      };
    }

    // Test ESC key presses systematically
    let currentModalCount = initialModalCount;
    let escPressCount = 0;
    const maxEscPresses = 5; // Safety limit
    let closedAllAtOnce = false;

    while (currentModalCount > 0 && escPressCount < maxEscPresses) {
      escPressCount++;

      // Capture input state before ESC
      const inputBeforeESC = await this.isMentionInputVisible();

      // Press ESC key
      await this.pressEscKey();
      await this.page.waitForTimeout(1000); // Give more time for animations and input appearance

      // Take screenshot after ESC
      await this.takeScreenshot(`esc-test-press-${escPressCount}`);

      // Check modal count and input state after ESC
      const modalCountAfterESC = await this.getVisibleModalCount();
      const inputAfterESC = await this.isMentionInputVisible();
      const closedCount = currentModalCount - modalCountAfterESC;
      const inputTriggered = !inputBeforeESC && inputAfterESC;

      if (inputTriggered) {
      }

      // Record this ESC press result
      escPressResults.push({
        pressNumber: escPressCount,
        modalsBefore: currentModalCount,
        modalsAfter: modalCountAfterESC,
        closedCount: closedCount,
        mentionInputBefore: inputBeforeESC,
        mentionInputAfter: inputAfterESC,
        inputTriggered: inputTriggered,
      });

      // Analyze the behavior
      if (closedCount === 0) {
        break;
      } else if (closedCount === 1) {
      } else if (closedCount > 1) {
        console.log(
          `❌ BUG DETECTED: ESC press #${escPressCount} closed ${closedCount} modals at once!`
        );

        closedAllAtOnce = true;
      }

      // Special case: first ESC closed ALL modals when there were multiple
      if (escPressCount === 1 && initialModalCount > 1 && modalCountAfterESC === 0) {
        closedAllAtOnce = true;
        break;
      }

      currentModalCount = modalCountAfterESC;
    }

    // Final analysis
    const finalModalCount = await this.getVisibleModalCount();
    await this.takeScreenshot('esc-test-final-state');

    // Print detailed results
    escPressResults.forEach(result => {
      console.log(
        `   Press ${result.pressNumber}: ${result.modalsBefore} → ${result.modalsAfter} (closed: ${result.closedCount})`
      );
    });

    // Final mention input analysis
    const finalInputVisible = await this.isMentionInputVisible();
    const escTriggeredInput = !initialInputVisible && finalInputVisible;
    const anyInputTriggered = escPressResults.some(result => result.inputTriggered);
    const testResult: 'PASS' | 'FAIL' = escTriggeredInput || anyInputTriggered ? 'FAIL' : 'PASS';

    return {
      initialModalCount,
      finalModalCount,
      closedAllAtOnce,
      mentionInputTest: {
        initialInputVisible: initialInputVisible,
        finalInputVisible: finalInputVisible,
        escTriggeredInput: escTriggeredInput || anyInputTriggered,
        testResult: testResult,
      },
      escPressResults,
    };
  }

  /**
   * Navigate to main Mezon app if on landing page
   */
  async navigateToMainApp(): Promise<void> {
    const currentUrl = this.page.url();

    // Check if we're on the landing page
    if (currentUrl.includes('dev-mezon.nccsoft.vn') && !currentUrl.includes('/chat')) {
      const openMezonSelectors = [
        'button:has-text("Open Mezon")',
        'a:has-text("Open Mezon")',
        '[data-testid="open-mezon"]',
        '.open-mezon-btn',
        'button[class*="open"]',
        'a[href*="/chat"]',
      ];

      let buttonFound = false;
      for (const selector of openMezonSelectors) {
        try {
          const button = this.page.locator(selector).first();
          if (await button.isVisible({ timeout: 3000 })) {
            await button.click();
            buttonFound = true;
            break;
          }
        } catch {
          // Ignore errors
          continue;
        }
      }

      if (!buttonFound) {
        // Fallback: try direct navigation
        const baseUrl = WEBSITE_CONFIGS.MEZON.baseURL || '';
        const chatUrl = joinUrlPaths(baseUrl, '/chat');
        await this.page.goto(chatUrl);
      }

      // Wait for navigation to complete
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(3000);
    }
  }

  /**
   * Navigate to specific clan page with full URL
   */
  async navigateToClanPage(): Promise<void> {
    const currentUrl = this.page.url();
    const baseUrl = WEBSITE_CONFIGS.MEZON.baseURL || '';
    const targetClanPath = '/chat/clans/1786228934740807680/channels/1786228934753390593';
    const targetClanUrl = joinUrlPaths(baseUrl, targetClanPath);

    // Check if already in the target clan page
    if (currentUrl.includes('/chat/clans/1786228934740807680')) {
      return;
    }

    try {
      await this.page.goto(targetClanUrl);
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(3000);

      const newUrl = this.page.url();

      // Verify we're in the correct clan
      if (newUrl.includes('/chat/clans/1786228934740807680')) {
      } else {
        console.log("⚠️ URL doesn't match expected clan, but continuing...");
      }
    } catch {
      // Ignore errors

      // Fallback: try to find clan link in current page
      const clanLinkSelectors = [
        '[href*="/chat/clans/1786228934740807680"]',
        'a:has-text("CLAN TEST LOCAL")',
        '[href*="1786228934740807680"]',
      ];

      for (const selector of clanLinkSelectors) {
        try {
          const link = this.page.locator(selector).first();
          if (await link.isVisible({ timeout: 2000 })) {
            await link.click();
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000);
            return;
          }
        } catch {
          // Ignore errors
          continue;
        }
      }

      throw new Error('Could not navigate to target clan page');
    }
  }

  /**
   * Verify user is authenticated and ready for clan operations
   */
  async verifyAuthentication(): Promise<void> {
    await this.navigateToMainApp();
    await this.navigateToClanPage();

    const currentUrl = this.page.url();
    if (currentUrl.includes('login') || currentUrl.includes('authentication')) {
      throw new Error('User is not authenticated - cannot access clan settings');
    }
  }

  async openStickerUploadModal(): Promise<void> {
    await this.verifyAuthentication();
    await this.navigateToFullClanSettings();
    await this.clickImageStickersSection();
    await this.clickUploadStickers();

    const modalResult = await this.isUploadModalDisplayed();
    if (!modalResult.isDisplayed) {
      await this.takeScreenshot('sticker-upload-modal-not-found');
      throw new Error('Cannot open Sticker upload modal');
    }
  }

  async openEventsModal(): Promise<void> {
    // await this.verifyAuthentication();

    const candidates = [/^Events?$/i, /^\d+\s+Events?$/i, /Events?/i];
    let opened = false;
    for (const pattern of candidates) {
      try {
        const el = this.page.getByText(pattern).first();
        if (await el.isVisible({ timeout: 1500 })) {
          await el.click();
          opened = true;
          break;
        }
      } catch {
        continue;
      }
    }
    if (!opened) {
      await this.takeScreenshot('events-modal-open-failed');
      throw new Error('Cannot open Events modal');
    }
    await expect(this.page.getByText(/Create|Create Event/i)).toBeVisible();
  }

  async startCreateEvent(): Promise<void> {
    const createBtn = this.page.getByText(/Create Event|Create/i).first();
    await createBtn.click();
    await this.page.waitForTimeout(400);
  }

  async goToEventInfoStep(): Promise<void> {
    const nextBtn = this.page.getByRole('button', { name: /^Next$/ }).first();
    await nextBtn.click();
    await this.page.waitForTimeout(300);
    await expect(this.page.getByText(/Cover Image/i)).toBeVisible();
    await expect(this.page.getByText(/Upload Image/i)).toBeVisible();
  }

  async isFileValidationModalVisible(): Promise<boolean> {
    const modal = this.page.locator('[data-e2e="modal.validate_file"]').first();
    try {
      return await modal.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  async isRuleImagePreviewVisible(): Promise<boolean> {
    const img = this.page.locator('img#blah').first();
    try {
      return await img.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  async openCommunitySettings(): Promise<void> {
    await this.verifyAuthentication();
    await this.navigateToFullClanSettings();

    const candidates = [
      this.page.getByText(/^Enable Community$/i).first(),
      this.page.getByRole('button', { name: /^Enable Community$/i }).first(),
      this.page.getByText(/^Community Settings$/i).first(),
      this.page.getByText(/^Community$/i).first(),
    ];

    let opened = false;
    for (const el of candidates) {
      try {
        if (await el.isVisible({ timeout: 1500 })) {
          await el.click();
          opened = true;
          break;
        }
      } catch {}
    }

    if (!opened) {
      await this.takeScreenshot('community-settings-open-failed');
      throw new Error('Cannot open Community Settings section');
    }

    const enableBtn = this.page
      .getByRole('button', { name: /Enable Comunity|Enable Community/i })
      .first();
    if (await enableBtn.isVisible({ timeout: 1200 }).catch(() => false)) {
      await enableBtn.click();
      await this.page.waitForTimeout(400);
    }

    await expect(this.page.getByText(/Community Banner/i)).toBeVisible();
  }

  async uploadCommunityBanner(filePath: string): Promise<void> {
    let uploaded = false;
    try {
      const bannerLabel = this.page.getByText(/Community Banner/i).first();
      const container = bannerLabel.locator('xpath=..');
      const inputNear = container.locator('input[type="file"]').first();
      if ((await inputNear.count()) > 0) {
        await inputNear.setInputFiles(filePath);
        uploaded = true;
      }
    } catch {}

    if (!uploaded) {
      const genericInput = this.page
        .locator('input[type="file"][accept*="image"], input[type="file"][accept*="image/*"]')
        .first();
      await genericInput.setInputFiles(filePath);
    }
  }

  async openIntegrationsTab() {
    const clanMenuPanel = new ClanMenuPanel(this.page);
    await clanMenuPanel.text.clanName.click();
    await clanMenuPanel.buttons.clanSettings.click();
    await this.buttons.sidebarItem.filter({ hasText: 'Integrations' }).click();
  }

  async createWebhook(): Promise<void> {
    await this.integrations.createWebhook.click();
    await this.integrations.newWebhook.click();
  }

  async verifyWebhookCreated(): Promise<boolean> {
    const clanSelector = new ClanSelector(this.page);
    const webhookItem = await this.integrations.webhookItem.item.first();
    const webhookItemTitle = await webhookItem.locator(this.integrations.webhookItem.title);
    const webhookItemDescription = await webhookItem.locator(
      this.integrations.webhookItem.description
    );
    try {
      await expect(webhookItem).toBeVisible();
      await expect(webhookItemTitle).toBeVisible();
      await expect(webhookItemDescription).toBeVisible();
      await clanSelector.buttons.closeSettingClan.click();
      const webhookItemDescriptionText = await webhookItemDescription.innerText();
      return isWebhookJustCreated(webhookItemDescriptionText);
    } catch {
      return false;
    }
  }
}
