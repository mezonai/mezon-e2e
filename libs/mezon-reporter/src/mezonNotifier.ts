export interface NotificationPayload {
    totalTests?: number;
    file?: string;
    duration?: number;
    status?: string;
    timestamp?: string;
    environment?: string;
    project?: string;
    workers?: number | string;
    timeout?: number;
    retries?: number;
    error?: string;
    progress?: string;
    passed?: number;
    failed?: number;
    skipped?: number;
    successRate?: number;
    projectName?: string;
    testTitle?: string;
    testFile?: string;
    browserName?: string;
    startTime?: string;
    endTime?: string;
    totalDuration?: number;
    testSuites?: string[];
    testFiles?: string[];
    failedTests?: Array<{
        title: string;
        file: string;
        error: string;
        duration: number;
    }>;
}

export class MezonNotifier {
    private webhookUrl?: string;
    private isEnabled: boolean;
    private mentionUserId?: string;

    constructor() {
        // Try multiple sources for configuration
        this.webhookUrl = process.env.MEZON_WEBHOOK_URL || 
                          'https://webhook.mezon.ai/webhooks/1963795411474845696/MTc1NzA0MDQzNjIzMTIxMDQyMToxOTYzNzk1NDExNDQxMjkxMjY0OjE5NjM3OTU0MTE0NzQ4NDU2OTY6MTk2Mzc5NTkxNDk1NDkwMzU1Mg.WN2z14gmUwOIwm2leyp_c1WcD8E4aDz3ikMwUowCAa4';
        
        // Enable by default if webhook is available, unless explicitly disabled
        this.isEnabled = process.env.MEZON_NOTIFICATIONS !== 'false' && !!this.webhookUrl;
        this.mentionUserId = process.env.MEZON_MENTION_USER_ID || '1840655335266717696';
        
        // Debug logging
        console.log('[Mezon] Reporter initialized');
        console.log('[Mezon] Webhook URL configured:', !!this.webhookUrl);
        console.log('[Mezon] Notifications enabled:', this.isEnabled);
        console.log('[Mezon] Running in:', process.env.NODE_ENV || 'unknown environment');
        if (!this.webhookUrl) {
            console.log('[Mezon] To enable notifications, set MEZON_WEBHOOK_URL environment variable');
        }
    }

    async send(message: string, payload?: NotificationPayload): Promise<void> {
        console.log('[Mezon] Attempting to send notification:', message);
        
        if (!this.isEnabled) {
            console.log(`[Mezon] Notifications disabled. Message: ${message}`);
            if (payload) {
                console.log('[Mezon] Payload:', JSON.stringify(payload, null, 2));
            }
            return;
        }

        try {
            const enrichedPayload = {
                ...payload,
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                project: 'Mezon E2E Tests',
            };

            // Check if this is a simple start message or detailed final report
            const isSimpleMessage = message.includes('started') || message.includes('🚀');
            const messageToSend = isSimpleMessage ? 
                this.formatSimpleMessage(message, enrichedPayload) : 
                this.formatDetailedMessage(message, enrichedPayload);
                
            const body = this.createMezonWebhookPayload(messageToSend);

            console.log(`[Mezon] Sending ${isSimpleMessage ? 'simple' : 'detailed'} notification...`);

            const response = await fetch(this.webhookUrl!, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                console.warn(`[Mezon] Failed to send notification: ${response.status} ${response.statusText}`);
            } else {
                console.log(`[Mezon] Notification sent successfully`);
            }
        } catch (error) {
            console.warn('[Mezon] Error sending notification:', error);
        }
    }

    private formatSimpleMessage(message: string, payload: NotificationPayload): string {
        const timestamp = new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        let simpleMessage = `${message}\n`;
        simpleMessage += `⏰ ${timestamp} (GMT+7)\n`;
        
        if (payload.totalTests !== undefined) {
            simpleMessage += `📊 Total Tests: ${payload.totalTests}\n`;
        }
        
        simpleMessage += `🌍 Environment: ${payload.environment || 'development'}\n`;

        simpleMessage += `⏳ In progress...\n`;

        return simpleMessage;
    }

