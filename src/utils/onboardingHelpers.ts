import { type Page } from '@playwright/test';
import type { OnboardingTaskType } from '@/types/onboarding.types';
export class OnboardingHelpers {
  readonly page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  async createTestClan(clanName: string): Promise<{ clicked: boolean; created: boolean }> {
    const { ClanPage } = await import('../pages/ClanPage');
    const clanPage = new ClanPage(this.page);

    const clicked = await clanPage.clickCreateClanButton();
    if (!clicked) return { clicked: false, created: false };

    const created = await clanPage.createNewClan(clanName);
    return { clicked, created };
  }

  async ensureOnboardingGuideVisible(): Promise<void> {
    const { OnboardingPage } = await import('../pages/OnboardingPage');
    const onboardingPage = new OnboardingPage(this.page);

    const visible = await onboardingPage.isOnboardingGuideVisible();
    if (!visible) {
      await onboardingPage.openOnboardingGuide();
    }
  }

  async sendTestMessage(): Promise<{ sent: boolean; verified: boolean; message: string }> {
    const { ClanPage } = await import('../pages/ClanPage');
    const clanPage = new ClanPage(this.page);

    const message = `Hello! This is my first message - ${Date.now()}`;
    const sent = await clanPage.sendFirstMessage(message);
    const verified = sent ? await clanPage.verifyMessageSent(message) : false;

    return { sent, verified, message };
  }

  async waitForTaskCompletion(taskType: OnboardingTaskType, timeoutMs = 10000): Promise<boolean> {
    const { OnboardingPage } = await import('../pages/OnboardingPage');
    const onboardingPage = new OnboardingPage(this.page);

    return await onboardingPage.waitForTaskToBeMarkedDone(taskType, timeoutMs);
  }
}
