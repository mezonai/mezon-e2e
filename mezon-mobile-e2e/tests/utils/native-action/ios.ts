import { IRequestScroll } from './interfaces/request-scroll.interface.js';

export class IosAction {
  static init() {
    return new IosAction();
  }

  private constructor() {}

  public async scrollGesture(request: Partial<IRequestScroll>) {
    const container = await $(request.containerSelectorIos);
    await container.waitForDisplayed({ timeout: 5000 });

    const r = await (container as any).getRect();
    const p = request.percent ?? 0.85;

    const centerX = Math.round(r.x + r.width / 2);
    const centerY = Math.round(r.y + r.height / 2);

    const deltaY = Math.round(r.height * p * 0.8);
    const deltaX = Math.round(r.width * p * 0.8);

    let fromX = centerX,
      fromY = centerY,
      toX = centerX,
      toY = centerY;

    switch (request.direction ?? 'down') {
      case 'down':
        fromY = Math.round(r.y + r.height * 0.8);
        toY = Math.max(r.y + 5, fromY - deltaY);
        break;
      case 'up':
        fromY = Math.round(r.y + r.height * 0.2);
        toY = Math.min(r.y + r.height - 5, fromY + deltaY);
        break;
      case 'left':
        fromX = Math.round(r.x + r.width * 0.8);
        toX = Math.max(r.x + 5, fromX - deltaX);
        break;
      case 'right':
        fromX = Math.round(r.x + r.width * 0.2);
        toX = Math.min(r.x + r.width - 5, fromX + deltaX);
        break;
    }

    await driver.execute('mobile: dragFromToForDuration', {
      duration: 0.2,
      fromX,
      fromY,
      toX,
      toY,
    });
  }
}
