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

            // Check if this is a simple start message or if all tests passed (simple success message)
            const isStartMessage = message.includes('started') || message.includes('🚀');
            const isAllTestsPassed = message.includes('Successfully') && 
                                   enrichedPayload.failed === 0 && 
                                   enrichedPayload.passed && enrichedPayload.passed > 0;
            
            const isSimpleMessage = isStartMessage || isAllTestsPassed;
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

        // For start messages
        if (message.includes('started') || message.includes('🚀')) {
            let simpleMessage = `${message}\n`;
            simpleMessage += `⏰ ${timestamp} (GMT+7)\n`;
            
            if (payload.totalTests !== undefined) {
                simpleMessage += `📊 Total Tests: ${payload.totalTests}\n`;
            }
            
            simpleMessage += `🌍 Environment: ${payload.environment || 'development'}\n`;
            return simpleMessage;
        }
        
        // For success messages (all tests passed)
        if (message.includes('Successfully')) {
            const passed = payload.passed || 0;
            const total = payload.totalTests || passed;
            const duration = payload.totalDuration ? this.formatDuration(payload.totalDuration) : 'N/A';
            
            return `✅ All tests passed! ${passed}/${total} tests completed successfully in ${duration} ⏰ ${timestamp} (GMT+7)`;
        }

        // Fallback for other simple messages
        return `${message} ⏰ ${timestamp} (GMT+7)`;
    }

    private formatDetailedMessage(message: string, payload: NotificationPayload): string {

        let detailedMessage = ``;


        // Error Information
        if (payload.error) {
            detailedMessage += `❌ **ERROR DETAILS**\n`;
            detailedMessage += `🔍 Error: ${this.truncateText(payload.error, 300)}\n\n`;
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
