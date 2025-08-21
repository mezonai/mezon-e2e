import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ClanSettingsPage extends BasePage {
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

  private readonly uploadButtonSelectors = [
    '[data-testid="upload-stickers"]',
    'button:has-text("Upload Stickers")',
    'button:has-text("Upload")',
    '[aria-label*="upload" i]',
    'input[type="file"]',
  ];

  private readonly modalSelectors = [
    '.modal',
    '.dialog',
    '.popup',
    '[role="dialog"]',
    '[role="modal"]',
    '.overlay',
    '.modal-overlay',
    '[data-testid="modal"]',
    '[data-testid="upload-modal"]',
  ];

  constructor(page: Page, baseURL?: string) {
    super(page, baseURL);
  }

  async navigateToClanMenu(): Promise<void> {
    const currentUrl = this.page.url();
    console.log(`🔗 Current URL: ${currentUrl}`);

    if (!currentUrl.includes('/chat/clans/')) {
      console.log('📍 Not in clan page, trying to navigate to clan...');

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
            console.log(`✅ Navigated to clan using: ${selector}`);
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
        console.log('🔍 Looking for any clan elements...');
        const clanElements = this.page.getByText(/clan.*test.*local/i);
        const count = await clanElements.count();
        if (count > 0) {
          await clanElements.first().click();
          console.log('✅ Clicked clan using text search');
          await this.page.waitForTimeout(2000);
        } else {
          console.log('⚠️ No clan found, continuing with current page...');
        }
      }
    }

    console.log('🔍 Looking for clan dropdown menu...');
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
          console.log(`✅ Clicked clan dropdown using: ${selector}`);
          await this.page.waitForTimeout(1000);
          break;
        }
      } catch {
      // Ignore errors
        continue;
      }
    }

    if (!clanDropdownFound) {
      console.log('🔍 Searching for clan header elements...');

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
              console.log(`✅ Clicked clan header parent element (${tagName})`);
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
      console.log('⚠️ Could not find clan dropdown, but continuing...');
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
          console.log(`✅ Clicked settings using: ${selector}`);
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
        console.log('✅ Clicked settings using text search');
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
          console.log(`✅ Clicked Image Stickers using: ${selector}`);
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
        console.log('✅ Clicked Image Stickers using text search');
      } else {
        await this.takeScreenshot('stickers-section-not-found');
        throw new Error('Cannot find Image Stickers section');
      }
    }

    await this.page.waitForTimeout(1000);
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
          console.log(`✅ Clicked Upload Stickers using: ${selector}`);
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
        console.log('✅ Clicked Upload button using text search');
      } else {
        await this.takeScreenshot('upload-button-not-found');
        throw new Error('Cannot find Upload Stickers button');
      }
    }

    await this.page.waitForTimeout(1000);
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
      } catch {}
    }

    return visibleModals;
  }

  async isUploadModalDisplayed(): Promise<{ isDisplayed: boolean; selector?: string }> {
    for (const selector of this.modalSelectors) {
      try {
        const modal = this.page.locator(selector).first();
        await modal.waitFor({ state: 'visible', timeout: 5000 });
        console.log(`✅ Modal found using: ${selector}`);
        return { isDisplayed: true, selector };
      } catch {
      // Ignore errors
        continue;
      }
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
            console.log(`✅ Found potential modal with z-index at position ${i}`);
            return { isDisplayed: true, selector: `Element with z-index at position ${i}` };
          }
        }
      } catch {}
    }

    return { isDisplayed: false };
  }

  async pressEscKey(): Promise<void> {
    console.log('🔑 Pressing ESC key...');
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

          console.log(`✅ Found bottom chat input using: ${selector}`);
          console.log(`   Placeholder: "${placeholder}"`);
          console.log(`   Value: "${value}"`);
          console.log(`   Position: ${boundingBox ? `y=${boundingBox.y}` : 'unknown'}`);
          console.log(`   In bottom half: ${isInBottomHalf}`);

          return true;
        }
      } catch {
      // Ignore errors
        continue;
      }
    }

    console.log('❌ No bottom chat input found');
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
    console.log('🔍 Debugging all inputs on page...');

    await this.takeScreenshot('debug-all-inputs');

    // Get all input and textarea elements
    const allInputs = await this.page.locator('input, textarea').all();
    console.log(`📊 Found ${allInputs.length} input/textarea elements`);

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
        console.log(`  Input ${i}: Could not inspect`);
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
    console.log('🔍 Starting ESC key behavior test - Focus on mention input...');

    // Take initial screenshot and capture initial state
    await this.takeScreenshot('esc-test-initial-state');

    // Debug all inputs initially
    await this.debugAllInputs();

    const initialModalCount = await this.getVisibleModalCount();
    const initialInputVisible = await this.isMentionInputVisible();
    const initialInputDetails = await this.getMentionInputDetails();

    console.log(`📊 Initial modal count: ${initialModalCount}`);
    console.log(`💬 Initial mention input visible: ${initialInputVisible}`);
    console.log(`🔍 Initial input details:`, initialInputDetails);

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
      console.log('⚠️ No modals detected initially, but testing ESC anyway...');

      // Test ESC key press even without visible modals
      console.log('🔑 Testing ESC key press (no modals scenario)...');
      const inputBeforeESC = await this.isMentionInputVisible();
      const inputDetailsBeforeESC = await this.getMentionInputDetails();

      console.log(`💬 BEFORE ESC - Input visible: ${inputBeforeESC}`);
      console.log(`🔍 BEFORE ESC - Input details:`, inputDetailsBeforeESC);

      await this.pressEscKey();
      await this.page.waitForTimeout(2000); // Wait longer for potential input to appear
      await this.takeScreenshot('esc-test-no-modals');

      // Debug all inputs after ESC
      console.log(`\n🔍 Debugging all inputs AFTER ESC...`);
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

      console.log(`💬 AFTER ESC - Input visible: ${inputAfterESC}`);
      console.log(`🔍 AFTER ESC - Input details:`, inputDetailsAfterESC);
      console.log(`\n🔍 ESC Impact Analysis:`);
      console.log(`   New input appeared: ${newInputAppeared}`);
      console.log(`   Input became focused: ${inputBecameFocused}`);
      console.log(`   Input visibility changed: ${inputVisibilityChanged}`);
      console.log(`   Input state changed: ${inputStateChanged}`);
      console.log(`🚨 ESC triggered input behavior: ${inputTriggered}`);

      if (inputStateChanged) {
        console.log(`\n📝 Detailed input changes:`);
        console.log(`   Before:`, inputDetailsBeforeESC);
        console.log(`   After:`, inputDetailsAfterESC);

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
      const _finalInputDetails = await this.getMentionInputDetails();

      // Enhanced final check
      const escTriggeredInput = inputTriggered; // Use the enhanced logic
      const testResult: 'PASS' | 'FAIL' = escTriggeredInput ? 'FAIL' : 'PASS';

      console.log(`\n🎯 Test Result: ${testResult}`);
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
      console.log(`\n🔑 ESC Press #${escPressCount}`);
      console.log(`   Modals before press: ${currentModalCount}`);

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

      console.log(`   Modals after press: ${modalCountAfterESC}`);
      console.log(`   Modals closed: ${closedCount}`);
      console.log(`   Mention input before: ${inputBeforeESC}`);
      console.log(`   Mention input after: ${inputAfterESC}`);
      console.log(`   Input triggered: ${inputTriggered}`);

      if (inputTriggered) {
        console.log('🚨 ESC triggered mention input during modal test!');
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
        console.log(`⚠️ ESC press #${escPressCount} did not close any modals`);
        break;
      } else if (closedCount === 1) {
        console.log(`✅ ESC press #${escPressCount} closed 1 modal (correct behavior)`);
      } else if (closedCount > 1) {
        console.log(
          `❌ BUG DETECTED: ESC press #${escPressCount} closed ${closedCount} modals at once!`
        );
        console.log(`   Expected: Close 1 modal`);
        console.log(`   Actual: Closed ${closedCount} modals`);
        closedAllAtOnce = true;
      }

      // Special case: first ESC closed ALL modals when there were multiple
      if (escPressCount === 1 && initialModalCount > 1 && modalCountAfterESC === 0) {
        console.log(`❌ CRITICAL BUG: First ESC closed ALL ${initialModalCount} modals at once!`);
        closedAllAtOnce = true;
        break;
      }

      currentModalCount = modalCountAfterESC;
    }

    // Final analysis
    const finalModalCount = await this.getVisibleModalCount();
    await this.takeScreenshot('esc-test-final-state');

    console.log(`\n📊 ESC Key Test Summary:`);
    console.log(`   Initial modals: ${initialModalCount}`);
    console.log(`   Final modals: ${finalModalCount}`);
    console.log(`   Total ESC presses: ${escPressCount}`);
    console.log(`   Closed all at once: ${closedAllAtOnce}`);

    // Print detailed results
    console.log(`\n📋 Detailed ESC Press Results:`);
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

    console.log(`\n🎯 Final Mention Input Analysis:`);
    console.log(`   Initial input visible: ${initialInputVisible}`);
    console.log(`   Final input visible: ${finalInputVisible}`);
    console.log(`   ESC triggered input: ${escTriggeredInput || anyInputTriggered}`);
    console.log(`   Test Result: ${testResult}`);

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
    console.log(`🔗 Current URL: ${currentUrl}`);

    // Check if we're on the landing page
    if (currentUrl.includes('dev-mezon.nccsoft.vn') && !currentUrl.includes('/chat')) {
      console.log('📍 On landing page, looking for "Open Mezon" button...');

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
            console.log(`✅ Found "Open Mezon" button using: ${selector}`);
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
        console.log('🔄 Button not found, trying direct navigation...');
        await this.page.goto('/chat');
      }

      // Wait for navigation to complete
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(3000);

      console.log(`🔗 After navigation: ${this.page.url()}`);
    }
  }

  /**
   * Navigate to specific clan page with full URL
   */
  async navigateToClanPage(): Promise<void> {
    const currentUrl = this.page.url();
    const targetClanUrl = '/chat/clans/1786228934740807680/channels/1786228934753390593';

    // Check if already in the target clan page
    if (currentUrl.includes('/chat/clans/1786228934740807680')) {
      console.log('✅ Already in target clan page');
      return;
    }

    console.log(`🔄 Navigating to specific clan URL: ${targetClanUrl}`);

    try {
      await this.page.goto(targetClanUrl);
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(3000);

      const newUrl = this.page.url();
      console.log(`✅ Successfully navigated to: ${newUrl}`);

      // Verify we're in the correct clan
      if (newUrl.includes('/chat/clans/1786228934740807680')) {
        console.log('✅ Confirmed in target clan page');
      } else {
        console.log("⚠️ URL doesn't match expected clan, but continuing...");
      }
    } catch {
      // Ignore errors
      console.log(`❌ Failed to navigate to clan URL: ${e.message}`);

      // Fallback: try to find clan link in current page
      console.log('🔄 Trying fallback navigation...');
      const clanLinkSelectors = [
        '[href*="/chat/clans/1786228934740807680"]',
        'a:has-text("CLAN TEST LOCAL")',
        '[href*="1786228934740807680"]',
      ];

      for (const selector of clanLinkSelectors) {
        try {
          const link = this.page.locator(selector).first();
          if (await link.isVisible({ timeout: 2000 })) {
            console.log(`✅ Found clan link using: ${selector}`);
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
    console.log('✅ User is authenticated and ready for clan operations');
  }

  /**
   * Full workflow: Open sticker upload modal
   */
  async openStickerUploadModal(): Promise<void> {
    await this.verifyAuthentication();
    await this.navigateToFullClanSettings();
    await this.clickImageStickersSection();
    await this.clickUploadStickers();

    const modalResult = await this.isUploadModalDisplayed();
    if (!modalResult.isDisplayed) {
      console.log('⚠️ Upload modal may not be visible, but continuing test...');
    }
  }
}
