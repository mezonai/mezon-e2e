import { HomeTablet } from "../screenobjects/index.js";
import { MezonInputObject } from "../component-ui-object/index.js";
import * as fs from "fs";
import * as path from "path";
import { Upload } from "../utils/upload.js";

export interface CreateClanOptions {
    clanName: string;
    callbackUploadImage?: <T>(upload: Upload) => Promise<T>;
}

export interface ClanInfo {
    name: string;
    id?: string;
    createdAt: string;
    testId: string;
}

export async function createClanFlow(
    opts: CreateClanOptions
): Promise<ClanInfo> {
    const { clanName, callbackUploadImage } = opts;
    const testId = `test-${Date.now()}`;

    await HomeTablet.waitForIsShown(true);

    await HomeTablet.tapDmLogo();
    await HomeTablet.openClanList();

    const createClanButton = await $("~listClanPopup.createClanButton");
    await createClanButton.waitForDisplayed({ timeout: 15000 });
    await createClanButton.click();

    const modal = MezonInputObject.init();
    await modal.setInput(clanName);

    const uploadButton = await $("~createClanModal.uploadImageButton");
    await uploadButton.waitForDisplayed();
    await uploadButton.click();
    await Upload.using(callbackUploadImage);

    const nameInput = await $("~createClanModal.clanNameInput");
    await nameInput.waitForDisplayed();
    await nameInput.click();
    await nameInput.setValue(clanName);

    const createButton = await $("~createClanModal.createButton");
    await createButton.waitForDisplayed();
    await createButton.waitForEnabled({ timeout: 5000 });
    await createButton.click();

    const clanInfo: ClanInfo = {
        name: clanName,
        createdAt: new Date().toISOString(),
        testId,
    };

    return clanInfo;
}

async function logClanToFile(clanInfo: ClanInfo): Promise<void> {
    try {
        const logDir = path.join(process.cwd(), "test-results", "clan-logs");
        const logFile = path.join(logDir, "created-clans.json");

        // Ensure directory exists
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        let existingLogs: ClanInfo[] = [];
        if (fs.existsSync(logFile)) {
            const fileContent = fs.readFileSync(logFile, "utf8");
            try {
                existingLogs = JSON.parse(fileContent);
            } catch (e) {
                console.warn(
                    "Could not parse existing clan log file, starting fresh"
                );
            }
        }

        existingLogs.push(clanInfo);

        fs.writeFileSync(logFile, JSON.stringify(existingLogs, null, 2));
        console.log(`Clan logged to: ${logFile}`);
    } catch (error) {
        console.error("Failed to log clan to file:", error);
    }
}

export function getLoggedClans(): ClanInfo[] {
    try {
        const logFile = path.join(
            process.cwd(),
            "test-results",
            "clan-logs",
            "created-clans.json"
        );
        if (!fs.existsSync(logFile)) {
            return [];
        }
        const fileContent = fs.readFileSync(logFile, "utf8");
        return JSON.parse(fileContent);
    } catch (error) {
        console.error("Failed to read clan logs:", error);
        return [];
    }
}

export function getLastCreatedClan(): ClanInfo | null {
    const clans = getLoggedClans();
    return clans.length > 0 ? clans[clans.length - 1] : null;
}
