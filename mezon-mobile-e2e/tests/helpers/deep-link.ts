import { HomeScreen } from "../screenobjects/index.js";

// [MEZON][OTP] Hardcoded session payload for bypass-auth deep link
export const OTP_BYPASS_SESSION = {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiIxYzFiMzUxNy1hMjc4LTQ4YTktYjY0Ni1iMzBkNjM4MTliNzUiLCJ1aWQiOjE3ODM0NDUxMzU0NDMzNjU4ODgsInVzbiI6Im1pbmguZG92YW4iLCJleHAiOjE3NTg4ODE1NzV9.s9BwW3u3pNAn9BntyA5ZhOGDEICMbjMcDiXLT1VLaSA",
    refresh_token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiIxYzFiMzUxNy1hMjc4LTQ4YTktYjY0Ni1iMzBkNjM4MTliNzUiLCJ1aWQiOjE3ODM0NDUxMzU0NDMzNjU4ODgsInVzbiI6Im1pbmguZG92YW4iLCJleHAiOjE3NjEzODcxNzV9.u7MMiIZEvIdd4ZSBZhu1-5RBj9nppnHCeznpscRwiiU",
    user_id: "1783445135443366000",
    username: "minh.dovan",
    api_url: "https://api.mezon.ai",
} as const;

export class DeepLink {
    private readonly prefix = process.env.PREFIX;
    private readonly package = "com.mezon.mobile";
    private readonly realDeviceRegex = /^[a-f0-9]{25}|[a-f0-9]{40}$/i;

    private buildUrl(url: string) {
        const base =
            this.prefix && this.prefix.trim().length > 0
                ? this.prefix
                : "https://mezon.ai";
        const needsSlash = !base.endsWith("/") && url && !url.startsWith("/");
        return `${base}${needsSlash ? "/" : ""}${url}`;
    }

    static init() {
        return new DeepLink();
    }

    static async using<T>(fn: (dl: DeepLink) => Promise<T>): Promise<T> {
        return fn(DeepLink.init());
    }

    public async open(path: string) {
        return this.openDeepLink(path);
    }
    private async execute(url: string) {
        const full = this.buildUrl(url);
        return driver.execute("mobile:deepLink", {
            url: full,
            package: this.package,
        });
    }

    private isIosRealDevice() {
        return (
            "appium:udid" in driver.capabilities &&
            this.realDeviceRegex.test(
                driver.capabilities["appium:udid"] as string
            )
        );
    }

    private async openDeepLink(url: string) {
        if (driver.isAndroid) return this.execute(url);

        if (this.isIosRealDevice()) {
            await driver.execute("mobile: launchApp", {
                bundleId: "com.apple.mobilesafari",
            });
            const addressBarSelector = 'label == "Address" OR name == "URL"';
            const urlFieldSelector =
                'type == "XCUIElementTypeTextField" && name CONTAINS "URL"';
            const addressBar = $(`-ios predicate string:${addressBarSelector}`);
            const urlField = $(`-ios predicate string:${urlFieldSelector}`);

            if (!(await driver.isKeyboardShown())) {
                await addressBar.waitForDisplayed();
                await addressBar.click();
            }

            const full = this.buildUrl(url);
            await urlField.setValue(`${full}\uE007`);
        } else {
            const full = this.buildUrl(url);
            await driver.url(full);
        }

        try {
            const openSelector =
                "type == 'XCUIElementTypeButton' && name CONTAINS 'Open'";
            const openButton = $(`-ios predicate string:${openSelector}`);
            await openButton.waitForDisplayed({ timeout: 2000 });
            await openButton.click();
        } catch (e) {
            // ignore
        }
    }
    public async bypassAuthWithSession(
        sessionPayload: Record<string, any>,
        opts?: { host?: string; port?: string; ssl?: boolean }
    ) {
        const params = new URLSearchParams();
        params.set("session", JSON.stringify(sessionPayload));
        if (opts?.host) params.set("host", String(opts.host));
        if (opts?.port) params.set("port", String(opts.port));
        if (typeof opts?.ssl !== "undefined")
            params.set("ssl", opts.ssl ? "1" : "0");
        const path = `bypass-auth?${params.toString()}`;
        // eslint-disable-next-line no-console
        console.log("[E2E][DeepLink] bypassAuthWithSession path:", path);
        return this.open(path);
    }

    public async bypassAuthWithHardcodedOtp(opts?: {
        host?: string;
        port?: string;
        ssl?: boolean;
    }) {
        const finalHost = opts?.host ?? "api.mezon.ai";
        const finalPort = opts?.port ?? "443";
        const finalSSL = typeof opts?.ssl !== "undefined" ? opts.ssl : true;
        // Prefer token-based fallback, app sẽ tự lắp created/created_at
        // eslint-disable-next-line no-console
        console.log("[E2E][DeepLink] bypassAuthWithHardcodedOtp tokens");
        return this.bypassAuthWithTokens({
            token: OTP_BYPASS_SESSION.token,
            refresh_token: OTP_BYPASS_SESSION.refresh_token,
            user_id: String(OTP_BYPASS_SESSION.user_id),
            username: OTP_BYPASS_SESSION.username,
            api_url: OTP_BYPASS_SESSION.api_url,
            host: finalHost,
            port: finalPort,
            ssl: finalSSL,
        });
    }

    public async goToHome(query: string = "") {
        const q = query && !query.startsWith("?") ? `?${query}` : query;
        await this.open(`home${q}`);
    }

    public async bypassAuthWithTokens(input: {
        token: string;
        refresh_token: string;
        user_id: string;
        username?: string;
        api_url?: string;
        host?: string;
        port?: string;
        ssl?: boolean;
    }) {
        const params = new URLSearchParams();
        params.set("token", input.token);
        params.set("refresh_token", input.refresh_token);
        params.set("user_id", input.user_id);
        if (input.username) params.set("username", input.username);
        if (input.api_url) params.set("api_url", input.api_url);
        if (input.host) params.set("host", input.host);
        if (input.port) params.set("port", input.port);
        if (typeof input.ssl !== "undefined")
            params.set("ssl", input.ssl ? "1" : "0");
        const path = `bypass-auth?${params.toString()}`;
        // eslint-disable-next-line no-console
        console.log("[E2E][DeepLink] bypassAuthWithTokens path:", path);
        return this.open(path);
    }

    public async goToChannelApp(
        code: string,
        query: string = ""
    ): Promise<void> {
        const q = query && !query.startsWith("?") ? `?${query}` : query;
        await this.open(`channel-app/${encodeURIComponent(code)}${q}`);
    }

    public async goToInvite(code: string): Promise<void> {
        await this.open(`invite/${encodeURIComponent(code)}`);
    }

    public async goToProfileChat(code: string): Promise<void> {
        await this.open(`chat/${encodeURIComponent(code)}`);
    }
}
