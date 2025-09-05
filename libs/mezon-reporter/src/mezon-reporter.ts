import type {
    FullConfig, FullResult, Reporter, Suite, TestCase, TestResult
} from '@playwright/test/reporter';
import { MezonNotifier } from './mezonNotifier';

class MezonReporter implements Reporter {
    private notifier: MezonNotifier;
    private startTime: Date = new Date();
    private testStats = {
        passed: 0,
        failed: 0,
        skipped: 0,
        total: 0
    };

    constructor() {
        this.notifier = new MezonNotifier();
    }

    async onBegin(config: FullConfig, suite: Suite): Promise<void> {
        this.startTime = new Date();
        this.testStats.total = suite.allTests().length;

        await this.notifier.send('🚀 Playwright test suite started', {
            totalTests: this.testStats.total,
            environment: process.env.NODE_ENV || 'development',
            workers: config.workers
        });
    }

    async onTestBegin(test: TestCase): Promise<void> {
        console.log(`[Mezon] Starting test: ${test.title}`);
    }

    async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
        // Update statistics
        switch (result.status) {
            case 'passed':
                this.testStats.passed++;
                break;
            case 'failed':
                this.testStats.failed++;
                break;
            case 'skipped':
                this.testStats.skipped++;
                break;
        }

        const statusEmoji = this.getStatusEmoji(result.status);
        const statusText = result.status.toUpperCase();

        console.log(`[Mezon] Finished test: ${test.title} - ${statusText}`);

        // Send notification for failed tests or important milestones
        if (result.status === 'failed' || this.shouldNotifyProgress()) {
            await this.notifier.send(`${statusEmoji} ${statusText}: ${test.title}`, {
                file: test.location?.file,
                duration: result.duration,
                status: result.status,
                error: result.errors.length > 0 ? result.errors[0].message : undefined,
                progress: `${this.testStats.passed + this.testStats.failed + this.testStats.skipped}/${this.testStats.total}`
            });
        }
    }

    async onEnd(result: FullResult): Promise<void> {
        const duration = Date.now() - this.startTime.getTime();
        const success = result.status === 'passed';
        const emoji = success ? '🎉' : '💥';

        await this.notifier.send(`${emoji} Playwright test suite finished`, {
            status: result.status,
            totalTests: this.testStats.total,
            passed: this.testStats.passed,
            failed: this.testStats.failed,
            skipped: this.testStats.skipped,
            duration: duration,
            successRate: this.testStats.total > 0 ? Math.round((this.testStats.passed / this.testStats.total) * 100) : 0
        });

        console.log(`[Mezon] Test run completed: ${result.status}`);
        console.log(`[Mezon] Results: ${this.testStats.passed} passed, ${this.testStats.failed} failed, ${this.testStats.skipped} skipped`);
    }

    private getStatusEmoji(status: string): string {
        switch (status) {
            case 'passed': return '✅';
            case 'failed': return '❌';
            case 'skipped': return '⏭️';
            case 'timedOut': return '⏰';
            default: return '❓';
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