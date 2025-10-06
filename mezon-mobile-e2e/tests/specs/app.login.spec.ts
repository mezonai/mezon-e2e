import { MezonLoginScreen } from "../screenobjects/index.js";
import { MailslurpLifecycle } from "../helpers/mailslurp.js";
import { sleep } from "../utils/sleep.js";

import { HomeScreen } from "../screenobjects/home/home.screen.js";

import {
    MultiRemoteProvider,
    installSessionScopedGlobals,
    ManageDrive,
} from "../manage-drive/index.js";

describe("Mezon Login (Native)", function () {
    let mezonLoginScreen: MezonLoginScreen;
    let uninstallSessionGlobals: (() => void) | undefined;
    let manageDrive: ManageDrive;

    before(async () => {
        mezonLoginScreen = await MezonLoginScreen.using(async (ms) => {
            await ms.waitForIsShown(true);
            return ms;
        });
        if ((browser as any)?.isMultiremote) {
            const mr = MultiRemoteProvider.from();
            uninstallSessionGlobals = installSessionScopedGlobals(mr.all());
            manageDrive = ManageDrive.init(mr);
        }
    });

    after(async () => {
        if (uninstallSessionGlobals) {
            uninstallSessionGlobals();
            uninstallSessionGlobals = undefined;
        }
    });

    it("Login with OTP via MailSlurp", async function () {
        await MailslurpLifecycle.using(
            async (ms) => {
                const emailAddress = await ms.getEmailAddress();
                await mezonLoginScreen.requestOtpFor(emailAddress);
                const otp = await ms.waitForOtp();
                await mezonLoginScreen.submitOtp(otp);
            },
            {
                reuse: true,
                cleanup: "empty",
                storageDir: ".mailslurp",
                storageKey: "login",
            }
        );
        await HomeScreen.using(async (home) => {
            const createClanModal = await home.openCreateClanModal();
            await createClanModal.setClanName(`Test Clan${Date.now()}`);
            await createClanModal.uploadImage(async (upload) => {
                const smallAvatarPath = await upload.createFileWithSize(
                    `small_avatar_${Date.now()}`,
                    800 * 1024,
                    "jpg"
                );
                return smallAvatarPath;
            });
            await sleep(2000);
            await createClanModal.createClan();
        });
    });

    it("Login with OTP via MailSlurp (Dual User)", async function () {
        await manageDrive.withDriverA(async () => {
            await MailslurpLifecycle.using(
                async (ms) => {
                    const emailAddress = await ms.getEmailAddress();
                    await MezonLoginScreen.using(async (ls) => {
                        await ls.requestOtpFor(emailAddress);
                        const otp = await ms.waitForOtp();
                        await ls.submitOtp(otp);
                    });
                },
                {
                    reuse: true,
                    cleanup: "empty",
                    storageDir: ".mailslurp",
                    storageKey: `${manageDrive.currentSession()}-login`,
                }
            );
        });

        await manageDrive.withDriverB(async () => {
            await MailslurpLifecycle.using(
                async (ms) => {
                    const emailAddress = await ms.getEmailAddress();
                    await MezonLoginScreen.using(async (ls) => {
                        await ls.requestOtpFor(emailAddress);
                        const otp = await ms.waitForOtp();
                        await ls.submitOtp(otp);
                    });
                },
                {
                    reuse: true,
                    cleanup: "empty",
                    storageDir: ".mailslurp",
                    storageKey: `${manageDrive.currentSession()}-login`,
                }
            );
        });
    });
});
