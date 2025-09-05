export interface NotificationPayload {
    totalTests?: number;
    file?: string;
    duration?: number;
    status?: string;
    timestamp?: string;
    environment?: string;
    project?: string;
    workers?: number;
    timeout?: number;
    retries?: number;
    error?: string;
    progress?: string;
    passed?: number;
    failed?: number;
    skipped?: number;
    successRate?: number;
}

export class MezonNotifier {
    private webhookUrl?: string;
    private isEnabled: boolean;

    constructor() {
        this.webhookUrl = process.env.MEZON_WEBHOOK_URL;
        this.isEnabled = !!this.webhookUrl;
    }

    async send(message: string, payload?: NotificationPayload): Promise<void> {
        if (!this.isEnabled) {
            console.log(`[Mezon] ${message}`, payload ? JSON.stringify(payload, null, 2) : '');
            return;
        }

        try {
            const enrichedPayload = {
                ...payload,
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                project: 'Mezon E2E Tests',
            };

            const body = {
                type: 'hook',
                message: {
                    t: message
                }
            };

            const response = await fetch(this.webhookUrl!, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                console.warn(`[Mezon] Failed to send notification: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.warn('[Mezon] Error sending notification:', error);
        }
    }
}
