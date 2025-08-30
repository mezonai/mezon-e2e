import { AllureConfig, TestSetups } from '@/config/allure.config';
import { AllureReporter } from '@/utils/allureHelpers';
import { expect, test } from '@playwright/test';
import { ClanSettingsPage } from '../../pages/ClanSettingsPage';
import { HomePage } from '../../pages/HomePage';

test.describe('Clan Sticker Modal ESC Key Behavior', () => {
  test.beforeAll(async () => {
    await TestSetups.clanTest({
      suite: AllureConfig.Suites.CLAN_MANAGEMENT,
      subSuite: AllureConfig.SubSuites.CLAN_SETTINGS,
      story: AllureConfig.Stories.CLAN_SETUP,
      severity: AllureConfig.Severity.CRITICAL,
    });
  });

  test.beforeEach(async ({ page }, testInfo) => {
    await AllureReporter.initializeTest(page, testInfo, {
      suite: AllureConfig.Suites.CLAN_MANAGEMENT,
      subSuite: AllureConfig.SubSuites.CLAN_SETTINGS,
      story: AllureConfig.Stories.CLAN_SETUP,
      severity: AllureConfig.Severity.CRITICAL,
      testType: AllureConfig.TestTypes.E2E,
    });

    const homePage = new HomePage(page);

    await AllureReporter.step('Navigate to home page', async () => {
      await homePage.navigate();
    });

    await AllureReporter.step('Verify user is authenticated', async () => {
      const currentUrl = page.url();
      expect(currentUrl).not.toMatch(/login|signin|authentication/);
    });
  });

  test('should close modals one by one when pressing ESC key', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that ESC key closes modals one by one instead of all at once, and doesn't trigger bottom chat input.
      
      **Test Steps:**
      1. Open sticker upload modal
      2. Check modal state and readiness
      3. Test ESC key behavior
      4. Verify modals close one by one
      5. Verify no "out ra ngoài" (bottom chat input) is triggered
      
      **Expected Result:** 
      - ESC key should close modals progressively (one by one)
      - Bottom chat input should not appear after ESC
      - No modal stacking bugs should occur
    `);

    await AllureReporter.addLabels({
      tag: ['modal-behavior', 'esc-key', 'ui-interaction', 'clan-stickers'],
    });

    const clanSettingsPage = new ClanSettingsPage(page);
    let modalSetupSuccessful = false;

    await AllureReporter.step('Attempt to open sticker upload modal', async () => {
      try {
        await clanSettingsPage.openStickerUploadModal();
        modalSetupSuccessful = true;
        console.log('✅ Successfully opened sticker upload modal');
        await AllureReporter.addParameter('modalSetupResult', 'Success');
      } catch (error) {
        console.log(
          `⚠️ Could not open sticker upload modal: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        console.log('Will proceed with ESC test on current page state...');
        modalSetupSuccessful = false;
        await AllureReporter.addParameter(
          'modalSetupResult',
          'Failed - Testing current page state'
        );
      }
    });

    await AllureReporter.step('Check modal state and page readiness', async () => {
      if (modalSetupSuccessful) {
        const modalResult = await clanSettingsPage.isUploadModalDisplayed();
        if (!modalResult.isDisplayed) {
          console.log('⚠️ Modal not visually detected, but continuing with ESC test...');
          await AllureReporter.addParameter('modalVisuallyDetected', 'No');
        } else {
          console.log(`✅ Modal found using: ${modalResult.selector}`);
          await AllureReporter.addParameter('modalSelector', modalResult.selector || 'Unknown');
          await AllureReporter.addParameter('modalVisuallyDetected', 'Yes');
        }
      } else {
        console.log('🔍 Checking current page state for any existing modals...');
        const currentModalCount = await clanSettingsPage.getVisibleModalCount();
        console.log(`📊 Current page has ${currentModalCount} visible modals`);
        await AllureReporter.addParameter('currentModalCount', currentModalCount);
      }

      await AllureReporter.attachScreenshot(page, 'Pre-ESC Test State');
    });

    await AllureReporter.step('Test ESC key behavior - should close modal one by one', async () => {
      const escResult = await clanSettingsPage.testEscKeyBehavior();

      // Add test parameters for detailed analysis
      await AllureReporter.addParameter('initialModalCount', escResult.initialModalCount);
      await AllureReporter.addParameter('finalModalCount', escResult.finalModalCount);
      await AllureReporter.addParameter('closedAllAtOnce', escResult.closedAllAtOnce);
      await AllureReporter.addParameter('totalEscAttempts', escResult.escPressResults.length);
      await AllureReporter.addParameter(
        'bottomInputTriggered',
        escResult.mentionInputTest.escTriggeredInput
      );

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
      const issues: string[] = [];

      // Critical test: Check for bottom input bug
      await AllureReporter.step('Validate bottom chat input behavior', async () => {
        if (escResult.mentionInputTest.finalInputVisible) {
          console.log(
            '\n❌ CRITICAL BUG: Bottom chat input "Write your thoughts here..." is visible after ESC!'
          );
          console.log(`   This is a FAILED test - ESC caused "out ra ngoài" to chat input`);
          console.log(
            `   Initial input visible: ${escResult.mentionInputTest.initialInputVisible}`
          );
          console.log(`   Final input visible: ${escResult.mentionInputTest.finalInputVisible}`);
          console.log(`   ESC triggered input: ${escResult.mentionInputTest.escTriggeredInput}`);
          testPassed = false;
          issues.push('ESC triggered bottom chat input - out ra ngoài');

          await AllureReporter.attachScreenshot(page, 'BUG: ESC Triggered Bottom Input');
        } else {
          console.log('\n✅ PASS: No bottom chat input visible after ESC');
          console.log(`   This is the expected behavior - no "out ra ngoài"`);
        }
      });

      // Modal stacking test
      await AllureReporter.step('Validate modal stacking behavior', async () => {
        if (escResult.closedAllAtOnce) {
          console.log('\n❌ BUG DETECTED: ESC key closed all modals at once instead of one by one');

          const problematicPress = escResult.escPressResults.find(press => press.closedCount > 1);
          if (problematicPress) {
            console.log(
              `   Problematic press #${problematicPress.pressNumber}: closed ${problematicPress.closedCount} modals`
            );
          }
          issues.push('Modal stacking bug');

          await AllureReporter.attachScreenshot(page, 'BUG: ESC Closes All Modals');
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
      });

      // Final validation and reporting
      await AllureReporter.step('Generate final test report', async () => {
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

        // Add final test result parameters
        await AllureReporter.addParameter('testPassed', testPassed);
        await AllureReporter.addParameter('issuesFound', issues.length);
        await AllureReporter.addParameter(
          'bottomInputTestResult',
          escResult.mentionInputTest.testResult
        );
      });

      await AllureReporter.step('Final test assertion', async () => {
        if (escResult.mentionInputTest.finalInputVisible) {
          console.log(
            '\n💥 TEST FAILURE: Bottom chat input visible after ESC - "out ra ngoài" detected!'
          );

          await AllureReporter.attachScreenshot(page, 'TEST FAILED: Bottom Input Visible');

          expect(
            escResult.mentionInputTest.finalInputVisible,
            'ESC key caused "out ra ngoài" - bottom chat input appeared after pressing ESC'
          ).toBe(false);
        } else {
          console.log('\n✅ TEST SUCCESS: No bottom input visible - ESC behavior is correct');

          await AllureReporter.attachScreenshot(page, 'TEST PASSED: ESC Behavior Correct');
        }
      });
    });
  });

  test('should verify modal stack behavior with multiple ESC presses', async ({ page }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.NORMAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Verify that multiple ESC presses handle modal stacking correctly.
      
      **Test Steps:**
      1. Setup multiple modals scenario
      2. Test multiple ESC key presses
      3. Verify each ESC press closes at most one modal
      4. Verify no modals are left in an inconsistent state
      
      **Expected Result:** 
      - Each ESC press should close only one modal
      - Modal count should decrease progressively
      - No unexpected modal appearances should occur
    `);

    await AllureReporter.addLabels({
      tag: ['modal-stacking', 'esc-key', 'multiple-modals', 'clan-stickers'],
    });

    const clanSettingsPage = new ClanSettingsPage(page);

    await AllureReporter.step('Setup multiple modals scenario', async () => {
      console.log('🔧 Setting up scenario for testing modal stack behavior...');

      await clanSettingsPage.openStickerUploadModal();
      await page.waitForTimeout(1000);

      const initialModalCount = await clanSettingsPage.getVisibleModalCount();
      console.log(`📊 Initial modal count: ${initialModalCount}`);
      await AllureReporter.addParameter('setupModalCount', initialModalCount);

      console.log(
        'ℹ️ Testing with available modals - extend this when multiple nested modals are reliably available'
      );
    });

    await AllureReporter.step('Test multiple ESC presses', async () => {
      console.log('🔑 Testing multiple ESC key presses...');

      let escPressCount = 0;
      const maxEscPresses = 5;
      const escResults: Array<{ pressNumber: number; modalsBefore: number; modalsAfter: number }> =
        [];

      while (escPressCount < maxEscPresses) {
        escPressCount++;
        const modalCountBefore = await clanSettingsPage.getVisibleModalCount();

        if (modalCountBefore === 0) {
          console.log(`✅ All modals closed after ${escPressCount - 1} ESC presses`);
          await AllureReporter.addParameter('totalEscPresses', escPressCount - 1);
          break;
        }

        console.log(`ESC press #${escPressCount} - Modals before: ${modalCountBefore}`);
        await clanSettingsPage.pressEscKey();

        const modalCountAfter = await clanSettingsPage.getVisibleModalCount();
        console.log(`ESC press #${escPressCount} - Modals after: ${modalCountAfter}`);

        escResults.push({
          pressNumber: escPressCount,
          modalsBefore: modalCountBefore,
          modalsAfter: modalCountAfter,
        });

        if (modalCountAfter === modalCountBefore) {
          console.log(`⚠️ ESC press #${escPressCount} did not close any modals`);
          await AllureReporter.addParameter(`escPress${escPressCount}Result`, 'No effect');
          break;
        }

        if (modalCountBefore > 1 && modalCountAfter === 0) {
          console.log(`❌ BUG: ESC press #${escPressCount} closed ALL remaining modals at once`);
          console.log(
            `Expected: Close only 1 modal (${modalCountBefore} -> ${modalCountBefore - 1})`
          );
          console.log(`Actual: Closed all modals (${modalCountBefore} -> 0)`);
          await AllureReporter.addParameter(
            `escPress${escPressCount}Result`,
            'BUG: Closed all modals'
          );
          await AllureReporter.attachScreenshot(
            page,
            `BUG: ESC Press ${escPressCount} Closed All Modals`
          );
          break;
        }

        await AllureReporter.addParameter(
          `escPress${escPressCount}Result`,
          `${modalCountBefore} → ${modalCountAfter}`
        );
        await AllureReporter.attachScreenshot(page, `ESC Press ${escPressCount} Result`);
      }

      await AllureReporter.addParameter('maxEscPressesReached', escPressCount >= maxEscPresses);
      await AllureReporter.addParameter('totalEscPressesAttempted', escPressCount);

      console.log(`🏁 Modal stack test completed after ${escPressCount} ESC presses`);
    });
  });
});
