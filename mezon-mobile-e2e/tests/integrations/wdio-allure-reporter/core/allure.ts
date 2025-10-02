import allureReporter from "@wdio/allure-reporter";

export enum Status {
    FAILED = "failed",
    BROKEN = "broken",
    PASSED = "passed",
    SKIPPED = "skipped",
}

export class Allure {
    constructor() {}
    static init() {
        return new Allure();
    }
    static async using<T>(fn: (allure: Allure) => Promise<T>): Promise<T> {
        return fn(this.init());
    }
    public async step<T>(
        name: string,
        fn: (allure: Allure) => Promise<T>
    ): Promise<T | void> {
        allureReporter.startStep(name);
        try {
            const preScreenshot = await browser.takeScreenshot();
            this.addAttachment(
                `pre-screenshot${name}`,
                Buffer.from(preScreenshot, "base64"),
                "image/png"
            );
            const result = await fn(this);
            const postScreenshot = await browser.takeScreenshot();
            this.addAttachment(
                `post-screenshot${name}`,
                Buffer.from(postScreenshot, "base64"),
                "image/png"
            );
            allureReporter.endStep(Status.PASSED);
            return result;
        } catch (error) {
            try {
                const errorScreenshot = await browser.takeScreenshot();
                allureReporter.endStep(Status.FAILED);
                this.addAttachment(
                    `error-screenshot${name}`,
                    Buffer.from(errorScreenshot, "base64"),
                    "image/png"
                );
            } catch {}
            throw error;
        }
    }
    public addAttachment(
        name: string,
        content: string | Buffer | object,
        type: string
    ) {
        allureReporter.addAttachment(name, content, type);
    }
    public addLink(url: string, name: string, type: string) {
        allureReporter.addLink(url, name, type);
    }
    public addIssue(id: string) {
        allureReporter.addIssue(String(id));
    }
    public addTestId(id: string) {
        allureReporter.addTestId(String(id));
    }
    public addLabel(name: string, value: string) {
        allureReporter.addLabel(String(name), String(value));
    }
    public addFeature(feature: string) {
        allureReporter.addFeature(String(feature));
    }
    public addStory(story: string) {
        allureReporter.addStory(String(story));
    }
    public addSeverity(severity: string) {
        allureReporter.addSeverity(String(severity));
    }
}
