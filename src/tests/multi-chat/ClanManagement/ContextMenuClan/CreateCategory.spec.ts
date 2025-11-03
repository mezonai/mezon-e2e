import { AllureConfig } from '@/config/allure.config';
import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import { ClanMenuPanel } from '@/pages/Clan/ClanMenuPanel';
import { ClanInviteFriendModal } from '@/pages/Clan/ClanInviteFriendModal';
import { ClanInviteModal } from '@/pages/Modal/ClanInviteModal';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect, test } from '@/fixtures/dual.fixture';

test.describe('Clan Context Menu - Create Category', () => {
  const managerAccount = AccountCredentials['account1'];
  const memberAccount = AccountCredentials['account4'];

  let clanFactory: ClanFactory;

  test.beforeEach(async ({ dual }) => {
    clanFactory = new ClanFactory();

    await dual.parallel({
      A: async () => {
        const credentials = await AuthHelper.setupAuthWithEmailPassword(dual.pageA, managerAccount);
        await AuthHelper.prepareBeforeTest(
          dual.pageA,
          joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS),
          credentials
        );
      },
      B: async () => {
        const credentials = await AuthHelper.setupAuthWithEmailPassword(dual.pageB, memberAccount);
        await AuthHelper.prepareBeforeTest(
          dual.pageB,
          joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS),
          credentials
        );
      },
    });
  });

  test('Create category option requires manageClan permission', async ({ dual }) => {
    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: AllureConfig.Severity.CRITICAL,
    });

    await AllureReporter.addDescription(`
      **Test Objective:** Ensure the Create Category action is visible only to members with manageClan permission.

      **Test Steps:**
      1. Open the context menu as a clan manager and confirm the Create Category entry is visible
      2. Generate an invite link and join the clan with a non-manager account
      3. Open the context menu as the non-manager and confirm the Create Category entry is hidden

      **Expected Result:** Only the manager sees the Create Category option; non-manager members do not.
    `);

    await AllureReporter.addLabels({
      tag: ['category', 'context-menu', 'permissions'],
    });

    const { pageA, pageB } = dual;
    const menuPanelA = new ClanMenuPanel(pageA);

    await test.step('Setup clan for thread test', async () => {
      await clanFactory.setupClan(ClanSetupHelper.configs.blockUser, pageA);
    });

    let inviteLink: string = '';
    await test.step('User A invite User B to clan', async () => {
      await menuPanelA.openInvitePeopleModal();
      const clanInviteFriendModalA = new ClanInviteFriendModal(pageA);
      inviteLink = await clanInviteFriendModalA.getInviteLink();
      expect(inviteLink).not.toBe('');
    });

    await test.step('User A and User B joins the clan', async () => {
      await pageA.goto(inviteLink, {
        waitUntil: 'domcontentloaded',
      });
      await pageB.goto(inviteLink, {
        waitUntil: 'domcontentloaded',
      });
      const clanInviteModalA = new ClanInviteModal(pageA);
      const clanInviteModalB = new ClanInviteModal(pageB);
      await clanInviteModalA.acceptInvite();
      await clanInviteModalB.acceptInvite();
    });

    await test.step('Manager sees Create Category entry in context menu', async () => {
      await menuPanelA.openPanel();
      await expect(menuPanelA.buttons.createCategory).toBeVisible();
      await pageA.keyboard.press('Escape');
    });

    await AllureReporter.addParameter('secondaryAccount', memberAccount.email);

    await test.step('Non-manager context menu hides Create Category entry', async () => {
      const memberMenuPanel = new ClanMenuPanel(pageB);
      await memberMenuPanel.openPanel();
      await expect(memberMenuPanel.buttons.invitePeople).toBeVisible();
      await expect(memberMenuPanel.buttons.createCategory).toHaveCount(0);
      await pageB.keyboard.press('Escape');
    });

    await AllureReporter.attachScreenshot(pageB, 'Context Menu Without ManageClan');

    await test.step('Cleanup clan', async () => {
      await clanFactory.cleanupClan(pageA);
    });
  });
});
