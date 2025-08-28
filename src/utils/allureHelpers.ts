import * as allure from 'allure-js-commons';
import { Page, TestInfo } from '@playwright/test';

export class AllureReporter {
  /**
   * Add test parameters with proper options for history tracking
   */
  static async addParameter(
    name: string,
    value: string | number | boolean,
    options?: {
      mode?: 'default' | 'masked' | 'hidden';
      excluded?: boolean;
    }
  ) {
    await allure.parameter(name, String(value), options);
  }

  /**
   * Add environment-specific parameters that should be hidden from comparison
   */
  static async addEnvironmentParameters(params: {
    browser?: string;
    viewport?: string;
    os?: string;
    baseUrl?: string;
    testEnvironment?: string;
    worker?: string;
  }) {
    if (params.browser) {
      await this.addParameter('browser', params.browser, { mode: 'hidden' });
    }
    if (params.viewport) {
      await this.addParameter('viewport', params.viewport, { mode: 'hidden' });
    }
    if (params.os) {
      await this.addParameter('os', params.os, { mode: 'hidden' });
    }
    if (params.baseUrl) {
      await this.addParameter('baseUrl', params.baseUrl, { mode: 'hidden' });
    }
    if (params.testEnvironment) {
      await this.addParameter('environment', params.testEnvironment, { mode: 'hidden' });
    }
    if (params.worker) {
      await this.addParameter('worker', params.worker, { mode: 'hidden' });
    }

    // Add timestamp for unique identification but exclude from history comparison
    await this.addParameter('execution_time', new Date().toISOString(), { excluded: true });
  }

  /**
   * Add test-specific parameters that should be included in history comparison
   */
  static async addTestParameters(params: {
    testType?: string;
    userType?: string;
    dataSet?: string;
    feature?: string;
    severity?: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';
  }) {
    if (params.testType) {
      await this.addParameter('testType', params.testType);
    }
    if (params.userType) {
      await this.addParameter('userType', params.userType);
    }
    if (params.dataSet) {
      await this.addParameter('dataSet', params.dataSet);
    }
    if (params.feature) {
      await this.addParameter('feature', params.feature);
    }
    if (params.severity) {
      await allure.severity(params.severity);
    }
  }

  /**
   * Add links to external systems
   */
  static async addLinks(links: {
    jira?: string;
    testRail?: string;
    requirement?: string;
    documentation?: string;
  }) {
    if (links.jira) {
      await allure.link(links.jira, 'JIRA', 'issue');
    }
    if (links.testRail) {
      await allure.link(links.testRail, 'TestRail', 'tms');
    }
    if (links.requirement) {
      await allure.link(links.requirement, 'Requirement', 'custom');
    }
    if (links.documentation) {
      await allure.link(links.documentation, 'Documentation', 'custom');
    }
  }

  /**
   * Add test labels for better categorization
   */
  static async addLabels(labels: {
    epic?: string;
    feature?: string;
    story?: string;
    suite?: string;
    subSuite?: string;
    owner?: string;
    tag?: string[];
  }) {
    if (labels.epic) {
      await allure.epic(labels.epic);
    }
    if (labels.feature) {
      await allure.feature(labels.feature);
    }
    if (labels.story) {
      await allure.story(labels.story);
    }
    if (labels.suite) {
      await allure.suite(labels.suite);
    }
    if (labels.subSuite) {
      await allure.subSuite(labels.subSuite);
    }
    if (labels.owner) {
      await allure.owner(labels.owner);
    }
    if (labels.tag) {
      for (const tag of labels.tag) {
        await allure.tag(tag);
      }
    }
  }

  /**
   * Add test description with markdown support
   */
  static async addDescription(description: string) {
    await allure.description(description);
  }

  /**
   * Add test step with automatic timing
   */
  static async step<T>(name: string, body: () => Promise<T>): Promise<T> {
    return await allure.step(name, body);
  }

  /**
   * Attach screenshot with proper naming
   */
  static async attachScreenshot(page: Page, name?: string) {
    const screenshot = await page.screenshot({ fullPage: true });
    await allure.attachment(name || 'Screenshot', screenshot, 'image/png');
  }

  /**
   * Attach video recording
   */
  static async attachVideo(videoPath: string, name?: string) {
    await allure.attachmentPath(name || 'Video Recording', videoPath, 'video/webm');
  }

  /**
   * Attach trace file
   */
  static async attachTrace(tracePath: string, name?: string) {
    await allure.attachmentPath(name || 'Trace', tracePath, 'application/zip');
  }

  /**
   * Generate unique test ID based on test info
   */
  static generateTestId(testInfo: {
    title: string;
    file: string;
    project?: string;
    parameters?: Record<string, string | number | boolean>;
  }): string {
    const baseId = `${testInfo.file}:${testInfo.title}`;
    const paramString = testInfo.parameters
      ? Object.entries(testInfo.parameters)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => `${key}=${value}`)
          .join('|')
      : '';

    const fullId = paramString ? `${baseId}[${paramString}]` : baseId;
    return fullId;
  }

  /**
   * Initialize test with common Allure metadata
   */
  static async initializeTest(
    page: Page,
    testInfo: TestInfo,
    options?: {
      epic?: string;
      feature?: string;
      story?: string;
      severity?: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';
      testType?: string;
      userType?: string;
    }
  ) {
    // Add common environment parameters
    await this.addEnvironmentParameters({
      browser: testInfo.project.name,
      viewport: `${page.viewportSize()?.width}x${page.viewportSize()?.height}`,
      os: process.platform,
      baseUrl: page.url(),
      testEnvironment: process.env.CI ? 'CI' : 'Local',
      worker: testInfo.workerIndex.toString(),
    });

    // Add project-specific labels
    await this.addLabels({
      suite: testInfo.project.name,
      owner: 'Mezon QA Team',
      epic: options?.epic,
      feature: options?.feature,
      story: options?.story,
    });

    // Add test parameters
    if (options?.testType || options?.userType || options?.severity) {
      await this.addTestParameters({
        testType: options.testType,
        userType: options.userType,
        severity: options.severity,
      });
    }

    // Generate and set unique test case ID
    const testId = this.generateTestId({
      title: testInfo.title,
      file: testInfo.file,
      project: testInfo.project.name,
    });

    await allure.testCaseId(testId);
  }
}
