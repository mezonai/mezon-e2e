import { type Page } from '@playwright/test';

export class OnboardingHelpers {
  constructor(private page: Page) {}

  async navigateToApp(): Promise<void> {
    const currentUrl = this.page.url();
    if (currentUrl.includes('dev-mezon.nccsoft.vn') && !currentUrl.includes('/chat')) {
      const openMezonSelectors = [
        'button:has-text("Open Mezon")',
        'a:has-text("Open Mezon")',
        '[data-testid="open-mezon"]',
        '.open-mezon-btn',
        'button[class*="open"]',
        'a[href*="/chat"]'
      ];
      
      let buttonFound = false;
      for (const selector of openMezonSelectors) {
        try {
          const button = this.page.locator(selector).first();
          if (await button.isVisible({ timeout: 3000 })) {
            await button.click();
            buttonFound = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!buttonFound) {
        await this.page.goto('/chat');
      }
      
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(3000);
    }
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

  async waitForTaskCompletion(taskType: 'sendFirstMessage' | 'invitePeople' | 'createChannel', timeoutMs = 10000): Promise<boolean> {
    const { OnboardingPage } = await import('../pages/OnboardingPage');
    const onboardingPage = new OnboardingPage(this.page);
    
    return await onboardingPage.waitForTaskToBeMarkedDone(taskType, timeoutMs);
  }
}
