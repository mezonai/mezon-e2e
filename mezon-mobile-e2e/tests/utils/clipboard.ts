export class Clipboard {
    static async setClipboardCrossPlatform(text: string): Promise<void> {
        if (driver.isIOS) {
            await driver.execute("mobile: setPasteboard", {
                content: Buffer.from(text, "utf8").toString("base64"),
                encoding: "utf8",
            });
            return;
        }

        if (driver.isAndroid) {
            try {
                await driver.setClipboard("plaintext", text);
                return;
            } catch {
                await driver.execute("mobile: shell", {
                    command: "am",
                    args: [
                        "broadcast",
                        "-a",
                        "clipper.set",
                        "-e",
                        "text",
                        text,
                    ],
                });
            }
            return;
        }

        await driver.setClipboard(text as any);
    }

    static async getClipboardText(): Promise<string> {
        if (driver.isIOS) {
            const base64 = (await driver.execute(
                "mobile: getPasteboard",
                {
                    encoding: "utf8",
                } as any
            )) as string;
            try {
                return Buffer.from(base64, "base64").toString("utf8");
            } catch {
                return String(base64);
            }
        }

        if (driver.isAndroid) {
            try {
                const text = await driver.getClipboard("plaintext");
                return text ?? "";
            } catch {
                const out = (await driver.execute("mobile: shell", {
                    command: "am",
                    args: [
                        "broadcast",
                        "-a",
                        "clipper.get",
                    ],
                })) as any;
                return String(out ?? "");
            }
        }

        const generic = (await (driver as any).getClipboard()) as string;
        return generic ?? "";
    }
}
