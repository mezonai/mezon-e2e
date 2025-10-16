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
}
