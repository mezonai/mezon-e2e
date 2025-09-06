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
    total: 0,
  };
  private failedTests: Array<{
    title: string;
    file: string;
    error: string;
    duration: number;
  }> = [];
  private testSuites: Set<string> = new Set();
  private testFiles: Set<string> = new Set();

  constructor() {
    // console.log('[Mezon] MezonReporter constructor called');
    this.notifier = new MezonNotifier();
  }

  async onBegin(config: FullConfig, suite: Suite): Promise<void> {
    // console.log('[Mezon] onBegin called - Test suite starting');
    this.startTime = new Date();
    this.testStats.total = suite.allTests().length;

    // Send simple start notification
    // await this.notifier.send('🚀 Playwright test suite started', {
    //     totalTests: this.testStats.total,
    //     environment: process.env.NODE_ENV || 'development'
    // });

    // console.log(`[Mezon] Test suite started with ${this.testStats.total} tests`);
  }

  async onTestBegin(test: TestCase): Promise<void> {
    // console.log(`[Mezon] Starting test: ${test.title}`);
  }

  async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    // Collect test suite and file information
    if (test.location?.file) {
      this.testFiles.add(test.location.file);
    }

    // Get test suite name from the parent suite
    const suiteName = test.parent?.title || 'Unknown Suite';
    this.testSuites.add(suiteName);

    // Update statistics
    switch (result.status) {
      case 'passed':
        this.testStats.passed++;
        break;
      case 'failed':
        this.testStats.failed++;
        // Store failed test details for final report
        this.failedTests.push({
          title: test.title,
          file: test.location?.file || 'Unknown file',
          error:
            result.errors.length > 0
              ? result.errors[0].message || 'Unknown error'
              : 'Unknown error',
          duration: result.duration,
        });
        break;
      case 'skipped':
        this.testStats.skipped++;
        break;
    }

    const statusEmoji = this.getStatusEmoji(result.status);
    const statusText = result.status.toUpperCase();

    // console.log(`[Mezon] Finished test: ${test.title} - ${statusText}`);

    // No individual test notifications - only final report
  }

  async onEnd(result: FullResult): Promise<void> {
    // console.log('[Mezon] onEnd called - Test suite finished');
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();
    const success = result.status === 'passed';
    const emoji = success ? '🎉' : '💥';

    const statusMessage = success
      ? 'Test Suite Completed Successfully'
      : 'Test Suite Completed with Issues';

    // Prepare comprehensive final report data
    const reportData = {
      status: result.status,
      totalTests: this.testStats.total,
      passed: this.testStats.passed,
      failed: this.testStats.failed,
      skipped: this.testStats.skipped,
      totalDuration: duration,
      successRate:
        this.testStats.total > 0
          ? Math.round((this.testStats.passed / this.testStats.total) * 100)
          : 0,
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      environment: process.env.NODE_ENV || 'development',
      projectName: 'Mezon E2E Automation',
      failedTests: this.failedTests,
      // Test Suite Information
      testSuites: Array.from(this.testSuites),
      testFiles: Array.from(this.testFiles).map(file => file.split('/').pop() || file),
      browserName: 'Multi-browser',
      workers: process.env.WORKERS || '1',
    };

    await this.notifier.send(`${emoji} ${statusMessage}`, reportData);

    // console.log(`[Mezon] Test run completed: ${result.status}`);
    // console.log(
    //   `[Mezon] Results: ${this.testStats.passed} passed, ${this.testStats.failed} failed, ${this.testStats.skipped} skipped`
    // );
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'passed':
        return '✅';
      case 'failed':
        return '❌';
      case 'skipped':
        return '⏭️';
      case 'timedOut':
        return '⏰';
      default:
        return '❓';
    }
  }

  private shouldNotifyProgress(): boolean {
    const completed = this.testStats.passed + this.testStats.failed + this.testStats.skipped;
    const total = this.testStats.total;

    // Notify every 25% completion or for every 10 tests (whichever is smaller)
    const quarterMark = Math.ceil(total * 0.25);
    const tenTestMark = 10;
    const notifyInterval = Math.min(quarterMark, tenTestMark);

    return completed > 0 && completed % notifyInterval === 0;
  }
}

export default MezonReporter;
