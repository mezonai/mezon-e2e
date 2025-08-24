import { type Page } from '@playwright/test';
import { BasePage } from './BasePage';

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

  private readonly taskSelectors = {
    sendFirstMessage: [
      'div:has-text("Send your first message")',
      'div.flex-1:has-text("Send your first message")',
      '[data-testid="task-send-message"]',
      'div:has-text("Send first message")',
      '.task-item:has-text("Send first message")',
      '[aria-label*="send first message" i]',
    ],
    invitePeople: [
      '[data-testid="task-invite-people"]',
      'div:has-text("Invite your friends")',
      'div:has-text("Invite People")',
      '.task-item:has-text("Invite")',
      '[aria-label*="invite" i]',
    ],
    createChannel: [
      '[data-testid="task-create-channel"]',
      'div:has-text("Create channel")',
      'div:has-text("Create your first channel")',
      '.task-item:has-text("Create channel")',
      '[aria-label*="create channel" i]',
    ],
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

  async getTaskStatus(taskType: 'sendFirstMessage' | 'invitePeople' | 'createChannel'): Promise<{
    found: boolean;
    isDone: boolean;
    selector?: string;
  }> {
    const onboardingArea = this.page.locator('div:has-text("Invite your friends")').first();
    const allTaskRows = onboardingArea.locator('div.w-\\[400px\\].gap-4');
    const rowCount = await allTaskRows.count();

    for (let i = 0; i < rowCount; i++) {
      try {
        const row = allTaskRows.nth(i);
        const rowText = await row.textContent();

        const isCorrectRow =
          (taskType === 'sendFirstMessage' && rowText?.includes('Send your first message')) ||
          (taskType === 'invitePeople' && rowText?.includes('Invite your friends')) ||
          (taskType === 'createChannel' && rowText?.includes('Create your channel'));

        if (isCorrectRow) {
          let isDone = false;
          for (const doneSelector of this.taskDoneIndicators) {
            try {
              const doneIndicator = row.locator(doneSelector).first();
              if (await doneIndicator.isVisible({ timeout: 1000 })) {
                isDone = true;

                break;
              }
            } catch {
              // Ignore errors
              continue;
            }
          }

          return { found: true, isDone, selector: `row-${i}` };
        }
      } catch {
        // Ignore errors
        continue;
      }
    }

    return { found: false, isDone: false };
  }

  async getAllTasksStatus(): Promise<{
    sendFirstMessage: { found: boolean; isDone: boolean };
    invitePeople: { found: boolean; isDone: boolean };
    createChannel: { found: boolean; isDone: boolean };
  }> {
    const sendFirstMessage = await this.getTaskStatus('sendFirstMessage');
    const invitePeople = await this.getTaskStatus('invitePeople');
    const createChannel = await this.getTaskStatus('createChannel');

    return {
      sendFirstMessage: { found: sendFirstMessage.found, isDone: sendFirstMessage.isDone },
      invitePeople: { found: invitePeople.found, isDone: invitePeople.isDone },
      createChannel: { found: createChannel.found, isDone: createChannel.isDone },
    };
  }

  // async waitForTaskToBeMarkedDone(taskType: 'sendFirstMessage' | 'invitePeople' | 'createChannel', timeoutMs: number = 5000): Promise<boolean> {
  //   console.log(`Waiting for task "${taskType}" to be marked as done...`);

  //   const startTime = Date.now();

  //   while (Date.now() - startTime < timeoutMs) {
  //     const taskStatus = await this.getTaskStatus(taskType);

  //     if (taskStatus.found && taskStatus.isDone) {
  //       console.log(`Task "${taskType}" is now marked as done!`);
  //       return true;
  //     }

  //     await this.page.waitForTimeout(500);
  //   }

  //   console.log(`Task "${taskType}" was not marked as done within ${timeoutMs}ms`);
  //   return false;
  // }

  async debugOnboardingTasks(): Promise<void> {
    console.log('Debugging onboarding tasks...');

    await this.takeScreenshot('debug-onboarding-tasks');

    const allTasks = this.page.locator(
      'div:has-text("Send first message"), div:has-text("Invite People"), div:has-text("Create channel"), .task-item, .onboarding-task'
    );
    const count = await allTasks.count();

    console.log(`Found ${count} potential task elements`);

    for (let i = 0; i < Math.min(count, 10); i++) {
      try {
        const task = allTasks.nth(i);
        const isVisible = await task.isVisible();
        const text = await task.textContent();

        if (isVisible && text) {
          console.log(`  Task ${i}: "${text.slice(0, 50)}..."`);

          const hasDoneIndicator = await task
            .locator(this.taskDoneIndicators.join(', '))
            .first()
            .isVisible()
            .catch(() => false);
          console.log(`Done indicator: ${hasDoneIndicator}`);
        }
      } catch {
        // Ignore errors
        console.log(`  Task ${i}: Could not inspect`);
      }
    }
  }
  async waitForTaskToBeMarkedDone(
    taskType: 'sendFirstMessage' | 'invitePeople' | 'createChannel',
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
