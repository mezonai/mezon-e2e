// infra/session-scoped-globals.ts
import type { Browser, MultiRemoteBrowser } from "webdriverio";
import { capabilities } from "./capabilities.js";
import { ManageDrive } from "./manage-drive.js";

export type MRBrowser<K extends string> = MultiRemoteBrowser &
    Record<K, Browser>;

export function installSessionScopedGlobals<
    K extends keyof typeof capabilities
>(mr: MRBrowser<K>) {
    const orig$ = global.$;
    const orig$$ = global.$$;
    const origBrowser$ = (global.browser as any)?.$;
    const origBrowser$$ = (global.browser as any)?.$$;

    const hadDriver = Object.prototype.hasOwnProperty.call(globalThis, 'driver');
    const origDriver = (globalThis as any).driver;

    function pickBrowser(): Browser {
        const isMulti = Boolean((global.browser as any)?.isMultiremote);
        if (!isMulti) return global.browser as unknown as Browser;
        const key = ManageDrive.currentSession();
        if (!key) {
            throw new Error(
                'No session bound for multiremote. Wrap code in runWithSession("driverA" | "driverB" | "driverC", fn).'
            );
        }
        return (mr as any)[key] as Browser;
    }

    // @ts-ignore override WDIO globals
    global.$ = ((sel: string) => pickBrowser().$(sel)) as typeof global.$;
    // @ts-ignore
    global.$$ = ((sel: string) => pickBrowser().$$(sel)) as typeof global.$$;

    // Also patch browser level helpers so browser.$ won't broadcast
    if ((global.browser as any)) {
        try {
            // @ts-ignore
            (global.browser as any).$ = (sel: string) => pickBrowser().$(sel);
            // @ts-ignore
            (global.browser as any).$$ = (sel: string) => pickBrowser().$$(sel);
        } catch {}
    }
  let usedGetter = false;
  try {
    Object.defineProperty(globalThis as any, 'driver', {
      configurable: true,
      get: () => pickBrowser(),
    });
    Object.defineProperty(globalThis as any, 'activeDriver', {
      configurable: true,
      get: () => pickBrowser(),
    });
    usedGetter = true;
  } catch {
  }

    return () => {
        global.$ = orig$;
        global.$$ = orig$$;
        if ((global.browser as any)) {
            try {
                (global.browser as any).$ = origBrowser$;
                (global.browser as any).$$ = origBrowser$$;
            } catch {}
        }
        if (usedGetter) {
            try {
              if (hadDriver) {
                Object.defineProperty(globalThis as any, 'driver', { configurable: true, writable: true, value: origDriver });
              } else {
                // @ts-ignore
                delete (globalThis as any).driver;
              }
              // @ts-ignore
              delete (globalThis as any).activeDriver;
            } catch {}
          }
    };
}
