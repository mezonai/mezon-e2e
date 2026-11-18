import { FriendPage } from '@/pages/FriendPage';

export class FriendHelper {
  static async cleanupMutualFriendRelationships(
    friendPageA: FriendPage,
    friendPageB: FriendPage,
    userNameA: string,
    userNameB: string
  ): Promise<void> {
    await friendPageA.cleanupFriendRelationships(userNameB);
    await friendPageB.cleanupFriendRelationships(userNameA);
  }

  static async ensureMutualFriends(
    friendPageA: FriendPage,
    friendPageB: FriendPage,
    userNameA: string,
    userNameB: string
  ): Promise<void> {
    const [isFriendA, isFriendB] = await Promise.all([
      friendPageA.checkFriendExists(userNameB).catch(() => false),
      friendPageB.checkFriendExists(userNameA).catch(() => false),
    ]);

    if (!isFriendA || !isFriendB) {
      await Promise.allSettled([
        friendPageA.unblockFriend(userNameB),
        friendPageB.unblockFriend(userNameA),
      ]);
      await this.cleanupMutualFriendRelationships(friendPageA, friendPageB, userNameA, userNameB);
      await friendPageA.sendFriendRequestToUser(userNameB);
      await friendPageA.verifySentRequestToast();
      await friendPageB.acceptFirstFriendRequest();
      await friendPageA.assertAllFriend(userNameB);
      await friendPageB.assertAllFriend(userNameA);
    }

    await Promise.all([friendPageA.createDM(userNameB), friendPageB.createDM(userNameA)]);
  }
}
