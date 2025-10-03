export const capabilities = {
    driverA: {
        capabilities: {
            platformName: "Android",
            "wdio:maxInstances": 1,

            "appium:deviceName": "Pixel_2_API_30",
            "appium:avd": "Pixel_2_API_30",
            "appium:udid": "emulator-5554",

            "appium:platformVersion": "30",

            "appium:orientation": "PORTRAIT",
            "appium:automationName": "UiAutomator2",
            "appium:appWaitActivity": "com.mezon.mobile.MainActivity",
            "appium:appPackage": "com.mezon.mobile",
            "appium:appActivity": ".MainActivity",
            "appium:newCommandTimeout": 240,
            "appium:autoGrantPermissions": true,

            // Fast start optimizations
            // "appium:skipDeviceInitialization": true,
            // "appium:skipServerInstallation": true,
            "appium:disableWindowAnimation": true,

            // Bypass login/persist
            "appium:noReset": true,
            "appium:fullReset": false,
            // "appium:autoLaunch": false,
            "appium:dontStopAppOnReset": true,
            "appium:systemPort": 8201,
        },
    },
    driverB: {
        capabilities: {
            platformName: "Android",
            "appium:deviceName": "Pixel_2_API_30_clone",
            "appium:avd": "Pixel_2_API_30_clone",
            "appium:udid": "emulator-5556",

            "appium:platformVersion": "30",

            "appium:orientation": "PORTRAIT",
            "appium:automationName": "UiAutomator2",
            "appium:appWaitActivity": "com.mezon.mobile.MainActivity",
            "appium:appPackage": "com.mezon.mobile",
            "appium:appActivity": ".MainActivity",
            "appium:newCommandTimeout": 240,
            "appium:autoGrantPermissions": true,

            // Fast start optimizations
            // "appium:skipDeviceInitialization": true,
            // "appium:skipServerInstallation": true,
            "appium:disableWindowAnimation": true,

            // Bypass login/persist
            "appium:noReset": true,
            "appium:fullReset": false,
            // "appium:autoLaunch": false,
            "appium:dontStopAppOnReset": true,
            "appium:systemPort": 8202,
        },
    },
};
