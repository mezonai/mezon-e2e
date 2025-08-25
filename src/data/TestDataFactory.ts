import { AllureReporter } from '@/utils/allureHelpers';

export interface TestUser {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'moderator';
  displayName: string;
}

export interface TestData {
  users: TestUser[];
  testEnvironment: string;
  browserConfig: {
    name: string;
    viewport: string;
  };
}

export class TestDataFactory {
  /**
   * Generate test users with different roles for parameterized testing
   */
  static getTestUsers(): TestUser[] {
    return [
      {
        username: 'admin_user',
        email: 'admin@mezon.test',
        password: 'AdminPass123!',
        role: 'admin',
        displayName: 'Admin User',
      },
      {
        username: 'regular_user',
        email: 'user@mezon.test',
        password: 'UserPass123!',
        role: 'user',
        displayName: 'Regular User',
      },
      {
        username: 'moderator_user',
        email: 'mod@mezon.test',
        password: 'ModPass123!',
        role: 'moderator',
        displayName: 'Moderator User',
      },
    ];
  }

  /**
   * Get test scenarios for parameterized testing
   */
  static getTestScenarios() {
    return [
      {
        name: 'desktop_chrome',
        viewport: '1920x1080',
        userAgent: 'Chrome Desktop',
        parameters: { device: 'desktop', browser: 'chrome' },
      },
      {
        name: 'tablet_chrome',
        viewport: '1024x768',
        userAgent: 'Chrome Tablet',
        parameters: { device: 'tablet', browser: 'chrome' },
      },
      {
        name: 'mobile_chrome',
        viewport: '375x667',
        userAgent: 'Chrome Mobile',
        parameters: { device: 'mobile', browser: 'chrome' },
      },
    ];
  }

  /**
   * Get test data sets for different chat scenarios
   */
  static getChatTestData() {
    return [
      {
        scenario: 'text_message',
        messageType: 'text',
        content: 'Hello, this is a test message!',
        parameters: { messageType: 'text', contentLength: 'short' },
      },
      {
        scenario: 'long_text_message',
        messageType: 'text',
        content:
          'This is a very long message that tests how the chat interface handles longer text content. '.repeat(
            5
          ),
        parameters: { messageType: 'text', contentLength: 'long' },
      },
      {
        scenario: 'emoji_message',
        messageType: 'emoji',
        content: '🎉 🚀 🎯 ✨ 🔥',
        parameters: { messageType: 'emoji', contentLength: 'short' },
      },
      {
        scenario: 'code_block',
        messageType: 'code',
        content: '```javascript\nconsole.log("Hello World!");\n```',
        parameters: { messageType: 'code', contentLength: 'medium' },
      },
    ];
  }

  /**
   * Setup parameterized test with Allure reporting
   */
  static async setupParameterizedTest(
    testName: string,
    parameters: Record<string, string | number | boolean>,
    options?: {
      epic?: string;
      feature?: string;
      story?: string;
      severity?: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';
    }
  ) {
    // Add test parameters for Allure
    for (const [key, value] of Object.entries(parameters)) {
      await AllureReporter.addParameter(key, String(value));
    }

    // Add test metadata
    if (options) {
      await AllureReporter.addLabels({
        epic: options.epic,
        feature: options.feature,
        story: options.story,
      });

      if (options.severity) {
        await AllureReporter.addTestParameters({
          severity: options.severity,
        });
      }
    }

    // Add unique test identifier
    const paramString = Object.entries(parameters)
      .map(([key, value]) => `${key}=${value}`)
      .join('_');

    await AllureReporter.addParameter('test_variant', `${testName}_${paramString}`, {
      excluded: true,
    });
  }
}
