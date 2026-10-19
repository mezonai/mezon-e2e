import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { expect, test } from '@/fixtures/dual.fixture';
import { DmCallPage } from '@/pages/DmCallPage';
import { FriendPage } from '@/pages/FriendPage';
import { LoginPage } from '@/pages/LoginPage';
import { ROUTES } from '@/selectors';
import { AllureReporter } from '@/utils/allureHelpers';
import { AuthHelper } from '@/utils/authHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';

test.describe('Direct Messages - Two-user Voice Calls', () => {
  test.setTimeout(180000);
  const accountA = AccountCredentials.accountKien9;
  const accountB = AccountCredentials.accountKien10;
  const [userNameA, userNameB] = getUsernamesFromEmails([accountA.email, accountB.email]);
  const friendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);

  test.beforeEach(async ({ dual }) => {
    await AllureReporter.addLabels({ tag: ['direct-message', 'voice-call', 'multi-user'] });
    await setupDualUsersSequentially(dual, accountA, accountB, friendsUrl);
    await test.step('Prepare a direct conversation between the two named users', async () => {
      const friendA = new FriendPage(dual.pageA);
      const friendB = new FriendPage(dual.pageB);
      await FriendHelper.cleanupMutualFriendRelationships(friendA, friendB, userNameA, userNameB);
      await friendA.sendFriendRequestToUser(userNameB);
      await friendA.verifySentRequestToast();
      await friendB.acceptFriendRequestFromUser(userNameA);
      await Promise.all([friendA.assertAllFriend(userNameB), friendB.assertAllFriend(userNameA)]);
      await Promise.all([friendA.createDM(userNameB), friendB.createDM(userNameA)]);
      await Promise.all([
        new LoginPage(dual.pageA).waitForAuthenticatedAppReady(),
        new LoginPage(dual.pageB).waitForAuthenticatedAppReady(),
      ]);
      await Promise.all([
        new DmCallPage(dual.pageA).expectIdle(),
        new DmCallPage(dual.pageB).expectIdle(),
      ]);
      // Wait for both DM headers before comparing routes; navigation can still be settling.
      await expect
        .poll(() => new URL(dual.pageA.url()).pathname)
        .toBe(new URL(dual.pageB.url()).pathname);
    });
  });

  test.afterEach(async ({ dual }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      await Promise.allSettled(
        Object.entries(dual.pages).map(async ([name, page]) => {
          await testInfo.attach(`dm-call-failure-${name}`, {
            body: await page.screenshot(),
            contentType: 'image/png',
          });
        })
      );
    }
    // Always attempt cleanup for each user, including when the other page has closed.
    const cleanupResults = await Promise.allSettled(
      Object.values(dual.pages).map(async page => {
        if (page.isClosed()) return;
        try {
          await new DmCallPage(page).dismissIfPresent();
        } finally {
          await AuthHelper.logout(page);
        }
      })
    );
    for (const result of cleanupResults) {
      if (result.status === 'rejected') throw result.reason;
    }
  });

  for (const endingUser of ['A', 'B'] as const) {
    test(`User B accepts a DM voice call and User ${endingUser} ends it for both users`, async ({
      dual,
    }) => {
      const caller = new DmCallPage(dual.pageA);
      const receiver = new DmCallPage(dual.pageB);
      await test.step('User A calls User B and User B receives the call', async () => {
        await caller.start();
        await receiver.expectRinging();
      });
      await test.step('User B accepts and both users receive remote audio', async () => {
        await receiver.answer();
        await Promise.all([caller.expectConnected(), receiver.expectConnected()]);
      });
      await test.step(`User ${endingUser} hangs up and both users return to idle`, async () => {
        await (endingUser === 'A' ? caller : receiver).end();
        await Promise.all([caller.expectIdle(), receiver.expectIdle()]);
      });
    });
  }

  test('User B rejects an incoming DM voice call and both users return to idle', async ({
    dual,
  }) => {
    const caller = new DmCallPage(dual.pageA);
    const receiver = new DmCallPage(dual.pageB);
    await test.step('User A calls User B', async () => {
      await caller.start();
      await receiver.expectRinging();
    });
    await test.step('User B rejects and both call interfaces close', async () => {
      await receiver.reject();
      await Promise.all([caller.expectIdle(), receiver.expectIdle()]);
    });
    await test.step('User A can call again after rejection', async () => {
      await caller.start();
      await receiver.expectRinging();
      await caller.end();
      await Promise.all([caller.expectIdle(), receiver.expectIdle()]);
    });
  });

  test('User A cancels a ringing DM voice call and the incoming call closes for User B', async ({
    dual,
  }) => {
    const caller = new DmCallPage(dual.pageA);
    const receiver = new DmCallPage(dual.pageB);
    await test.step('User A calls and waits until User B sees the incoming call', async () => {
      await caller.start();
      await receiver.expectRinging();
    });
    await test.step('User A cancels before User B answers', async () => {
      await caller.end();
      await Promise.all([caller.expectIdle(), receiver.expectIdle()]);
    });
    await test.step('User A can call again after cancellation', async () => {
      await caller.start();
      await receiver.expectRinging();
      await receiver.reject();
      await Promise.all([caller.expectIdle(), receiver.expectIdle()]);
    });
  });
});
