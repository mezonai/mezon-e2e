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
    // DmCalling and ModalCall currently have no test IDs or accessible button names.
    // The last green control is audio answer (the inline panel also has video answer).
    this.answerButton = page
      .locator('div.bg-green-500.cursor-pointer')
      .filter({ has: page.locator('svg') })
      .last();
    const fixedPanel =
      'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " fixed ")][1]';
    this.incomingPanel = this.answerButton.locator(fixedPanel);
    this.rejectButton = this.incomingPanel
      .locator('div.bg-red-500.cursor-pointer')
      .filter({ has: page.locator('svg .icon-CloseButton-fill-1') });
    this.endButton = page
      .locator('div.bg-red-500.cursor-pointer')
      .filter({ has: page.locator('svg .icon-StopCall-fill-1') });
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
    await expect(this.endButton).toBeVisible();
    // Mezon renders remote audio through an unmuted video element, even for voice calls.
    // A playing remote MediaStream verifies more than the caller's outgoing-call UI.
    await expect
      .poll(
        () =>
          this.activePanel.locator('video').evaluateAll(elements =>
            elements.some(element => {
              const video = element as HTMLVideoElement;
              const stream = video.srcObject;
              return (
                !video.muted &&
                stream instanceof MediaStream &&
                stream.getAudioTracks().some(track => track.readyState === 'live') &&
                video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
                video.currentTime > 0 &&
                !video.paused
              );
            })
          ),
        { timeout: 30000, message: 'DM call must receive and play remote audio' }
      )
      .toBe(true);
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
