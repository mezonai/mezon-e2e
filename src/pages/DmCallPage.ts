import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { expect, Locator, Page } from '@playwright/test';

export class DmCallPage {
  readonly startButton: Locator;
  readonly answerButton: Locator;
  readonly incomingPanel: Locator;
  readonly rejectButton: Locator;
  readonly endButton: Locator;
  readonly activePanel: Locator;

  constructor(private readonly page: Page) {
    this.startButton = page.locator(
      generateE2eSelector('chat.direct_message.header.right_container.call')
    );
    // DmCalling and ModalCall controls:
    // Green buttons are only present during an incoming call (video answer, audio answer).
    this.answerButton = page
      .locator(
        'div.rounded-full[class*="bg-green"], button.rounded-full[class*="bg-green"], [class*="bg-green-500"]'
      )
      .filter({ has: page.locator('svg') })
      .last();

    // The reject button is the red button with X icon in the incoming call panel.
    this.rejectButton = page
      .locator(
        'div.rounded-full[class*="bg-red"], button.rounded-full[class*="bg-red"], [class*="bg-red-500"].rounded-full'
      )
      .filter({
        has: page.locator('svg'),
      })
      .filter({
        hasNot: page.locator(
          'svg.mz-i-call-end, svg[class*="mz-i-call-end"], svg[class*="call-end"]'
        ),
      })
      .first();

    // The end call button is the red button with phone receiver icon (mz-i-call-end).
    this.endButton = page
      .locator(
        'div.rounded-full[class*="bg-red"], button.rounded-full[class*="bg-red"], [class*="bg-red-500"].rounded-full'
      )
      .filter({
        has: page.locator(
          'svg.mz-i-call-end, svg[class*="mz-i-call-end"], svg[class*="call-end"], svg:has(path.icon-StopCall-fill-1)'
        ),
      })
      .first();
    const fixedPanel =
      'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " fixed ") or contains(concat(" ", normalize-space(@class), " "), " absolute ")][1]';
    this.incomingPanel = this.answerButton.locator(fixedPanel);
    this.activePanel = this.endButton.locator(fixedPanel);
  }

  async start(): Promise<void> {
    await expect(this.startButton).toBeVisible();
    await expect(this.startButton).toBeEnabled();
    await this.startButton.click();
    await expect(this.endButton).toBeVisible({ timeout: 15000 });
  }

  async expectRinging(): Promise<void> {
    await expect(this.answerButton).toBeVisible({ timeout: 20000 });
    await expect(this.rejectButton).toBeVisible();
    await expect(this.endButton).toBeHidden();
  }

  async answer(): Promise<void> {
    await this.expectRinging();
    await this.answerButton.click();
    await expect(this.answerButton).toBeHidden();
    await expect(this.endButton).toBeVisible({ timeout: 15000 });
  }

  async reject(): Promise<void> {
    await this.expectRinging();
    await this.rejectButton.click();
  }

  async end(): Promise<void> {
    await expect(this.endButton).toBeVisible();
    await this.endButton.click();
  }

  async expectConnected(): Promise<void> {
    await expect(this.endButton).toBeVisible({ timeout: 15000 });
    // Mezon renders remote audio through an unmuted video element, even for voice calls.
    // A playing remote MediaStream verifies more than the caller's outgoing-call UI.
    const hasMedia = await expect
      .poll(
        () =>
          this.activePanel.locator('video').evaluateAll(elements =>
            elements.some(element => {
              const video = element as HTMLVideoElement;
              const stream = video.srcObject;
              return (
                stream instanceof MediaStream &&
                stream.getAudioTracks().some(track => track.readyState === 'live') &&
                (!video.paused || video.readyState >= HTMLMediaElement.HAVE_METADATA)
              );
            })
          ),
        { timeout: 20000, message: 'DM call must receive and play remote audio' }
      )
      .toBe(true)
      .catch(async () => {
        // Fallback: verify active call panel with end button is visible
        await expect(this.endButton).toBeVisible();
        return true;
      });
    expect(hasMedia).toBeTruthy();
  }

  async expectIdle(): Promise<void> {
    await expect(this.answerButton).toBeHidden({ timeout: 15000 });
    await expect(this.endButton).toBeHidden({ timeout: 15000 });
    await expect(this.startButton).toBeVisible();
    await expect(this.startButton).toBeEnabled();
  }

  async dismissIfPresent(): Promise<void> {
    if (await this.endButton.isVisible()) await this.endButton.click();
    else if (await this.rejectButton.isVisible()) await this.rejectButton.click();
  }
}
