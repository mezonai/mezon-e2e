import { AccountCredentials, WEBSITE_CONFIGS } from '@/config/environment';
import { ClanFactory } from '@/data/factories/ClanFactory';
import type { DualProvider } from '@/fixtures/dual.fixture';
import { ClanPage } from '@/pages/Clan/ClanPage';
import { FriendPage } from '@/pages/FriendPage';
import { ROUTES } from '@/selectors';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';
import { ClanSetupHelper } from '@/utils/clanSetupHelper';
import { getUsernamesFromEmails, setupDualUsersSequentially } from '@/utils/dualTestHelper';
import { FriendHelper } from '@/utils/friend.helper';
import joinUrlPaths from '@/utils/joinUrlPaths';
import { expect } from '@playwright/test';

export const UI_STRESS_ACCOUNT_A = AccountCredentials['account2-1'];
export const UI_STRESS_ACCOUNT_B = AccountCredentials['account2-2'];
export const [UI_STRESS_USERNAME_A, UI_STRESS_USERNAME_B] = getUsernamesFromEmails([
  UI_STRESS_ACCOUNT_A.email,
  UI_STRESS_ACCOUNT_B.email,
]);

export type UiStressEnvironment = {
  clanFactory: ClanFactory;
  clanPageA: ClanPage;
  clanPageB: ClanPage;
  primaryChannel: string;
  secondaryChannel: string;
  runId: string;
};

export async function prepareUiStressEnvironment(
  dual: DualProvider,
  clanFactory: ClanFactory
): Promise<UiStressEnvironment> {
  const directFriendsUrl = joinUrlPaths(WEBSITE_CONFIGS.MEZON.baseURL, ROUTES.DIRECT_FRIENDS);
  await setupDualUsersSequentially(
    dual,
    UI_STRESS_ACCOUNT_A,
    UI_STRESS_ACCOUNT_B,
    directFriendsUrl
  );

  const friendPageA = new FriendPage(dual.pageA);
  const friendPageB = new FriendPage(dual.pageB);
  await Promise.allSettled([
    friendPageA.unblockFriend(UI_STRESS_USERNAME_B),
    friendPageB.unblockFriend(UI_STRESS_USERNAME_A),
  ]);
  await FriendHelper.cleanupMutualFriendRelationships(
    friendPageA,
    friendPageB,
    UI_STRESS_USERNAME_A,
    UI_STRESS_USERNAME_B
  );
  await friendPageA.sendFriendRequestToUser(UI_STRESS_USERNAME_B);
  await friendPageA.verifySentRequestToast();
  await friendPageB.verifyReceivedRequestToast(
    `${UI_STRESS_USERNAME_A} wants to add you as a friend`
  );
  await friendPageB.acceptFirstFriendRequest();
  await Promise.all([
    friendPageA.createDM(UI_STRESS_USERNAME_B),
    friendPageB.createDM(UI_STRESS_USERNAME_A),
  ]);

  const clanPageA = new ClanPage(dual.pageA);
  const clanPageB = new ClanPage(dual.pageB);
  await clanFactory.setupClan(ClanSetupHelper.configs.channelMessage3, dual.pageA);
  const runId = Date.now().toString(36);
  const primaryChannel = `stress-a-${runId}`.slice(0, 20);
  const secondaryChannel = `stress-b-${runId}`.slice(0, 20);
  expect(
    await clanPageA.createNewChannel(ChannelType.TEXT, primaryChannel, ChannelStatus.PUBLIC)
  ).toBe(true);
  expect(
    await clanPageA.createNewChannel(ChannelType.TEXT, secondaryChannel, ChannelStatus.PUBLIC)
  ).toBe(true);

  await clanPageA.clickButtonInvitePeopleFromMenu();
  const inviteUrl = await clanPageA.inviteUserToClanByUsername(UI_STRESS_USERNAME_B);
  await clanPageB.joinClanByUrlInvite(inviteUrl);
  await clanPageA.openChannelByName(primaryChannel);
  await clanPageB.openChannelByName(primaryChannel);

  return { clanFactory, clanPageA, clanPageB, primaryChannel, secondaryChannel, runId };
}
