import type { Browser } from "webdriverio";

export type DeviceInfo = {
  email: string;
  userId?: string;
  udid: string;
  deviceName?: string;
  platformVersion?: string;
  avd?: string;
  sessionTag?: string;
};

export async function deriveDeviceInfo(
  driver: Browser,
  email: string,
): Promise<DeviceInfo> {
  const caps = driver.capabilities as WebdriverIO.Capabilities & {
    udid?: string;
    deviceName?: string;
    platformVersion?: string;
    avd?: string;
  };

  const udid = (caps.udid || "").toString();
  if (!udid) throw new Error("Cannot derive UDID from capabilities");

  return {
    email,
    udid,
    deviceName: caps.deviceName,
    platformVersion: caps.platformVersion,
    avd: caps.avd,
  };
}
