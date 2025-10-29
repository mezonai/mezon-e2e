import { config as baseConfig } from "./wdio.shared.local.appium.conf.js";
import { capabilities } from "../tests/manage-drive/capabilities.js";

export const config: WebdriverIO.MultiremoteConfig = {
    ...baseConfig,

    // ============
    // Specs
    // ============
    specs: ["../tests/specs/**/app*.spec.ts"],

    // ============
    // Capabilities
    // ============
    // For all capabilities please check
    // https://github.com/appium/appium-uiautomator2-driver
    capabilities: capabilities,
};
