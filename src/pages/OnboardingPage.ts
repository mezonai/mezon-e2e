import ClanSelector from '@/data/selectors/ClanSelector';
import type { OnboardingTaskType } from '@/types/onboarding.types';
import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class OnboardingPage extends BasePage {
  private readonly selector: ClanSelector;
  constructor(page: Page, baseURL?: string) {
    super(page, baseURL);
    this.selector = new ClanSelector(page);
  }
  async openOnboardingGuide(): Promise<boolean> {
    for (const selector of this.selector.onboarding.guideCandidates) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          await element.click();
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
    for (const selector of this.selector.onboarding.guideCandidates) {
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
    const containerSelector = this.selector.onboarding.getTaskContainerSelector(taskType);
    const container = this.selector.onboarding.getTaskContainer(taskType);

    try {
      const visible = await container.isVisible({ timeout: 3000 });
      if (!visible) return { found: false, isDone: false };
      for (const doneSelector of this.selector.onboarding.taskDoneIndicators) {
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
    }

    return false;
  }

  async verifyEnableOnboardingOnClanSettingsSidebar(shouldEnable = true) {
    const onboardingStatus = this.selector.onboarding.status;
    const buttonDisable = this.selector.onboarding.buttons.disableOnboarding;
    if (shouldEnable) {
      await expect(onboardingStatus).toHaveText('ON');
      await expect(buttonDisable).toBeVisible({ timeout: 3000 });
    } else {
      await expect(onboardingStatus).toHaveText('OFF');
      await expect(buttonDisable).toBeHidden({ timeout: 3000 });
    }
  }

  async openOnboardingTab() {
    const onboardingSidebar = this.selector.clanSettings.buttons.sidebarItem.filter({
      hasText: 'Onboarding',
    });
    await onboardingSidebar.click();
  }

  async clickEnableOnboarding() {
    await this.selector.onboarding.buttons.enableOnboarding.click();
  }

  async clickDisableOnboarding() {
    await this.selector.onboarding.buttons.disableOnboarding.click();
  }

  async addPrequestionOnboaring(question: string, answerTitle: string, answerDescription: string) {
    await this.selector.onboarding.setupQuestion.item.click();
    await this.selector.onboarding.setupQuestion.button.addQuestion.click();
    await expect(this.selector.onboarding.setupQuestion.button.questionItem.first()).toBeVisible({
      timeout: 5000,
    });
    await this.selector.onboarding.setupQuestion.button.questionItem.first().click();
    await expect(this.selector.onboarding.setupQuestion.input.question).toBeVisible({
      timeout: 5000,
    });
    await this.selector.onboarding.setupQuestion.input.question.fill(question);
    await this.selector.onboarding.setupQuestion.button.addAnswer.click();
    await expect(this.selector.onboarding.setupQuestion.input.answerTitle).toBeVisible({
      timeout: 5000,
    });
    await this.selector.onboarding.setupQuestion.input.answerTitle.fill(answerTitle);
    await this.selector.onboarding.setupQuestion.input.answerDescription.fill(answerDescription);
    await this.selector.onboarding.setupQuestion.button.confirmAnswer.click();
    await this.selector.onboarding.setupQuestion.button.saveQuestion.click();
    await this.selector.onboarding.setupQuestion.button.saveAll.click();
  }

  async addTaskOnboarding(taskName: string) {
    await this.selector.onboarding.clanGuideSettings.item.click();
    await this.selector.onboarding.clanGuideSettings.buttons.addTask.click();
    await this.selector.onboarding.clanGuideSettings.input.taskTitle.fill(taskName);
    await this.selector.onboarding.setupQuestion.button.confirmAnswer.click();
    await expect(this.selector.onboarding.setupQuestion.button.confirmAnswer).toBeHidden({
      timeout: 3000,
    });
  }

  async clickBackOnboardingModal() {
    await this.selector.onboarding.buttons.back.click();
  }

  async verifyOnboardingPageVisible(shouldVisible = true) {
    const clanGuideSidebar = this.selector.onboarding.clanGuidePage.sidebar;
    if (shouldVisible) {
      await expect(clanGuideSidebar).toBeVisible({ timeout: 3000 });
    } else {
      await expect(clanGuideSidebar).toBeHidden({ timeout: 3000 });
    }
  }

  async openOnboardingPage() {
    const clanGuideSidebar = this.selector.onboarding.clanGuidePage.sidebar;
    await clanGuideSidebar.click();
  }

  async verifyOnboardingSetupByType(
    type: 'question' | 'resource' | 'mission',
    title: string,
    description?: string,
    question?: string
  ) {
    const {
      question: questionLocator,
      title: titleLocator,
      description: descriptionLocator,
    } = this.selector.onboarding.clanGuidePage;

    switch (type) {
      case 'question': {
        if (!question) return;

        await expect(questionLocator.first()).toHaveText(question);
        await expect(titleLocator.first()).toHaveText(title);

        if (description) {
          await expect(descriptionLocator.first()).toHaveText(description);
        }
        break;
      }

      case 'resource':
      case 'mission': {
        await expect(titleLocator.last()).toHaveText(title);

        if (description) {
          await expect(descriptionLocator.last()).toHaveText(description);
        }
        break;
      }

      default:
        throw new Error(`Unsupported onboarding type: ${type}`);
    }
  }

  async openOnboardingPreviewMode() {
    await this.selector.onboarding.buttons.openPreviewMode.click();
  }

  async closeOnboardingPreviewMode() {
    await this.selector.onboarding.buttons.closePreviewMode.click();
  }
}
