import { generateE2eSelector } from '@/utils/generateE2eSelector';
import type { OnboardingTaskType } from '@/types/onboarding.types';
import { Locator, Page } from '@playwright/test';

const MENTION_INPUT_SELECTOR = generateE2eSelector('mention.input');
const BASE_BUTTON_SELECTOR = generateE2eSelector('button.base');
const GUIDE_LABEL_SELECTOR = generateE2eSelector('onboarding.clan_guide_page.label');

export default class ClanOnboardingSelector {
  constructor(private readonly page: Page) {}

  readonly status = this.page.locator(
    generateE2eSelector('clan_page.settings.sidebar.onboarding_status')
  );

  readonly guideCandidates = [
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

  readonly taskDoneIndicators = [
    'div.rounded-full.bg-green-600',
    'div.flex.items-center.justify-center.rounded-full.aspect-square.h-8.bg-green-600',
    '.bg-green-600.rounded-full',
    '.bg-green-600',
    'div.bg-green-600',
  ];

  getTaskContainerSelector(taskType: OnboardingTaskType): string {
    const labels: Record<OnboardingTaskType, string> = {
      sendFirstMessage: 'Send your first message',
      invitePeople: 'Invite your friends',
      createChannel: 'Create your channel',
    };

    return `${generateE2eSelector('onboarding.chat.guide_sections')}, div:has-text("${labels[taskType]}")`;
  }

  getTaskContainer(taskType: OnboardingTaskType): Locator {
    return this.page.locator(this.getTaskContainerSelector(taskType)).first();
  }

  readonly buttons = {
    enableOnboarding: this.page.locator(
      generateE2eSelector('clan_page.settings.onboarding.button.enable_onboarding')
    ),
    back: this.page.locator(generateE2eSelector('clan_page.settings.onboarding.button.back')),
    disableOnboarding: this.page.locator(
      generateE2eSelector('clan_page.settings.onboarding.button.disable_onboarding')
    ),
    openPreviewMode: this.page.locator(
      generateE2eSelector('clan_page.settings.onboarding.button.open_preview_mode')
    ),
    closePreviewMode: this.page.locator(
      generateE2eSelector('clan_page.settings.onboarding.button.close_preview_mode')
    ),
  };

  readonly setupQuestion = {
    item: this.page.locator(
      generateE2eSelector('clan_page.settings.onboarding.button.setup_question')
    ),
    input: {
      question: this.page.locator(
        generateE2eSelector('clan_page.settings.onboarding.input.question')
      ),
      answerTitle: this.page.locator(`${MENTION_INPUT_SELECTOR}[placeholder="Enter an answer..."]`),
      answerDescription: this.page.locator(
        `${MENTION_INPUT_SELECTOR}[placeholder="Enter a description... (optional)"]`
      ),
    },
    button: {
      confirmAnswer: this.page.locator(BASE_BUTTON_SELECTOR, { hasText: 'Save' }),
      saveQuestion: this.page.locator(
        generateE2eSelector('clan_page.settings.onboarding.button.save_change')
      ),
      addQuestion: this.page.locator(
        generateE2eSelector('clan_page.settings.onboarding.button.add_question')
      ),
      addAnswer: this.page.locator(BASE_BUTTON_SELECTOR, {
        hasText: 'Add an Answer',
      }),
      removeQuestion: this.page.locator(
        generateE2eSelector('clan_page.settings.onboarding.button.remove_question')
      ),
      removeAnswer: this.page.locator(BASE_BUTTON_SELECTOR, { hasText: 'Remove' }),
      questionItem: this.page.locator(
        generateE2eSelector('clan_page.settings.onboarding.question.item')
      ),
      saveAll: this.page.locator(
        generateE2eSelector('clan_page.settings.onboarding.button.save_all')
      ),
    },
  };

  readonly clanGuideSettings = {
    item: this.page.locator(generateE2eSelector('clan_page.settings.onboarding.button.clan_guide')),
    buttons: {
      addTask: this.page.locator(
        generateE2eSelector('clan_page.settings.onboarding.button.add_task')
      ),
    },
    input: {
      taskTitle: this.page.locator(
        `${MENTION_INPUT_SELECTOR}[placeholder="Ex. Post a photo of your pet"]`
      ),
    },
  };

  readonly clanGuidePage = {
    sidebar: this.page.locator(generateE2eSelector('clan_page.side_bar.button.clan_guide')),
    questionLabel: this.page.locator(GUIDE_LABEL_SELECTOR, {
      hasText: 'Questions',
    }),
    resourceLabel: this.page.locator(GUIDE_LABEL_SELECTOR, {
      hasText: 'Resources',
    }),
    missionLabel: this.page.locator(GUIDE_LABEL_SELECTOR, {
      hasText: 'Missions',
    }),
    title: this.page.locator(generateE2eSelector('onboarding.clan_guide_page.title')),
    description: this.page.locator(generateE2eSelector('onboarding.clan_guide_page.description')),
    action: this.page.locator(generateE2eSelector('onboarding.clan_guide_page.action')),
    question: this.page.locator(generateE2eSelector('onboarding.clan_guide_page.question')),
  };
}
