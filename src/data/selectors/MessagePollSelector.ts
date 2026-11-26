import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

export default class MessagePollSelector {
  constructor(private readonly page: Page) {}

  readonly button = {
    openModal: this.page
      .locator(generateE2eSelector('poll.button.open_modal'))
      .or(
        this.page.locator(
          '[data-e2e*="button_plus"], [data-e2e="mention-selected_file"] div[class*="cursor-pointer"]'
        )
      )
      .first(),
    option: this.page
      .locator(generateE2eSelector('poll.button.option'))
      .or(
        this.page.locator(
          'button:has-text("Create Poll"), div[role="menuitem"]:has-text("Create Poll")'
        )
      ),
    endPoll: this.page
      .locator(generateE2eSelector('chat.message_action.button.end_poll'))
      .or(this.page.locator(generateE2eSelector('chat.message_action_modal.button.base')))
      .filter({ hasText: /End Poll Now|Kết thúc bình chọn/i }),
  };

  readonly modal = {
    input: {
      question: this.page.locator(generateE2eSelector('poll.modal.input.question')),
      answer: this.page.locator(generateE2eSelector('poll.modal.input.answer')),
      allowMultiAnswer: this.page.locator(
        generateE2eSelector('poll.modal.input.allow_multi_answer')
      ),
    },
    button: {
      addAnswer: this.page.locator(generateE2eSelector('poll.modal.button.add_answer')),
      openDuration: this.page.locator(generateE2eSelector('poll.modal.button.open_duration')),
      chooseDuration: this.page.locator(generateE2eSelector('poll.modal.button.choose_duration')),
      deleteAnswer: this.page.locator(generateE2eSelector('poll.modal.button.delete_answer')),
      post: this.page.locator(generateE2eSelector('poll.modal.button.post')),
    },
  };

  readonly card = {
    question: this.page
      .locator(generateE2eSelector('poll.card.question'))
      .or(
        this.page.locator(
          '[data-e2e*="poll_card"], div[class*="poll"] h3, div[class*="poll"] p, [data-e2e*="question"]'
        )
      )
      .first(),
    ended: this.page
      .locator(generateE2eSelector('poll.card.ended'))
      .or(this.page.locator('text=/Final Results|Poll Ended|Đã kết thúc/i, [data-e2e*="ended"]'))
      .first(),
    answerDescription: this.page.locator(generateE2eSelector('poll.card.answer_description')),
    answer: this.page
      .locator(generateE2eSelector('poll.card.answer'))
      .or(this.page.locator('[data-e2e*="poll"] [data-e2e*="answer"], div[class*="poll"] button')),
    voted: this.page
      .locator(generateE2eSelector('poll.card.voted'))
      .or(this.page.locator('[data-e2e*="voted"], svg.mz-i-check, .mz-i-check'))
      .first(),
    totalVotes: this.page
      .locator(generateE2eSelector('poll.card.total_votes'))
      .or(this.page.locator('text=/vote/i, [data-e2e*="total_vote"]'))
      .first(),
    button: {
      showResult: this.page.locator(generateE2eSelector('poll.card.button.show_result')),
      vote: this.page
        .locator(generateE2eSelector('poll.card.button.vote'))
        .or(this.page.locator('button:has-text("Vote"), [data-e2e*="vote_button"]'))
        .first(),
      removeVote: this.page
        .locator(generateE2eSelector('poll.card.button.remove_vote'))
        .or(this.page.locator('button:has-text("Remove Vote"), button:has-text("Retract")'))
        .first(),
    },
  };
}
