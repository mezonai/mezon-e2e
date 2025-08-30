/**
 * Allure Test Configuration
 * This file contains configuration and utilities for Allure reporting integration
 */

import { AllureReporter } from '@/utils/allureHelpers';

export const AllureConfig = {
  // Test categories for better organization
  TestCategories: {
    SMOKE: 'smoke',
    REGRESSION: 'regression',
    CRITICAL: 'critical',
    INTEGRATION: 'integration',
    E2E: 'e2e',
    API: 'api',
    PERFORMANCE: 'performance',
  } as const,

  // Suite definitions
  Suites: {
    CHAT_PLATFORM: 'Chat Platform',
    USER_MANAGEMENT: 'User Management',
    CLAN_MANAGEMENT: 'Clan Management',
    PLATFORM_COMPATIBILITY: 'Platform Compatibility',
    SECURITY: 'Security',
    PERFORMANCE: 'Performance',
  } as const,

  // SubSuite definitions
  SubSuites: {
    // Chat Platform SubSuites
    DIRECT_MESSAGING: 'Direct Messaging',
    GROUP_CHAT: 'Group Chat',
    CHAT_INTERFACE: 'Chat Interface',
    MESSAGE_SYSTEM: 'Message System',

    // User Management SubSuites
    AUTHENTICATION: 'Authentication',
    USER_PROFILE: 'User Profile',
    ROLE_MANAGEMENT: 'Role Management',

    // Clan Management SubSuites
    CLAN_CREATION: 'Clan Creation',
    CLAN_SETTINGS: 'Clan Settings',
    CATEGORY_MANAGEMENT: 'Category Management',
    CHANNEL_MANAGEMENT: 'Channel Management',

    // Platform SubSuites
    BROWSER_SUPPORT: 'Browser Support',
    RESPONSIVE_DESIGN: 'Responsive Design',
    NAVIGATION: 'Navigation',
  } as const,

  // Story definitions
  Stories: {
    // Chat Stories
    TEXT_MESSAGING: 'Text Messaging',
    MEDIA_SHARING: 'Media Sharing',
    EMOJI_SUPPORT: 'Emoji Support',
    MESSAGE_HISTORY: 'Message History',

    // User Stories
    USER_LOGIN: 'User Login',
    PROFILE_SETUP: 'Profile Setup',
    PERMISSION_CONTROL: 'Permission Control',

    // Clan Stories
    CLAN_SETUP: 'Clan Setup',
    MEMBER_MANAGEMENT: 'Member Management',
    CHANNEL_ORGANIZATION: 'Channel Organization',

    // Platform Stories
    CROSS_BROWSER_COMPATIBILITY: 'Cross-Browser Compatibility',
    MOBILE_RESPONSIVENESS: 'Mobile Responsiveness',
  } as const,

  // Severity levels
  Severity: {
    BLOCKER: 'blocker',
    CRITICAL: 'critical',
    NORMAL: 'normal',
    MINOR: 'minor',
    TRIVIAL: 'trivial',
  } as const,

  // Test types
  TestTypes: {
    UNIT: 'unit',
    INTEGRATION: 'integration',
    E2E: 'Website',
    API: 'api',
    PERFORMANCE: 'performance',
    SECURITY: 'security',
    ACCESSIBILITY: 'accessibility',
  } as const,

  // User types for parameterized testing
  UserTypes: {
    ADMIN: 'admin',
    USER: 'user',
    MODERATOR: 'moderator',
    GUEST: 'guest',
    AUTHENTICATED: 'authenticated',
    UNAUTHENTICATED: 'unauthenticated',
  } as const,
};

/**
 * Common test setup configurations for different test scenarios
 */
