import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import { MezonNotifier } from './mezonNotifier';

class MezonReporter implements Reporter {
  private notifier: MezonNotifier;
  private startTime: Date = new Date();
  private testStats = {
    passed: 0,
    failed: 0,
    skipped: 0,
    flaky: 0,
    total: 0,
  };
  private failedTests: Array<{
    title: string;
    file: string;
    error: string;
    duration: number;
  }> = [];
  private flakyTests: Array<{
    title: string;
    file: string;
    retryCount: number;
    finalStatus: string;
    duration: number;
  }> = [];
  private testSuites: Set<string> = new Set();
  private testFiles: Set<string> = new Set();

  constructor() {
    this.notifier = new MezonNotifier();
  }

  async onBegin(config: FullConfig, suite: Suite): Promise<void> {
    this.startTime = new Date();
    this.testStats.total = suite.allTests().length;

    if (process.env.MEZON_NOTIFY_ON_START === 'true') {
      await this.notifier.sendCronStart('Playwright Test Suite', {
        totalTests: this.testStats.total,
        environment: process.env.NODE_ENV || 'development',
      });
    }
  }

  async onTestBegin(_test: TestCase): Promise<void> {}

  async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    if (test.location?.file) {
      this.testFiles.add(test.location.file);
    }

    const suiteName = test.parent?.title || 'Unknown Suite';
    this.testSuites.add(suiteName);

    const hadRetries = result.retry > 0;
    const finallyPassed = result.status === 'passed';
    const finallyFailed = result.status === 'failed';

    if (hadRetries && finallyPassed) {
      this.testStats.flaky++;
      this.testStats.passed++;
      this.flakyTests.push({
        title: test.title,
        file: test.location?.file || 'Unknown file',
        retryCount: result.retry,
        finalStatus: result.status,
        duration: result.duration,
      });
    } else if (finallyFailed) {
      this.testStats.failed++;
      this.failedTests.push({
        title: test.title,
        file: test.location?.file || 'Unknown file',
        error:
          result.errors.length > 0 ? result.errors[0].message || 'Unknown error' : 'Unknown error',
        duration: result.duration,
      });
    } else if (result.status === 'passed' && !hadRetries) {
      // Test passed on first attempt
      this.testStats.passed++;
    } else if (result.status === 'skipped') {
      this.testStats.skipped++;
    }
  }

  async onEnd(result: FullResult): Promise<void> {
    if (process.env.RUN_PHASE === 'web') {
      console.log(
        'ℹ️ [MezonReporter] Web phase of daily cronjob completed. Skipping intermediate END webhook.'
      );
      return;
    }

    if (process.env.SKIP_INLINE_REPORTER_END === 'true') {
      console.log('ℹ️ [MezonReporter] Deferring END webhook to post-deployment pipeline step.');
      return;
    }

    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();

    if (result.status === 'interrupted') {
      const ranSoFar = this.testStats.passed + this.testStats.failed + this.testStats.skipped;
      const notRan = this.testStats.total - ranSoFar;
      const reportData = {
        status: 'interrupted' as const,
        totalTests: this.testStats.total,
        passed: this.testStats.passed,
        failed: this.testStats.failed,
        skipped: this.testStats.skipped,
        flaky: this.testStats.flaky,
        totalDuration: duration,
        startTime: this.startTime.toISOString(),
        endTime: endTime.toISOString(),
        environment: process.env.NODE_ENV || 'development',
        projectName: 'Mezon E2E Automation',
        failedTests: this.failedTests,
        flakyTests: this.flakyTests,
        testSuites: Array.from(this.testSuites),
        testFiles: Array.from(this.testFiles).map(file => file.split('/').pop() || file),
        workers: process.env.WORKERS || '1',
        notRanTests: notRan,
      };
      await this.notifier.sendInterrupted(reportData);
      return;
    }

    const hasTrulyFailedTests = this.testStats.failed > 0;
    const success = !hasTrulyFailedTests;
    const emoji = success ? '🎉' : '💥';

    const statusMessage = success
      ? 'Test Suite Completed Successfully'
      : 'Test Suite Completed with Issues';

    const reportData = {
      status: hasTrulyFailedTests ? 'failed' : 'passed',
      totalTests: this.testStats.total,
      passed: this.testStats.passed,
      failed: this.testStats.failed,
      skipped: this.testStats.skipped,
      flaky: this.testStats.flaky,
      totalDuration: duration,
      successRate:
        this.testStats.total > 0
          ? Math.round(
              ((this.testStats.passed - this.testStats.flaky) / this.testStats.total) * 100
            )
          : 0,
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      environment: process.env.NODE_ENV || 'development',
      projectName: 'Mezon E2E Automation',
      failedTests: this.failedTests,
      flakyTests: this.flakyTests,
      // Test Suite Information
      testSuites: Array.from(this.testSuites),
      testFiles: Array.from(this.testFiles).map(file => file.split('/').pop() || file),
      browserName: 'Multi-browser',
      workers: process.env.WORKERS || '1',
    };

    if (hasTrulyFailedTests || (this.testStats.failed === 0 && this.testStats.passed > 0)) {
      await this.notifier.send(`${emoji} ${statusMessage}`, reportData);
    }
  }
}

export default MezonReporter;