    private formatDetailedMessage(message: string, payload: NotificationPayload): string {
        const timestamp = new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        let detailedMessage = `🤖 **PLAYWRIGHT AUTOMATION REPORT**\n`;
        detailedMessage += `⏰ **Time:** ${timestamp} (GMT+7)\n`;
        detailedMessage += `🎯 **Status:** ${message}\n\n`;

        // Environment Information
        detailedMessage += `📋 **ENVIRONMENT INFO**\n`;
        detailedMessage += `🌍 Environment: ${payload.environment || 'development'}\n`;
        detailedMessage += `🏢 Project: ${payload.project || 'Mezon E2E Tests'}\n`;
        if (payload.workers) {
            detailedMessage += `👥 Workers: ${payload.workers}\n`;
        }
        detailedMessage += `🖥️ Platform: ${process.platform}\n`;
        detailedMessage += `📦 Node Version: ${process.version}\n\n`;

        // Test Suite Information
        if (payload.totalTests !== undefined) {
            detailedMessage += `📊 **TEST SUITE INFO**\n`;
            detailedMessage += `📝 Total Tests: ${payload.totalTests}\n`;
            
            // Add test suites information
            if (payload.testSuites && payload.testSuites.length > 0) {
                detailedMessage += `🧪 Test Suites: ${payload.testSuites.join(', ')}\n`;
            }
            
            // Add test files information
            if (payload.testFiles && payload.testFiles.length > 0) {
                const fileCount = payload.testFiles.length;
                const fileList = fileCount <= 5 ? payload.testFiles.join(', ') : 
                    `${payload.testFiles.slice(0, 5).join(', ')} and ${fileCount - 5} more`;
                detailedMessage += `📁 Test Files (${fileCount}): ${fileList}\n`;
            }
            
            if (payload.progress) {
                detailedMessage += `📈 Progress: ${payload.progress}\n`;
            }
            
            if (payload.totalDuration !== undefined) {
                detailedMessage += `⏱️ Total Duration: ${this.formatDuration(payload.totalDuration)}\n`;
            }
            detailedMessage += `\n`;
        }

        // Individual Test Information
        if (payload.testTitle) {
            detailedMessage += `🧪 **TEST DETAILS**\n`;
            detailedMessage += `📋 Test: ${payload.testTitle}\n`;
            
            if (payload.testFile) {
                detailedMessage += `📁 File: ${this.getFileName(payload.testFile)}\n`;
            }
            
            if (payload.duration !== undefined) {
                detailedMessage += `⏱️ Duration: ${this.formatDuration(payload.duration)}\n`;
            }
            
            if (payload.browserName) {
                detailedMessage += `🌐 Browser: ${payload.browserName}\n`;
            }
            detailedMessage += `\n`;
        }

        // Error Information
        if (payload.error) {
            detailedMessage += `❌ **ERROR DETAILS**\n`;
            detailedMessage += `🔍 Error: ${this.truncateText(payload.error, 300)}\n\n`;
        }

        // Test Results Summary
        if (payload.passed !== undefined || payload.failed !== undefined || payload.skipped !== undefined) {
            detailedMessage += `📈 **RESULTS SUMMARY**\n`;
            
            const passed = payload.passed || 0;
            const failed = payload.failed || 0;
            const skipped = payload.skipped || 0;
            const total = passed + failed + skipped;
            
            detailedMessage += `✅ Passed: ${passed} tests\n`;
            detailedMessage += `❌ Failed: ${failed} tests\n`;
            detailedMessage += `⏭️ Skipped: ${skipped} tests\n`;
            detailedMessage += `📊 Total: ${total} tests\n`;
            
            if (payload.successRate !== undefined) {
                const rateEmoji = payload.successRate >= 90 ? '🎯' : payload.successRate >= 70 ? '⚠️' : '🚨';
                detailedMessage += `${rateEmoji} Success Rate: ${payload.successRate}%\n`;
            }
            
            // Performance indicators
            if (payload.totalDuration !== undefined && total > 0) {
                const avgDuration = payload.totalDuration / total;
                detailedMessage += `📊 Avg Test Duration: ${this.formatDuration(avgDuration)}\n`;
            }
            detailedMessage += `\n`;
        }

        // Failed Tests Details
        if (payload.failedTests && payload.failedTests.length > 0) {
            detailedMessage += `🚨 **FAILED TESTS DETAILS**\n`;
            payload.failedTests.forEach((failedTest, index) => {
                detailedMessage += `\n${index + 1}. **${failedTest.title}**\n`;
                detailedMessage += `   📁 File: ${this.getFileName(failedTest.file)}\n`;
                detailedMessage += `   ⏱️ Duration: ${this.formatDuration(failedTest.duration)}\n`;
                detailedMessage += `   ❌ Error: ${this.truncateText(failedTest.error, 200)}\n`;
            });
            detailedMessage += `\n`;
        }

        // Additional Context
        if (payload.startTime && payload.endTime) {
            detailedMessage += `🕐 **EXECUTION TIMELINE**\n`;
            detailedMessage += `▶️ Started: ${new Date(payload.startTime).toLocaleString()}\n`;
            detailedMessage += `⏹️ Finished: ${new Date(payload.endTime).toLocaleString()}\n\n`;
        }

        // Status-specific recommendations
        if (message.includes('FAILED') || (payload.failed && payload.failed > 0)) {
            detailedMessage += `🔧 **RECOMMENDATIONS**\n`;
            detailedMessage += `• Check test logs for detailed error information\n`;
            detailedMessage += `• Review failed test cases for flaky behaviors\n`;
            detailedMessage += `• Consider updating selectors or test data\n\n`;
        }

        // Footer with links (if needed)
        detailedMessage += `📋 **ACTIONS**\n`;
        detailedMessage += `• View detailed HTML report: \`npx playwright show-report\`\n`;
        detailedMessage += `• Check Allure report for advanced analytics\n`;
        detailedMessage += `• Review test results in CI/CD dashboard\n`;

        return detailedMessage;
    }

    private createMezonWebhookPayload(message: string): any {
        const payload: any = {
            type: 'hook',
            message: {
                t: message,
            }
        };

        // Add mention if configured
        if (this.mentionUserId) {
            const mentionText = `\n\n@mezon.bot`;
            const fullMessage = `${message}${mentionText}`;
            
            payload.message.t = fullMessage;
            payload.message.mentions = [{
                user_id: this.mentionUserId,
                s: fullMessage.length - mentionText.length + 2, // +2 for \n\n
                e: fullMessage.length
            }];
        }

        return payload;
    }

    private formatDuration(duration: number): string {
        const seconds = Math.floor(duration / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${(duration / 1000).toFixed(2)}s`;
        }
    }

    private getFileName(filePath: string): string {
        return filePath.split('/').pop() || filePath;
    }

    private truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}
