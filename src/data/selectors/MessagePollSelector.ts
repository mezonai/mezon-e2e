import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

export default class MessagePollSelector {
  constructor(private readonly page: Page) {}

  readonly button = {
    openModal: this.page.locator(generateE2eSelector('poll.button.open_modal')),
    option: this.page.locator(generateE2eSelector('poll.button.option')),
    endPoll: this.page
      .locator(generateE2eSelector('chat.message_action_modal.button.base'))
      .filter({ hasText: 'End Poll Now' }),
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
    question: this.page.locator(generateE2eSelector('poll.card.question')),
    ended: this.page.locator(generateE2eSelector('poll.card.ended')),
    answerDescription: this.page.locator(generateE2eSelector('poll.card.answer_description')),
    answer: this.page.locator(generateE2eSelector('poll.card.answer')),
    voted: this.page.locator(generateE2eSelector('poll.card.voted')),
    totalVotes: this.page.locator(generateE2eSelector('poll.card.total_votes')),
    button: {
      showResult: this.page.locator(generateE2eSelector('poll.card.button.show_result')),
      vote: this.page.locator(generateE2eSelector('poll.card.button.vote')),
      removeVote: this.page.locator(generateE2eSelector('poll.card.button.remove_vote')),
    },
  };
}
