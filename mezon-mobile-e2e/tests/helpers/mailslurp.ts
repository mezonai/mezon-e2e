import { Email, InboxDto, MailSlurp } from "mailslurp-client";
import fs from "node:fs/promises";
import path from "node:path";

type CleanupStrategy = "delete" | "empty" | "none";
type LogLevel = "debug" | "info" | "warn" | "error";
type Logger = {
    debug?: (...args: any[]) => void;
    info?: (...args: any[]) => void;
    warn?: (...args: any[]) => void;
    error?: (...args: any[]) => void;
};

export type OtpParser = (email: Email) => string | null;

export interface MailslurpLifecycleOptions {
    apiKey?: string;
    timeoutMs?: number;
    unreadOnly?: boolean;
    cleanup?: CleanupStrategy;
    otpParser?: OtpParser;
    logger?: Logger;
    reuse?: boolean;
    storageDir?: string;
    storageKey?: string;
    preferredEmailAddress?: string;
}

class MailSlurpNotInitializedError extends Error {
    constructor() {
        super("MailSlurp instance is not initialized. Call init() first.");
    }
}

class InboxNotCreatedError extends Error {
    constructor() {
        super("Inbox is not created. Call init() or createInbox() first.");
    }
}

class OtpNotFoundError extends Error {
    constructor() {
        super("OTP not found in email");
    }
}

function defaultLogger(level: LogLevel, ...args: any[]) {
    if (level === "error") console.error("[MailSlurp]", ...args);
}

export function composeOtpParsers(...parsers: OtpParser[]): OtpParser {
    return (email: Email) => {
        for (const parse of parsers) {
            const result = parse(email);
            if (result) return result;
        }
        return null;
    };
}

export const parseSixDigitOtp: OtpParser = (email: Email) => {
    const body = `${email.subject || ""}\n${email.body || ""}`;
    const match = body.match(/\b(\d{6})\b/);
    return match ? match[1] : null;
};

export class MailslurpLifecycle {
    private mailslurp?: MailSlurp;
    private inbox?: InboxDto;
    private readonly timeoutMs: number;
    private readonly unreadOnly: boolean;
    private readonly cleanup: CleanupStrategy;
    private otpParser: OtpParser;
    private readonly logger: Logger;
    private readonly reuse: boolean;
    private readonly storageDir: string;
    private readonly storageKey: string;
    private readonly preferredEmailAddress?: string;

    constructor(options: MailslurpLifecycleOptions = {}) {
        const {
            apiKey = process.env.MAILSLURP_API_KEY!,
            timeoutMs = 60_000,
            unreadOnly = true,
            cleanup,
            otpParser = parseSixDigitOtp,
            logger,
            reuse = process.env.MAILSLURP_REUSE === "1",
            storageDir = process.env.MAILSLURP_STORE_DIR || ".mailslurp",
            storageKey = process.env.MAILSLURP_STORE_KEY || "default",
            preferredEmailAddress = process.env.MAILSLURP_EMAIL_ADDRESS,
        } = options;

        if (!apiKey) throw new Error("MAILSLURP_API_KEY is required");

        this.mailslurp = new MailSlurp({ apiKey });
        this.timeoutMs = timeoutMs;
        this.unreadOnly = unreadOnly;
        this.reuse = !!reuse;
        this.storageDir = storageDir;
        this.storageKey = storageKey;
        this.preferredEmailAddress = preferredEmailAddress;
        const resolvedCleanup: CleanupStrategy =
            cleanup ?? (this.reuse ? "empty" : "delete");
        this.cleanup = resolvedCleanup;
        this.otpParser = otpParser;
        this.logger = logger || {
            error: (...args) => defaultLogger("error", ...args),
        };
    }

    static async init(options?: MailslurpLifecycleOptions) {
        const instance = new MailslurpLifecycle(options);
        await instance.init();
        return instance;
    }

    static async using<T>(
        fn: (ms: MailslurpLifecycle) => Promise<T>,
        options?: MailslurpLifecycleOptions
    ): Promise<T> {
        const ms = await MailslurpLifecycle.init(options);
        try {
            return await fn(ms);
        } finally {
            await ms.dispose();
        }
    }

    private getStoreFilePath(): string {
        const dir = path.resolve(process.cwd(), this.storageDir);
        return path.join(dir, `${this.storageKey}.json`);
    }

    private async ensureStoreDir(): Promise<void> {
        const dir = path.resolve(process.cwd(), this.storageDir);
        await fs.mkdir(dir, { recursive: true });
    }

    private async loadStoredInboxMeta(): Promise<{ id: string; emailAddress: string } | null> {
        try {
            const filePath = this.getStoreFilePath();
            const json = await fs.readFile(filePath, "utf-8");
            const data = JSON.parse(json);
            if (data && typeof data.id === "string" && typeof data.emailAddress === "string") {
                return { id: data.id, emailAddress: data.emailAddress };
            }
            return null;
        } catch (err) {
            return null;
        }
    }

