import { type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { generateE2eSelector } from '@/utils/generateE2eSelector';
import type { OnboardingTaskType } from '@/types/onboarding.types';

export class OnboardingPage extends BasePage {
  private readonly onboardingGuideSelectors = [
    '[data-testid="onboarding-guide"]',
    '.onboarding-guide',
    'div:has-text("Onboarding guide")',
    'div:has-text("Invite your friends")',
    '.invite-friends-container',
    '[aria-label*="onboarding" i]',
    '.guide-container',
    '.onboarding-container',
    'div:has(div:has-text("Invite your friends"))',
  ];

  private readonly taskContainerSelectorByType: Record<OnboardingTaskType, string> = {
    sendFirstMessage: `${generateE2eSelector('onboarding.chat.guide_sections')}:has-text("Send your first message")`,
    invitePeople: `${generateE2eSelector('onboarding.chat.guide_sections')}:has-text("Invite your friends")`,
    createChannel: `${generateE2eSelector('onboarding.chat.guide_sections')}:has-text("Create your channel")`,
    tickGreen: generateE2eSelector('onboarding.chat.tick'),
  };


  constructor(page: Page, baseURL?: string) {
    super(page, baseURL);
  }

  async openOnboardingGuide(): Promise<boolean> {
    for (const selector of this.onboardingGuideSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          await element.click();
          await this.page.waitForTimeout(500);
          return true;
        }
      } catch {
        // Ignore errors
        continue;
      }
    }

    return false;
  }

  async isOnboardingGuideVisible(): Promise<boolean> {
    for (const selector of this.onboardingGuideSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          return true;
        }
      } catch {
        // Ignore errors
        continue;
      }
    }
    return false;
  }

  async getTaskStatus(
    taskType: OnboardingTaskType
  ): Promise<{ found: boolean; isDone: boolean; selector?: string }> {
    const containerSelector = this.taskContainerSelectorByType[taskType];
    const container = this.page.locator(containerSelector).first();
    try {
      const visible = await container.isVisible({ timeout: 2000 });
      if (!visible) return { found: false, isDone: false };
      const greenCheckmark = container.locator(generateE2eSelector('onboarding.chat.tick')).first();
      if (await greenCheckmark.isVisible({ timeout: 500 })) {
        return { found: true, isDone: true, selector: containerSelector };
      }
      for (const doneSelector of this.taskContainerSelectorByType.tickGreen) {
        try {
          const doneIndicator = container.locator(doneSelector).first();
          if (await doneIndicator.isVisible({ timeout: 300 })) {
            return { found: true, isDone: true, selector: containerSelector };
          }
        } catch (error) {
          console.error(`Error checking task status: ${error}`);
        }
      }

      return { found: true, isDone: false, selector: containerSelector };
    } catch {
      return { found: false, isDone: false };
    }
  }

  async waitForTaskToBeMarkedDone(
    taskType: OnboardingTaskType,
    timeoutMs: number = 10000
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const taskStatus = await this.getTaskStatus(taskType);

      if (taskStatus.found && taskStatus.isDone) {
        return true;
      }

      await this.page.waitForTimeout(1000);
    }

    return false;
  }
}
