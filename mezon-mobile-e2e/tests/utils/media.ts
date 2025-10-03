import fs from "fs";
import path from "path";

export class Media {
    static async addPhotoToDevice(params: {
        localPath: string;
        filename?: string;
    }): Promise<{ filename: string; androidDevicePath?: string }> {
        const { localPath } = params;
        const filename = params.filename ?? path.basename(localPath);
        const base64 = fs.readFileSync(localPath, "base64");

        if (driver.isIOS) {
            await driver.execute("mobile: addMedia", {
                media: base64,
                mediaType: "photo",
            });
            return { filename };
        }

        const androidDevicePath = `/sdcard/Download/${filename}`;
        await driver.pushFile(androidDevicePath, base64);
        try {
            await driver.execute("mobile: shell", {
                command: "am",
                args: [
                    "broadcast",
                    "-a",
                    "android.intent.action.MEDIA_SCANNER_SCAN_FILE",
                    "-d",
                    `file://${androidDevicePath}`,
                ],
            });
        } catch (e) {
            // Best effort: some images still appear without explicit scan
        }
        return { filename, androidDevicePath };
    }

    static async selectImageInNativePicker(filename: string): Promise<void> {
        if (driver.isIOS) {
            try {
                const allPhotos = await $(
                    '-ios predicate string:type == "XCUIElementTypeStaticText" AND name CONTAINS "All Photos"'
                );
                if (await allPhotos.isDisplayed()) {
                    await allPhotos.click();
                }
            } catch {}

            const firstCell = await $("(//XCUIElementTypeCell)[1]");
            await firstCell.waitForDisplayed({ timeout: 15000 });
            await firstCell.click();
            return;
        }

        const trySystemPhotoPicker = async () => {
            const thumbSelectors = [
                'android=new UiSelector().resourceIdMatches(".*:id/icon_thumbnail")',
                'android=new UiSelector().resourceIdMatches(".*:id/thumbnail")',
                'android=new UiSelector().resourceIdMatches(".*:id/icon")',
                'android=new UiSelector().className("android.widget.ImageView").clickable(true)',
            ];
            for (const sel of thumbSelectors) {
                try {
                    const firstThumb = await $(sel);
                    await firstThumb.waitForDisplayed({ timeout: 5000 });
                    await firstThumb.click();
                    const confirmTexts = [
                        "Select",
                        "Chọn",
                        "Done",
                        "Xong",
                        "Add",
                        "Thêm",
                        "Open",
                        "Mở",
                        "Use",
                        "Sử dụng",
                    ];
                    for (const text of confirmTexts) {
                        try {
                            const btn = await $(
                                `android=new UiSelector().textContains("${text}")`
                            );
                            if (await btn.isDisplayed()) {
                                await btn.click();
                                break;
                            }
                        } catch {}
                    }
                    return true;
                } catch {}
            }
            return false;
        };

        const picked = await trySystemPhotoPicker();
        if (picked) return;

        const candidates = [
            "Downloads",
            "Tải xuống",
            "Download",
            "Files",
            "Tệp",
            "Gallery",
            "Ảnh",
            "Photos",
        ];

        for (const text of candidates) {
            try {
                const el = await $(
                    `android=new UiSelector().textContains("${text}")`
                );
                if (await el.isDisplayed()) {
                    await el.click();
                    break;
                }
            } catch {}
        }

        try {
            const fileEntry = await $(
                `android=new UiSelector().textContains("${filename}")`
            );
            await fileEntry.waitForDisplayed({ timeout: 15000 });
            await fileEntry.click();
        } catch (e) {
            try {
                const firstImage = await $(
                    "//androidx.recyclerview.widget.RecyclerView//android.widget.ImageView[1]"
                );
                await firstImage.waitForDisplayed({ timeout: 5000 });
                await firstImage.click();
            } catch {}
        }
    }
}
