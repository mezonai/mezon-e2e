import type { Options } from "@wdio/types";
import { MultiRemoteProvider } from "../tests/manage-drive/provider.js";
import { installSessionScopedGlobals } from "../tests/manage-drive/session-scoped-globals.js";
import { capabilities } from "../tests/manage-drive/capabilities.js";

const isCI = !!process.env.CI;

declare global {
    var mr: MultiRemoteProvider<keyof typeof capabilities>;
}
let uninstall: (() => void) | undefined;

/**
 * All not needed configurations, for this boilerplate, are removed.
 * If you want to know which configuration options you have then you can
 * check https://webdriver.io/docs/configurationfile
 */
export const config: Options.Testrunner = {
    //
    // ====================
    // Runner Configuration
    // ====================
    //
    // ==================
    // Specify Test Files
    // ==================
    // The test-files are specified in:
    // - wdio.android.browser.conf.ts
    // - wdio.android.app.conf.ts
    // - wdio.ios.browser.conf.ts
    // - wdio.ios.app.conf.ts
    //
    /**
     * NOTE: This is just a place holder and will be overwritten by each specific configuration
     */
    runner: "local",
    hostname: "127.0.0.1",
    port: 4727,
    path: "/",

    maxInstances: 1,
    specs: [],
    //
    // ============
    // Capabilities
    // ============
    // The capabilities are specified in:
    // - wdio.android.browser.conf.ts
    // - wdio.android.app.conf.ts
    // - wdio.ios.browser.conf.ts
    // - wdio.ios.app.conf.ts
    //
    /**
     * NOTE: This is just a place holder and will be overwritten by each specific configuration
     */
    capabilities: [],
    //
    // ===================
    // Test Configurations
    // ===================
    // Define all options that are relevant for the WebdriverIO instance here
    //
    // Level of logging verbosity: trace | debug | info | warn | error | silent
    logLevel: "debug",
    // Set specific log levels per logger
    // loggers:
    // - webdriver, webdriverio
    // - @wdio/applitools-service, @wdio/browserstack-service, @wdio/devtools-service, @wdio/sauce-service
    // - @wdio/mocha-framework, @wdio/jasmine-framework
    // - @wdio/local-runner
    // - @wdio/sumologic-reporter
    // - @wdio/cli, @wdio/config, @wdio/utils
    // Level of logging verbosity: trace | debug | info | warn | error | silent
    // logLevels: {
    //     webdriver: 'info',
    //     '@wdio/applitools-service': 'info'
    // },
    //
    // If you only want to run your tests until a specific amount of tests have failed use
    // bail (default is 0 - don't bail, run all tests).
    bail: 0,
    // Set a base URL in order to shorten url command calls. If your `url` parameter starts
    // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
    // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
    // gets prepended directly.
    baseUrl: "http://the-internet.herokuapp.com",
    // Default timeout for all waitFor* commands.
    /**
     * NOTE: This has been increased for more stable Appium Native app
     * tests because they can take a bit longer.
     */
    waitforTimeout: 45000,
    // Default timeout in milliseconds for request
    // if browser driver or grid doesn't send response
    connectionRetryTimeout: 120000,
    // Default request retries count
    connectionRetryCount: 3,
    // Test runner services
    // Services take over a specific job you don't want to take care of. They enhance
    // your test setup with almost no effort. Unlike plugins, they don't add new
    // commands. Instead, they hook themselves up into the test process.
    //
    // Services are empty here but will be defined in the
    // - wdio.shared.browserstack.conf.ts
    // - wdio.shared.local.appium.conf.ts
    // - wdio.shared.sauce.conf.ts
    // configuration files
    services: [
        [
            "appium",
            {
                command: "appium",
                args: {
                    address: "127.0.0.1",
                    port: 4727,
                    basePath: "/",
                    relaxedSecurity: true,
                    allowCors: true,
                },
            },
        ],
    ],
    // Framework you want to run your specs with.
    // The following are supported: Mocha, Jasmine, and Cucumber
    // see also: https://webdriver.io/docs/frameworks
    //
    // Make sure you have the wdio adapter package for the specific framework installed
    // before running any tests.
    framework: "mocha",
    // The number of times to retry the entire spec file when it fails as a whole
    // specFileRetries: 1,
    //
    // Delay in seconds between the spec file retry attempts
    // specFileRetriesDelay: 0,
    //
    // Whether or not retried spec files should be retried immediately or deferred to the end of the queue
    // specFileRetriesDeferred: false,
    //
    // Test reporter for stdout.
    // The only one supported by default is 'dot'
    // see also: https://webdriver.io/docs/dot-reporter
    reporters: [
        "spec",
        "dot",
        [
            "allure",
            {
                outputDir: "allure-results",
                disableWebdriverStepsReporting: false,
                disableWebdriverScreenshotsReporting: true,
                addConsoleLogs: true,
                issueLinkTemplate: "https://github.com/mezonai/mezon/issues/{}",
                tmsLinkTemplate:
                    "https://ops.nccsoft.vn/DefaultCollection/mezon/_boards/board/t/Mezon-Automation%20team/Backlog%20items/?workitem={}",
            },
        ],
        [
            "video",
            {
                saveAllVideos: true,
                videoSlowdownMultiplier: 3,
                outputDir: "./reports/videos",
            },
        ],
    ],

    // Options to be passed to Mocha.
    mochaOpts: {
        ui: "bdd",
        /**
         * NOTE: This has been increased for more stable Appium Native app
         * tests because they can take a bit longer.
         */
        timeout: 3 * 60 * 1000, // 3min
    },
    //
    // =====
    // Hooks
    // =====
    // WebdriverIO provides several hooks you can use to interfere with the test process in order to enhance
    // it and to build services around it. You can either apply a single function or an array of
    // methods to it. If one of them returns with a promise, WebdriverIO will wait until that promise got
    // resolved to continue.
    //
    /**
     * NOTE: Hooks added to attach video and screenshots into Allure
     */
    afterTest: async function (test, _context, { error, passed }) {
        try {
            const fs = await import("node:fs");
            const path = await import("node:path");
            const allureReporter = (await import("@wdio/allure-reporter"))
                .default;

            // Always attach a screenshot on failure
            if (!passed) {
                try {
                    const screenshot = await browser.takeScreenshot();
                    allureReporter.addAttachment(
                        "Screenshot",
                        Buffer.from(screenshot, "base64"),
                        "image/png"
                    );
                } catch {}
            }

            // Try to find and attach the test video (wdio-video-reporter) only when failed
            if (!passed) {
                try {
                    const videosDir = path.resolve(
                        process.cwd(),
                        "./reports/videos"
                    );
                    if (fs.existsSync(videosDir)) {
                        const entries = fs.readdirSync(videosDir);
                        const videoFiles = entries
                            .filter(
                                (f) => f.endsWith(".webm") || f.endsWith(".mp4")
                            )
                            .map((name) => ({
                                name,
                                fullPath: path.join(videosDir, name),
                                stat: fs.statSync(path.join(videosDir, name)),
                            }))
                            .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

                        if (videoFiles.length > 0) {
                            const latest = videoFiles[0];
                            const mime = latest.name.endsWith(".mp4")
                                ? "video/mp4"
                                : "video/webm";
                            const data = fs.readFileSync(latest.fullPath);
                            allureReporter.addAttachment(
                                "Test Video",
                                data,
                                mime
                            );
                        }
                    }
                } catch {}
            }

            // Optionally attach error details as JSON for quick view
            if (error) {
                try {
                    const details = JSON.stringify(
                        { message: error.message, stack: error.stack },
                        null,
                        2
                    );
                    allureReporter.addAttachment(
                        "Error Details",
                        details,
                        "application/json"
                    );
                } catch {}
            }
        } catch {}
    },

    before() {
        const mr = MultiRemoteProvider.from();
        global.mr = mr;
        uninstall = installSessionScopedGlobals(mr.all());
    },
    after() {
        uninstall?.();
    },

    autoCompileOpts: {
        tsNodeOpts: {
            transpileOnly: true,
            esm: true,
            project: "./tsconfig.json",
        },
    },
};