export const TestSetups = {
  /**
   * Setup for authentication-related tests
   */
  async authenticationTest(options: {
    suite?: string;
    subSuite?: string;
    story?: string;
    severity?: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';
    userType?: string;
  }) {
    await AllureReporter.addLabels({
      suite: options.suite || AllureConfig.Suites.USER_MANAGEMENT,
      subSuite: options.subSuite || AllureConfig.SubSuites.AUTHENTICATION,
      story: options.story || AllureConfig.Stories.USER_LOGIN,
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: options.userType || AllureConfig.UserTypes.UNAUTHENTICATED,
      severity: options.severity || 'critical',
    });
  },

  /**
   * Setup for chat functionality tests
   */
  async chatTest(options: {
    suite?: string;
    subSuite?: string;
    story?: string;
    severity?: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';
    messageType?: string;
    userCount?: number;
  }) {
    await AllureReporter.addLabels({
      suite: options.suite || AllureConfig.Suites.CHAT_PLATFORM,
      subSuite: options.subSuite || AllureConfig.SubSuites.CHAT_INTERFACE,
      story: options.story || AllureConfig.Stories.TEXT_MESSAGING,
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: options.severity || 'normal',
    });

    if (options.messageType) {
      await AllureReporter.addParameter('messageType', options.messageType);
    }

    if (options.userCount) {
      await AllureReporter.addParameter('userCount', options.userCount);
    }
  },

  /**
   * Setup for clan management tests
   */
  async clanTest(options: {
    suite?: string;
    subSuite?: string;
    story?: string;
    severity?: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';
    operation?: string;
  }) {
    await AllureReporter.addLabels({
      suite: options.suite || AllureConfig.Suites.CLAN_MANAGEMENT,
      subSuite: options.subSuite || AllureConfig.SubSuites.CLAN_CREATION,
      story: options.story || AllureConfig.Stories.CLAN_SETUP,
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      userType: AllureConfig.UserTypes.AUTHENTICATED,
      severity: options.severity || 'critical',
    });

    if (options.operation) {
      await AllureReporter.addParameter('operation', options.operation);
    }
  },

  /**
   * Setup for browser compatibility tests
   */
  async compatibilityTest(options: {
    browserName: string;
    viewport?: string;
    deviceType?: string;
    severity?: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';
  }) {
    await AllureReporter.addLabels({
      suite: AllureConfig.Suites.PLATFORM_COMPATIBILITY,
      subSuite: AllureConfig.SubSuites.BROWSER_SUPPORT,
      story: AllureConfig.Stories.CROSS_BROWSER_COMPATIBILITY,
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.E2E,
      severity: options.severity || 'normal',
    });

    // Add browser-specific parameters (excluded from history comparison)
    await AllureReporter.addParameter('browser', options.browserName, { mode: 'hidden' });

    if (options.viewport) {
      await AllureReporter.addParameter('viewport', options.viewport, { mode: 'hidden' });
    }

    if (options.deviceType) {
      await AllureReporter.addParameter('deviceType', options.deviceType);
    }
  },

  /**
   * Setup for performance tests
   */
  async performanceTest(options: {
    suite?: string;
    subSuite?: string;
    scenario?: string;
    expectedThreshold?: number;
  }) {
    await AllureReporter.addLabels({
      suite: options.suite || AllureConfig.Suites.PERFORMANCE,
      subSuite: options.subSuite || 'Performance Testing',
      story: 'Performance Validation',
    });

    await AllureReporter.addTestParameters({
      testType: AllureConfig.TestTypes.PERFORMANCE,
      severity: AllureConfig.Severity.NORMAL,
    });

    if (options.scenario) {
      await AllureReporter.addParameter('scenario', options.scenario);
    }

    if (options.expectedThreshold) {
      await AllureReporter.addParameter('expectedThreshold', options.expectedThreshold);
    }
  },
};

/**
 * Test data generators for parameterized testing
 */
export const TestDataGenerators = {
  /**
   * Generate browser configurations for cross-browser testing
   */
  getBrowserConfigurations() {
    return [
      { name: 'chromium', displayName: 'Chrome', viewport: '1920x1080' },
      { name: 'firefox', displayName: 'Firefox', viewport: '1920x1080' },
      { name: 'webkit', displayName: 'Safari', viewport: '1920x1080' },
    ];
  },

  /**
   * Generate device configurations for responsive testing
   */
  getDeviceConfigurations() {
    return [
      { name: 'desktop', viewport: '1920x1080', userAgent: 'Desktop' },
      { name: 'tablet', viewport: '1024x768', userAgent: 'Tablet' },
      { name: 'mobile', viewport: '375x667', userAgent: 'Mobile' },
    ];
  },

  /**
   * Generate test scenarios for load testing
   */
  getLoadTestScenarios() {
    return [
      { name: 'light_load', userCount: 1, messageCount: 10, duration: 30 },
      { name: 'medium_load', userCount: 3, messageCount: 50, duration: 120 },
      { name: 'heavy_load', userCount: 5, messageCount: 100, duration: 300 },
    ];
  },
};

export default AllureConfig;
