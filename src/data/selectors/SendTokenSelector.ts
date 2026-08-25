import { generateE2eSelector } from '@/utils/generateE2eSelector';
import { Page } from '@playwright/test';

const SHORT_PROFILE_ACTION_STATUS_SELECTOR = generateE2eSelector(
  'short_profile.action.button.status'
);
const TRANSACTION_ITEM_AMOUNT_SELECTOR = generateE2eSelector(
  'send_token.modal.transaction_history.item.amount'
);

export default class SendTokenSelector {
  constructor(private readonly page: Page) {}

  readonly footerProfile = {
    avatar: this.page.locator(generateE2eSelector('footer_profile.avatar')),
  };

  readonly shortProfile = {
    displayName: this.page.locator(generateE2eSelector('short_profile.display_name')),
    username: this.page.locator(generateE2eSelector('short_profile.username')),
    balanceRow: this.page.locator(SHORT_PROFILE_ACTION_STATUS_SELECTOR, {
      hasText: 'Balance:',
    }),
    transferFundsRow: this.page.locator(SHORT_PROFILE_ACTION_STATUS_SELECTOR, {
      hasText: 'Transfer Funds',
    }),
    transactionHistoryRow: this.page.locator(SHORT_PROFILE_ACTION_STATUS_SELECTOR, {
      hasText: 'Transaction History',
    }),
  };

  readonly sendModal = {
    searchUserInput: this.page.locator(
      generateE2eSelector('send_token.modal.send.input.search_user')
    ),
    amountInput: this.page.locator(generateE2eSelector('send_token.modal.send.input.amount')),
    noteInput: this.page.locator(generateE2eSelector('send_token.modal.send.input.note')),
    selectItem: this.page.locator(generateE2eSelector('send_token.modal.send.select.item')),
    sendButton: this.page.locator(generateE2eSelector('button.base'), {
      hasText: 'Send Tokens',
    }),
    cancelButton: this.page.locator(generateE2eSelector('send_token.modal.send.button.cancel')),
  };

  readonly messageCard = {
    title: this.page.locator(generateE2eSelector('send_token.message.title')),
    detail: this.page.locator(generateE2eSelector('send_token.message.detail')),
    openHistoryButton: this.page.locator(
      generateE2eSelector('send_token.message.button.open_history')
    ),
  };

  readonly transactionHistory = {
    itemAmount: this.page.locator(TRANSACTION_ITEM_AMOUNT_SELECTOR),
    itemStatus: this.page.locator(
      generateE2eSelector('send_token.modal.transaction_history.item.status')
    ),
    itemTime: this.page.locator(
      generateE2eSelector('send_token.modal.transaction_history.item.time')
    ),
    openDetailButton: this.page.locator(
      generateE2eSelector('send_token.modal.transaction_history.item.button.open_detail')
    ),
    closeTransactionButton: this.page.locator(
      generateE2eSelector('send_token.modal.transaction_history.item.button.close_transaction')
    ),
    detailLabel: this.page.locator(
      generateE2eSelector('send_token.modal.transaction_history.item.detail.label')
    ),
    detailValue: this.page.locator(
      generateE2eSelector('send_token.modal.transaction_history.item.detail.value')
    ),
  };
}
