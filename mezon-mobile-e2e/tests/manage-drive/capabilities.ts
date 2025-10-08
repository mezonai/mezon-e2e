export const capabilities = {
  driverA: {
    capabilities: {
      platformName: 'Android',
      'wdio:maxInstances': 1,

      'appium:deviceName': 'Pixel_2_API_30',
      'appium:avd': 'Pixel_2_API_30',
      'appium:udid': 'emulator-5554',

      'appium:platformVersion': '30',

      'appium:orientation': 'PORTRAIT',
      'appium:automationName': 'UiAutomator2',
      'appium:appWaitActivity': 'com.mezon.mobile.MainActivity',
      'appium:appPackage': 'com.mezon.mobile',
      'appium:appActivity': '.MainActivity',
      'appium:newCommandTimeout': 240,
      'appium:autoGrantPermissions': true,

      // Keyboard
      'appium:unicodeKeyboard': true,
      'appium:resetKeyboard': true,

      // Fast start optimizations
      // "appium:skipDeviceInitialization": true,
      // "appium:skipServerInstallation": true,
      'appium:disableWindowAnimation': true,

      // Bypass login/persist
      //   'appium:noReset': true,
      //   'appium:fullReset': false,
      // "appium:autoLaunch": false,
      //   'appium:dontStopAppOnReset': true,
      'appium:systemPort': 8201,

      'appium:noReset': false,
      'appium:fullReset': false,
      'appium:autoLaunch': true,
      'appium:dontStopAppOnReset': false,
      'appium:skipDeviceInitialization': true,
      'appium:skipServerInstallation': true,
    },
  },
  driverB: {
    capabilities: {
      platformName: 'Android',
      'appium:deviceName': 'Pixel_2_API_30_clone',
      'appium:avd': 'Pixel_2_API_30_clone',
      'appium:udid': 'emulator-5556',

      'appium:platformVersion': '30',

      'appium:orientation': 'PORTRAIT',
      'appium:automationName': 'UiAutomator2',
      'appium:appWaitActivity': 'com.mezon.mobile.MainActivity',
      'appium:appPackage': 'com.mezon.mobile',
      'appium:appActivity': '.MainActivity',
      'appium:newCommandTimeout': 240,
      'appium:autoGrantPermissions': true,

      // Fast start optimizations
      // "appium:skipDeviceInitialization": true,
      // "appium:skipServerInstallation": true,
      'appium:disableWindowAnimation': true,

      // Bypass login/persist
      //   'appium:noReset': true,
      //   'appium:fullReset': false,
      //   'appium:dontStopAppOnReset': true,
      'appium:systemPort': 8202,

      'appium:noReset': false,
      'appium:fullReset': false,
      'appium:autoLaunch': true,
      'appium:dontStopAppOnReset': false,
      'appium:skipDeviceInitialization': true,
      'appium:skipServerInstallation': true,

      // Keyboard
      'appium:unicodeKeyboard': true,
      'appium:resetKeyboard': true,
    },
  },
  driverC: {
    capabilities: {
      platformName: 'Android',
      'wdio:maxInstances': 1,
      'appium:deviceName': 'Pixel_2_API_30_clone1',
      'appium:avd': 'Pixel_2_API_30_clone1',
      'appium:udid': 'emulator-5558',
      'appium:platformVersion': '30',
      'appium:orientation': 'PORTRAIT',
      'appium:automationName': 'UiAutomator2',
      'appium:appWaitActivity': 'com.mezon.mobile.MainActivity',
      'appium:appPackage': 'com.mezon.mobile',
      'appium:appActivity': '.MainActivity',
      'appium:newCommandTimeout': 240,
      'appium:autoGrantPermissions': true,
      'appium:disableWindowAnimation': true,
      //   'appium:noReset': true,
      //   'appium:fullReset': false,
      //   'appium:dontStopAppOnReset': true,
      'appium:systemPort': 8203,

      // Reset config
      'appium:noReset': false,
      'appium:fullReset': false,
      'appium:autoLaunch': true,
      'appium:dontStopAppOnReset': false,
      'appium:skipDeviceInitialization': true,
      'appium:skipServerInstallation': true,

      // Keyboard
      'appium:unicodeKeyboard': true,
      'appium:resetKeyboard': true,
    },
  },
  driverD: {
    capabilities: {
      platformName: 'Android',
      'wdio:maxInstances': 1,
      'appium:deviceName': 'Pixel_2_API_30_clone2',
      'appium:avd': 'Pixel_2_API_30_clone2',
      'appium:udid': 'emulator-5560',
      'appium:platformVersion': '30',
      'appium:orientation': 'PORTRAIT',
      'appium:automationName': 'UiAutomator2',
      'appium:appWaitActivity': 'com.mezon.mobile.MainActivity',
      'appium:appPackage': 'com.mezon.mobile',
      'appium:appActivity': '.MainActivity',
      'appium:newCommandTimeout': 240,
      'appium:autoGrantPermissions': true,
      'appium:disableWindowAnimation': true,
      //   'appium:noReset': true,
      //   'appium:fullReset': false,
      //   'appium:dontStopAppOnReset': true,
      'appium:systemPort': 8204,

      'appium:noReset': false,
      'appium:fullReset': false,
      'appium:autoLaunch': true,
      'appium:dontStopAppOnReset': false,
      'appium:skipDeviceInitialization': true,
      'appium:skipServerInstallation': true,

      // Keyboard
      'appium:unicodeKeyboard': true,
      'appium:resetKeyboard': true,
    },
  },
};
