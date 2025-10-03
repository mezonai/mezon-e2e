import {
    MezonLoginScreen,
    BottomNavigator,
    HomeScreen,
    AuthScreen,
} from "../screenobjects/index.js";
import { MailslurpLifecycle } from "../helpers/mailslurp.js";

type PersistAuthState = {
    loadingStatus: string;
    session: Record<string, any> | null;
    isLogin: boolean;
    isRegistering: string;
    loadingStatusEmail: string;
    redirectUrl: string | null;
    activeAccount: string | null;
    _persist: { version: number; rehydrated: boolean };
};

type StoredSession = {
    token: string;
    refresh_token: string;
    created: boolean;
    created_at?: number;
    expires_at?: number;
    refresh_expires_at?: number;
    username?: string;
    user_id?: string;
    vars?: object;
    is_remember?: boolean;
    api_url: string;
};

const SESSION_STORE_DIR = "tests/.sessions";

function getDeviceKey(): string {
    const caps = driver.capabilities as any;
    const platform = (
        caps.platformName ||
        caps["appium:platformName"] ||
        ""
    ).toString();
    const udid = caps["appium:udid"] || caps.udid || "unknown";
    const deviceName = caps["appium:deviceName"] || caps.deviceName || "device";
    return `${platform}__${udid || deviceName}`.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function sessionFilePath(): string {
    const key = getDeviceKey();
    return `${SESSION_STORE_DIR}/default__${key}.json`;
}

async function ensureDir(path: string): Promise<void> {
    const fs = await import("node:fs/promises");
    const p = await import("node:path");
    await fs.mkdir(p.dirname(path), { recursive: true });
}

async function readJson<T>(path: string): Promise<T | null> {
    try {
        const fs = await import("node:fs/promises");
        const raw = await fs.readFile(path, "utf-8");
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

async function writeJson(path: string, data: any): Promise<void> {
    const fs = await import("node:fs/promises");
    await ensureDir(path);
    await fs.writeFile(path, JSON.stringify(data, null, 2), "utf-8");
}

function buildMezonConfigFromSession(session: StoredSession) {
    try {
        const url = new URL(session.api_url);
        return {
            host: url.hostname,
            port: url.port || "443",
            ssl: url.protocol === "https:",
        };
    } catch {
        return {
            host: "gw.mezon.ai",
            port: "443",
            ssl: true,
        };
    }
}

async function isLoggedIn(): Promise<boolean> {
    try {
        const wrapper = await $("~bottomNavigatorWrapper");
        if (await wrapper.isDisplayed()) return true;
    } catch {}
    try {
        const home = await $("~homeScreen");
        if (await home.isDisplayed()) return true;
    } catch {}
    return false;
}

async function waitForHome(): Promise<void> {
    try {
        await AuthScreen.using(async (auth) => {
            await auth.waitForAuthenticated();
        });
    } catch {}

    try {
        await BottomNavigator.using(async (bn) => {
            try {
                const messages = await bn.openMessages();
                await messages.waitForIsShown(true);
            } catch {}
        });
    } catch {
        await HomeScreen.using(async (hs) => {
            await hs.waitForIsShown(true);
        });
    }
}

async function performFirstTimeLoginAndPersist(): Promise<StoredSession> {
    let session: StoredSession | null = null;
    await MezonLoginScreen.using(async (ms) => {
        await ms.waitForIsShown(true);
    });

    await MailslurpLifecycle.using(
        async (ms) => {
            const email = await ms.getEmailAddress();
            const login = await MezonLoginScreen.using(async (ls) => {
                await ls.requestOtpFor(email);
                return ls;
            });
            const otp = await ms.waitForOtp();
            await login.submitOtp(otp);
        },
        {
            reuse: true,
            cleanup: "empty",
            storageDir: ".mailslurp",
            storageKey: "login",
        }
    );

    await driver.pause(5000);
    await waitForHome();

    const marker = {
        createdAt: Date.now(),
        artifact: { method: "otp" },
    };
    await writeJson(sessionFilePath(), marker);

    return session as unknown as StoredSession;
}

// describe("[setup] Bypass Mezon Mobile Auth", function () {
//     it("prepare or restore auth state", async function () {
//         if (await isLoggedIn()) {
//             return;
//         }

//         const prev = await readJson<any>(sessionFilePath());
//         if (prev) {
//             try {
//                 const loginRoot = await $("~login.screen");
//                 if (await loginRoot.isDisplayed()) {
//                     await performFirstTimeLoginAndPersist();
//                     return;
//                 }
//             } catch {}

//             await waitForHome();
//             return;
//         }

//         await performFirstTimeLoginAndPersist();
//     });
// });
