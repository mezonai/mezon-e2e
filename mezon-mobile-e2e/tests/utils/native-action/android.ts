import { IRequestScroll } from './interfaces/index.js';

export class AndroidAction {
  static init() {
    return new AndroidAction();
  }

  private constructor() {}

  public async scrollGesture(request: Partial<IRequestScroll>) {
    const container = await $(request.containerSelectorAndroid);
    await container.waitForDisplayed({ timeout: 5000 });

    try {
      await driver.execute('mobile: scrollGesture', {
        elementId: container.elementId,
        direction: request.direction ?? 'down',
        percent: request.percent ?? 0.85,
      });
    } catch (e) {
      const r = await (container as any).getRect();
      await driver.execute('mobile: scrollGesture', {
        left: r.x,
        top: r.y,
        width: r.width,
        height: r.height,
        direction: request.direction ?? 'down',
        percent: request.percent ?? 0.85,
      });
    }
  }
}
