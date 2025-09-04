import { Page, TestInfo } from '@playwright/test';
import * as allure from 'allure-js-commons';

export class AllureReporter {
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

    await this.addParameter('execution_time', new Date().toISOString(), { excluded: true });
  }

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

  static async addWorkItemLinks(links: { github_issue?: string; parrent_issue?: string; tms?: string }) {
    if (links.github_issue) {
      await allure.issue(links.github_issue);
    }
    if (links.parrent_issue) {
      await allure.link(links.tms || '', 'Parent Issue', 'issue');
    }
    if (links.tms) {
      await allure.tms(links.tms);
    }
  }

  static async addLabels(labels: {
    parentSuite?: string;
    epic?: string;
    feature?: string;
    story?: string;
    suite?: string;
    subSuite?: string;
    owner?: string;
    tag?: string[];
  }) {
    if (labels.parentSuite) {
      await allure.parentSuite(labels.parentSuite);
    }
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

  static async addDescription(description: string) {
    await allure.description(description);
  }

  static async step<T>(name: string, body: () => Promise<T>): Promise<T> {
    return await allure.step(name, body);
  }

  static async attachScreenshot(page: Page, name?: string) {
    const screenshot = await page.screenshot({ fullPage: true });
    await allure.attachment(name || 'Screenshot', screenshot, 'image/png');
  }

  static async attachVideo(videoPath: string, name?: string) {
    await allure.attachmentPath(name || 'Video Recording', videoPath, 'video/webm');
  }

  static async attachTrace(tracePath: string, name?: string) {
    await allure.attachmentPath(name || 'Trace', tracePath, 'application/zip');
  }

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

  static async initializeTest(
    page: Page,
    testInfo: TestInfo,
    options?: {
      suite?: string;
      subSuite?: string;
      story?: string;
      severity?: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';
      testType?: string;
      userType?: string;
    }
  ) {
    await this.addEnvironmentParameters({
      browser: testInfo.project.name,
      viewport: `${page.viewportSize()?.width}x${page.viewportSize()?.height}`,
      os: process.platform,
      baseUrl: page.url(),
      testEnvironment: process.env.CI ? 'CI' : 'Local',
      worker: testInfo.workerIndex.toString(),
    });

    await this.addLabels({
      parentSuite: testInfo.project.name,
      suite: undefined,
      subSuite: undefined,
      owner: 'Mezon QA Team',
      story: options?.story,
    });

    if (options?.suite) {
      await allure.label('package', '');
      await allure.label('testClass', options.suite);
    }

    if (options?.testType || options?.userType || options?.severity) {
      await this.addTestParameters({
        testType: options.testType,
        userType: options.userType,
        severity: options.severity,
      });
    }

    const testId = this.generateTestId({
      title: testInfo.title,
      file: testInfo.file,
      project: testInfo.project.name,
    });

    await allure.testCaseId(testId);
  }
}
