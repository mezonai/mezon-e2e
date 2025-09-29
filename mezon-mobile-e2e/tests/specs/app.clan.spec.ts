import { MezonLoginScreen, HomeScreen } from "../screenobjects/index.js";
import {
    ClanMenuScreen,
    ClanMenuActionButtonsComponent,
    ClanMenuListComponent,
} from "../screenobjects/home/clan-menu/index.js";

import { MailslurpLifecycle } from "../helpers/mailslurp.js";
import { sleep } from "../utils/sleep.js";

describe("Create Clan E2E Tests", function () {
    let mezonLoginScreen = MezonLoginScreen.init();

    before(async function () {
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
    });

    it("Create Clan", async function () {
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

        await ClanMenuScreen.using(async (clanMenu) => {
            await clanMenu.openFromHeader();
            await clanMenu.waitForIsShown();
        });

        await ClanMenuActionButtonsComponent.clickByTitle("Lời mời");

        const menu = new ClanMenuListComponent();
        await menu.clickItem("Đánh dấu là đã đọc");
        await menu.clickItem("Tạo danh mục");
        await menu.clickItem("Tạo sự kiện");
        await menu.toggleShowEmptyCategories();
    });
});
