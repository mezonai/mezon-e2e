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
    sendFirstMessage: generateE2eSelector('onboarding.chat.container.send_first_message'),
    invitePeople: generateE2eSelector('onboarding.chat.container.invite_member'),
    createChannel: generateE2eSelector('onboarding.chat.container.create_channel'),
  };

  private readonly taskDoneIndicators = [
    'div.rounded-full.bg-green-600',
    'div.flex.items-center.justify-center.rounded-full.aspect-square.h-8.bg-green-600',
    '.bg-green-600.rounded-full',
    '.bg-green-600',
    'div.bg-green-600',
  ];

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
      const visible = await container.isVisible({ timeout: 3000 });
      if (!visible) return { found: false, isDone: false };
      for (const doneSelector of this.taskDoneIndicators) {
        try {
          const doneIndicator = container.locator(doneSelector).first();
          if (await doneIndicator.isVisible({ timeout: 800 })) {
            return { found: true, isDone: true, selector: containerSelector };
          }
        } catch {
          // ignore
          continue;
        }
      }

      return { found: true, isDone: false, selector: containerSelector };
    } catch {
      return { found: false, isDone: false };
    }
  }

  async waitForTaskToBeMarkedDone(
    taskType: OnboardingTaskType,
    timeoutMs: number = 5000
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const taskStatus = await this.getTaskStatus(taskType);

      if (taskStatus.found && taskStatus.isDone) {
        return true;
      }

      await this.page.waitForTimeout(500);
    }

    return false;
  }
}