    private async saveStoredInboxMeta(inbox: InboxDto): Promise<void> {
        await this.ensureStoreDir();
        const filePath = this.getStoreFilePath();
        const payload = {
            id: inbox.id,
            emailAddress: inbox.emailAddress,
        };
        await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");
    }

    private async removeStoredInboxMeta(): Promise<void> {
        try {
            const filePath = this.getStoreFilePath();
            await fs.rm(filePath, { force: true });
        } catch (err) {
            // ignore
        }
    }

    async init(): Promise<void> {
        if (!this.mailslurp) throw new MailSlurpNotInitializedError();

        if (this.reuse) {
            const stored = await this.loadStoredInboxMeta();
            if (stored?.id) {
                try {
                    this.inbox = await this.mailslurp.getInbox(stored.id);
                    this.logger.debug &&
                        this.logger.debug(
                            "Reusable inbox loaded",
                            this.inbox.id,
                            this.inbox.emailAddress
                        );
                } catch (err) {
                    this.logger.debug && this.logger.debug("Stored inbox not found, will create new");
                }
            }
        }

        if (!this.inbox) {
            try {
                if (this.preferredEmailAddress) {
                    this.inbox = await this.mailslurp.createInboxWithOptions({
                        emailAddress: this.preferredEmailAddress,
                    } as any);
                } else {
                    this.inbox = await this.mailslurp.createInbox();
                }
            } catch (err) {
                // fallback to default create if options fail
                if (!this.inbox) {
                    this.inbox = await this.mailslurp.createInbox();
                }
            }

            if (this.reuse) {
                await this.saveStoredInboxMeta(this.inbox);
            }

            this.logger.debug &&
                this.logger.debug(
                    "Inbox created",
                    this.inbox.id,
                    this.inbox.emailAddress
                );
        }
    }

    public async deleteInbox(): Promise<void> {
        if (!this.mailslurp) throw new MailSlurpNotInitializedError();
        await this.mailslurp.deleteInbox(this.inbox.id!);
        this.logger.debug && this.logger.debug("Inbox deleted", this.inbox.id);
    }

    async dispose(): Promise<void> {
        if (!this.mailslurp) throw new MailSlurpNotInitializedError();
        if (!this.inbox) return;

        const effectiveCleanup: CleanupStrategy =
            this.reuse && this.cleanup === "delete" ? "empty" : this.cleanup;

        if (effectiveCleanup === "delete") {
            await this.mailslurp.deleteInbox(this.inbox.id!);
            await this.removeStoredInboxMeta();
        } else if (effectiveCleanup === "empty") {
            await this.mailslurp.emptyInbox(this.inbox.id!);
        } else {
            // none: no-op
        }

        this.logger.debug &&
            this.logger.debug(
                "Inbox cleaned up",
                this.inbox.id,
                effectiveCleanup
            );
    }

    setOtpParser(parser: OtpParser) {
        this.otpParser = parser;
    }

    getInboxId(): string {
        if (!this.inbox) throw new InboxNotCreatedError();
        return this.inbox.id!;
    }

    async getEmailAddress(): Promise<string> {
        if (!this.inbox) {
            this.logger.debug("Inbox not created");
            throw new InboxNotCreatedError();
        }
        return this.inbox.emailAddress as string;
    }

    async waitForLatestEmail(timeoutMs = this.timeoutMs): Promise<Email> {
        if (!this.mailslurp) throw new MailSlurpNotInitializedError();
        if (!this.inbox) throw new InboxNotCreatedError();
        return this.mailslurp.waitForLatestEmail(
            this.inbox.id!,
            timeoutMs,
            this.unreadOnly
        );
    }

    async waitForOtp(timeoutMs = this.timeoutMs): Promise<string> {
        const email = await this.waitForLatestEmail(timeoutMs);
        const otp = this.otpParser(email);
        if (!otp) throw new OtpNotFoundError();
        return otp;
    }

    async emptyInbox(): Promise<void> {
        if (!this.mailslurp || !this.inbox) return;
        await this.mailslurp.emptyInbox(this.inbox.id!);
        this.logger.debug && this.logger.debug("Inbox emptied", this.inbox.id);
    }
}

class MailSlurpHelper {
    private lifecycle: MailslurpLifecycle;

    private constructor(lifecycle: MailslurpLifecycle) {
        this.lifecycle = lifecycle;
    }

    static async init(options?: MailslurpLifecycleOptions) {
        const lifecycle = await MailslurpLifecycle.init(options);
        return new MailSlurpHelper(lifecycle);
    }

    public async getEmailAddress() {
        return this.lifecycle.getEmailAddress();
    }

    public async getOtpFromEmail(timeoutMs?: number) {
        return this.lifecycle.waitForOtp(timeoutMs);
    }

    public async dispose() {
        await this.lifecycle.dispose();
    }
}

export default MailSlurpHelper;
