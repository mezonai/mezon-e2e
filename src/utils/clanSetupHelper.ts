export interface ClanSetupConfig {
  clanNamePrefix?: string;
  suiteName?: string;
}

export class ClanSetupHelper {
  private constructor() {}

  /**
   * Creates a setup configuration for different test scenarios
   */
  static createConfig(overrides: Partial<ClanSetupConfig> = {}): ClanSetupConfig {
    return {
      clanNamePrefix: 'TestClan',
      suiteName: 'Test Suite',
      ...overrides,
    };
  }

  /**
   * Predefined configurations for common test scenarios
   */
  static readonly configs = {
    channelMessage1: ClanSetupHelper.createConfig({
      clanNamePrefix: 'MessageTestClan',
      suiteName: 'Channel Message - Module 1',
    }),

    channelMessage2: ClanSetupHelper.createConfig({
      clanNamePrefix: 'MessageTestClan',
      suiteName: 'Channel Message - Module 2',
    }),

    channelMessage3: ClanSetupHelper.createConfig({
      clanNamePrefix: 'MessageTestClan',
      suiteName: 'Channel Message - Module 3',
    }),

    channelMessage4: ClanSetupHelper.createConfig({
      clanNamePrefix: 'MessageTestClan',
      suiteName: 'Channel Message - Module 4',
    }),

    channelMessage5: ClanSetupHelper.createConfig({
      clanNamePrefix: 'MessageTestClan',
      suiteName: 'Channel Message - Module 5',
    }),

    channelMessage6: ClanSetupHelper.createConfig({
      clanNamePrefix: 'MessageTestClan',
      suiteName: 'Channel Message - Module 6',
    }),

    channelMessage7: ClanSetupHelper.createConfig({
      clanNamePrefix: 'MessageTestClan',
      suiteName: 'Channel Message - Module 7',
    }),

    channelMessage8: ClanSetupHelper.createConfig({
      clanNamePrefix: 'MessageTestClan',
      suiteName: 'Channel Message - Module 8',
    }),

    channelMessage9: ClanSetupHelper.createConfig({
      clanNamePrefix: 'MessageTestClan',
      suiteName: 'Channel Message - Module 9',
    }),

    clanManagement: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ClanManagementTest',
      suiteName: 'Clan Management',
    }),

    clanManagement2: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ClanManagementTest',
      suiteName: 'Clan Management - Module 2',
    }),
    clanManagement3: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ClanManagementTest',
      suiteName: 'Clan Management - Module 3',
    }),
    clanManagement4: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ClanManagementTest',
      suiteName: 'Clan Management - Module 4',
    }),

    channelManagement: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ChannelMgmtTest',
      suiteName: 'Channel Management',
    }),

    onboarding: ClanSetupHelper.createConfig({
      clanNamePrefix: 'OnboardingTest',
      suiteName: 'Onboarding Guide',
    }),

    uploadFile: ClanSetupHelper.createConfig({
      clanNamePrefix: 'UploadFileTest',
      suiteName: 'Upload File',
    }),

    uploadFile2: ClanSetupHelper.createConfig({
      clanNamePrefix: 'UploadFileTest',
      suiteName: 'Upload File - Module 2',
    }),

    uploadFile3: ClanSetupHelper.createConfig({
      clanNamePrefix: 'UploadFileTest',
      suiteName: 'Upload File - Module 3',
    }),

    uploadFile4: ClanSetupHelper.createConfig({
      clanNamePrefix: 'UploadFileTest',
      suiteName: 'Upload File - Module 4',
    }),

    userProfile: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ProfileTest',
      suiteName: 'User Profile',
    }),

    userProfileUserSetting: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ProfileTest',
      suiteName: 'User Profile - User Setting',
    }),

    clanProfile: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ProfileTest',
      suiteName: 'Clan Profile',
    }),

    clanProfile2: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ProfileTest',
      suiteName: 'Clan Profile - Module 2',
    }),

    userProfile1: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ProfileTest1',
      suiteName: 'User Profile - Module 1',
    }),

    threadManagement: ClanSetupHelper.createConfig({
      clanNamePrefix: 'ThreadMgmtTest',
      suiteName: 'Thread Management',
    }),
    standaloneClanManagement: ClanSetupHelper.createConfig({
      clanNamePrefix: 'StandaloneClanManagementTest',
      suiteName: 'Standalone - Clan Management',
    }),

    directMessage: ClanSetupHelper.createConfig({
      clanNamePrefix: 'DirectMessageTest',
      suiteName: 'Direct Message',
    }),

    directMessage1: ClanSetupHelper.createConfig({
      clanNamePrefix: 'DirectMessageTest',
      suiteName: 'Direct Message 1',
    }),

    topicMessage: ClanSetupHelper.createConfig({
      clanNamePrefix: 'TopicMessageTest',
      suiteName: 'Topic Message',
    }),

    blockUser: ClanSetupHelper.createConfig({
      clanNamePrefix: 'BlockUserTest',
      suiteName: 'Block User',
    }),

    memberManagement: ClanSetupHelper.createConfig({
      clanNamePrefix: 'MemberManagementTest',
      suiteName: 'Member Management',
    }),

    createCategory: ClanSetupHelper.createConfig({
      clanNamePrefix: 'CreateCategoryTest',
      suiteName: 'Create Category',
    }),

    markAsRead: ClanSetupHelper.createConfig({
      clanNamePrefix: 'MarkAsReadTest',
      suiteName: 'Mark As Read',
    }),

    timeline: ClanSetupHelper.createConfig({
      clanNamePrefix: 'TimeLineTest',
      suiteName: 'Timeline',
    }),
  };
}
