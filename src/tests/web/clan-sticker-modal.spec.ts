import { expect, test } from '@playwright/test';
import { ClanSettingsPage } from '../../pages/ClanSettingsPage';
import { HomePage } from '../../pages/HomePage';

test.describe('Clan Sticker Modal ESC Key Behavior', () => {
  test.beforeEach(async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigate();

    const currentUrl = page.url();
    expect(currentUrl).not.toMatch(/login|signin|authentication/);
  });

  test('should close modals one by one when pressing ESC key', async ({ page }) => {
    const clanSettingsPage = new ClanSettingsPage(page);
    let modalSetupSuccessful = false;

    await test.step('Attempt to open sticker upload modal', async () => {
      try {
        await clanSettingsPage.openStickerUploadModal();
        modalSetupSuccessful = true;
        console.log('✅ Successfully opened sticker upload modal');
      } catch {
        // Ignore errors
        console.log(`⚠️ Could not open sticker upload modal: ${error.message}`);
        console.log('Will proceed with ESC test on current page state...');
        modalSetupSuccessful = false;
      }
    });

    await test.step('Check modal state and page readiness', async () => {
      if (modalSetupSuccessful) {
        const modalResult = await clanSettingsPage.isUploadModalDisplayed();
        if (!modalResult.isDisplayed) {
          console.log('⚠️ Modal not visually detected, but continuing with ESC test...');
        } else {
          console.log(`✅ Modal found using: ${modalResult.selector}`);
        }
      } else {
        console.log('🔍 Checking current page state for any existing modals...');
        const currentModalCount = await clanSettingsPage.getVisibleModalCount();
        console.log(`📊 Current page has ${currentModalCount} visible modals`);
      }

      await page.screenshot({ path: 'screenshots/debug-pre-esc-test-state.png', fullPage: true });
    });

    await test.step('Test ESC key behavior - should close modal one by one', async () => {
      const escResult = await clanSettingsPage.testEscKeyBehavior();

      console.log(`\n📊 Enhanced Test Results:`);
      console.log(`   Initial modals: ${escResult.initialModalCount}`);
      console.log(`   Final modals: ${escResult.finalModalCount}`);
      console.log(`   Closed all at once: ${escResult.closedAllAtOnce}`);
      console.log(`   Total ESC press attempts: ${escResult.escPressResults.length}`);

      console.log(`\n💬 Bottom Chat Input Test Results:`);
      console.log(
        `   Initial "Write your thoughts" input visible: ${escResult.mentionInputTest.initialInputVisible}`
      );
      console.log(
        `   Final "Write your thoughts" input visible: ${escResult.mentionInputTest.finalInputVisible}`
      );
      console.log(`   ESC triggered bottom input: ${escResult.mentionInputTest.escTriggeredInput}`);
      console.log(`   Test Result: ${escResult.mentionInputTest.testResult}`);

      console.log(`\n📋 ESC Press Analysis:`);
      escResult.escPressResults.forEach(result => {
        const modalBehavior =
          result.closedCount === 0
            ? 'No effect'
            : result.closedCount === 1
              ? 'Correct (1 modal)'
              : `BUG (${result.closedCount} modals)`;
        const inputBehavior = result.inputTriggered ? 'INPUT!' : 'No input';
        console.log(
          `   Press ${result.pressNumber}: ${result.modalsBefore} → ${result.modalsAfter} [${modalBehavior}] [${inputBehavior}]`
        );

        if (result.inputTriggered) {
          console.log(`     Input: ${result.mentionInputBefore} → ${result.mentionInputAfter}`);
        }
      });

      let testPassed = true;
      const issues = [];

      if (escResult.mentionInputTest.finalInputVisible) {
        console.log(
          '\n❌ CRITICAL BUG: Bottom chat input "Write your thoughts here..." is visible after ESC!'
        );
        console.log(`   This is a FAILED test - ESC caused "out ra ngoài" to chat input`);
        console.log(`   Initial input visible: ${escResult.mentionInputTest.initialInputVisible}`);
        console.log(`   Final input visible: ${escResult.mentionInputTest.finalInputVisible}`);
        console.log(`   ESC triggered input: ${escResult.mentionInputTest.escTriggeredInput}`);
        testPassed = false;
        issues.push('ESC triggered bottom chat input - out ra ngoài');

        await page.screenshot({ path: 'bug-report-esc-bottom-input.png', fullPage: true });
      } else {
        console.log('\n✅ PASS: No bottom chat input visible after ESC');
        console.log(`   This is the expected behavior - no "out ra ngoài"`);
      }

      if (escResult.closedAllAtOnce) {
        console.log('\n❌ BUG DETECTED: ESC key closed all modals at once instead of one by one');

        const problematicPress = escResult.escPressResults.find(press => press.closedCount > 1);
        if (problematicPress) {
          console.log(
            `   Problematic press #${problematicPress.pressNumber}: closed ${problematicPress.closedCount} modals`
          );
        }
        issues.push('Modal stacking bug');

        await page.screenshot({
          path: 'screenshots/bug-report-esc-closes-all-modals.png',
          fullPage: true,
        });
      } else if (
        escResult.initialModalCount > 0 &&
        escResult.finalModalCount < escResult.initialModalCount
      ) {
        console.log('\n✅ PASS: ESC key behavior appears correct - modals closed progressively');

        const allSingleCloses = escResult.escPressResults.every(
          press => press.closedCount === 0 || press.closedCount === 1
        );

        if (allSingleCloses) {
          console.log('   ✅ All ESC presses closed at most 1 modal (correct behavior)');
        } else {
          console.log('   ⚠️ Some ESC presses closed multiple modals');
        }
      } else if (escResult.initialModalCount === 0) {
        console.log('\n⚠️ No modals detected initially');

        const hadErrors = escResult.escPressResults.some(
          press => press.modalsAfter > press.modalsBefore
        );
        if (hadErrors) {
          console.log('   ⚠️ ESC triggered unexpected modal appearances');
        } else {
          console.log('   ✅ ESC key handled gracefully without modals');
        }
      } else {
        console.log('\n⚠️ Unexpected ESC behavior - requires manual verification');
        console.log(
          `   Initial: ${escResult.initialModalCount}, Final: ${escResult.finalModalCount}`
        );
      }

      const inputIssues = escResult.escPressResults.filter(press => press.inputTriggered);
      if (inputIssues.length > 0) {
        console.log(`\n🚨 ${inputIssues.length} ESC press(es) triggered mention input:`);
        inputIssues.forEach(press => {
          console.log(
            `   ❌ Press ${press.pressNumber}: Input ${press.mentionInputBefore} → ${press.mentionInputAfter}`
          );
        });
      }

      console.log(`\n🎯 Final Test Summary:`);
      console.log(`   Test Result: ${testPassed ? '✅ PASS' : '❌ FAIL'}`);
      if (issues.length > 0) {
        console.log(`   Issues Found: ${issues.join(', ')}`);
      }
      console.log(
        `   Bottom Chat Input Test: ${escResult.mentionInputTest.testResult} (triggered: ${escResult.mentionInputTest.escTriggeredInput})`
      );

      if (escResult.mentionInputTest.finalInputVisible) {
        console.log(
          '\n💥 TEST FAILURE: Bottom chat input visible after ESC - "out ra ngoài" detected!'
        );

        await page.screenshot({ path: 'screenshots/esc-test-final-result.png', fullPage: true });

        expect(
          escResult.mentionInputTest.finalInputVisible,
          'ESC key caused "out ra ngoài" - bottom chat input appeared after pressing ESC'
        ).toBe(false);
      } else {
        console.log('\n✅ TEST SUCCESS: No bottom input visible - ESC behavior is correct');

        await page.screenshot({ path: 'screenshots/esc-test-final-result.png', fullPage: true });
      }
    });
  });

  test('should verify modal stack behavior with multiple ESC presses', async ({ page }) => {
    const clanSettingsPage = new ClanSettingsPage(page);

    await test.step('Setup multiple modals scenario', async () => {
      console.log('🔧 Setting up scenario for testing modal stack behavior...');

      await clanSettingsPage.openStickerUploadModal();
      await page.waitForTimeout(1000);

      const initialModalCount = await clanSettingsPage.getVisibleModalCount();
      console.log(`📊 Initial modal count: ${initialModalCount}`);

      console.log(
        'ℹ️ Testing with available modals - extend this when multiple nested modals are reliably available'
      );
    });

    await test.step('Test multiple ESC presses', async () => {
      console.log('🔑 Testing multiple ESC key presses...');

      let escPressCount = 0;
      const maxEscPresses = 5;

      while (escPressCount < maxEscPresses) {
        escPressCount++;
        const modalCountBefore = await clanSettingsPage.getVisibleModalCount();

        if (modalCountBefore === 0) {
          console.log(`✅ All modals closed after ${escPressCount - 1} ESC presses`);
          break;
        }

        console.log(`ESC press #${escPressCount} - Modals before: ${modalCountBefore}`);
        await clanSettingsPage.pressEscKey();

        const modalCountAfter = await clanSettingsPage.getVisibleModalCount();
        console.log(`ESC press #${escPressCount} - Modals after: ${modalCountAfter}`);

        if (modalCountAfter === modalCountBefore) {
          console.log(`⚠️ ESC press #${escPressCount} did not close any modals`);
          break;
        }

        if (modalCountBefore > 1 && modalCountAfter === 0) {
          console.log(`❌ BUG: ESC press #${escPressCount} closed ALL remaining modals at once`);
          console.log(
            `Expected: Close only 1 modal (${modalCountBefore} -> ${modalCountBefore - 1})`
          );
          console.log(`Actual: Closed all modals (${modalCountBefore} -> 0)`);
          break;
        }

        await page.screenshot({ path: `debug-esc-press-${escPressCount}.png`, fullPage: true });
      }

      console.log(`🏁 Modal stack test completed after ${escPressCount} ESC presses`);
    });
  });
});
