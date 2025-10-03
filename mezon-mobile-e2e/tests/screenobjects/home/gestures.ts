export type SwipeDirection = "up" | "down" | "left" | "right";
export type SwipeProfile = "short" | "medium" | "long";

const PROFILE_PERCENT: Record<SwipeProfile, number> = {
    short: 0.4,
    medium: 0.65,
    long: 0.8,
};

type ElementRect = { x: number; y: number; width: number; height: number };

function pointsFor(dir: SwipeDirection, rect: ElementRect, pct: number) {
    const { x, y, width, height } = rect as ElementRect;
    const cx = Math.round(x + width * 0.5);
    const cy = Math.round(y + height * 0.5);

    const from = { x: cx, y: cy };
    const to = { x: cx, y: cy };

    switch (dir) {
        case "up":
            from.y = Math.round(y + height * 0.8);
            to.y = Math.round(from.y - height * pct);
            break;
        case "down":
            from.y = Math.round(y + height * 0.2);
            to.y = Math.round(from.y + height * pct);
            break;
        case "left":
            from.x = Math.round(x + width * 0.8);
            from.y = cy;
            to.x = Math.round(from.x - width * pct);
            to.y = cy;
            break;
        case "right":
            from.x = Math.round(x + width * 0.2);
            from.y = cy;
            to.x = Math.round(from.x + width * pct);
            to.y = cy;
            break;
    }
    return { from, to };
}

export async function swipe(
    el: any,
    dir: SwipeDirection,
    profile: SwipeProfile = "medium",
    holdMs = 100
) {
    const rect: ElementRect =
        typeof el.getRect === "function"
            ? await el.getRect()
            : (() => {
                  const loc =
                      typeof el.getLocation === "function"
                          ? el.getLocation()
                          : { x: 0, y: 0 };
                  const size =
                      typeof el.getSize === "function"
                          ? el.getSize()
                          : { width: 0, height: 0 };
                  return {
                      x: (loc as any).x || 0,
                      y: (loc as any).y || 0,
                      width: (size as any).width || 0,
                      height: (size as any).height || 0,
                  } as ElementRect;
              })();
    const { from, to } = pointsFor(dir, rect, PROFILE_PERCENT[profile]);

    try {
        if (browser.isAndroid) {
            await driver.execute("mobile: scrollGesture", {
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
                direction:
                    dir === "up"
                        ? "up"
                        : dir === "down"
                        ? "down"
                        : dir === "left"
                        ? "left"
                        : "right",
                percent: PROFILE_PERCENT[profile],
            } as any);
            return;
        }
        if (browser.isIOS) {
            await driver.execute("mobile: swipe", { direction: dir } as any);
            return;
        }
    } catch {}

    await el.touchAction([
        { action: "press", x: from.x, y: from.y },
        { action: "wait", ms: holdMs } as any,
        { action: "moveTo", x: to.x, y: to.y },
        { action: "release" },
    ]);
}

export async function longPress(el: any, durationMs = 600) {
    const rect: ElementRect =
        typeof el.getRect === "function"
            ? await el.getRect()
            : { x: 0, y: 0, width: 0, height: 0 };
    const cx = Math.round((rect.x || 0) + (rect.width || 0) * 0.5);
    const cy = Math.round((rect.y || 0) + (rect.height || 0) * 0.5);

    try {
        if (browser.isAndroid) {
            await driver.execute("mobile: longClickGesture", {
                x: cx,
                y: cy,
                duration: durationMs,
            } as any);
            return;
        }
        if (browser.isIOS) {
            await driver.execute("mobile: touchAndHold", {
                x: cx,
                y: cy,
                duration: durationMs / 1000,
            } as any);
            return;
        }
    } catch {}

    await el.touchAction([
        { action: "press", x: cx, y: cy },
        { action: "wait", ms: durationMs } as any,
        { action: "release" },
    ]);
}
