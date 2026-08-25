import SendTokenSelector from '@/data/selectors/SendTokenSelector';
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class SendTokenModal extends BasePage {
  private readonly selector: SendTokenSelector;

  constructor(page: Page) {
    super(page);
    this.selector = new SendTokenSelector(page);
  }

  async openShortProfileFromFooter(): Promise<void> {
    await this.selector.footerProfile.avatar.click();
    await this.page.waitForTimeout(1000);
  }

  async closeShortProfile(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  async getBalanceFromShortProfile(): Promise<number> {
    const balanceRow = this.selector.shortProfile.balanceRow;
    await expect(balanceRow).toBeVisible({ timeout: 5000 });
    const balanceText = await balanceRow.locator('li').innerText();
    const digits = balanceText.replace(/[^\d]/g, '');
    return parseInt(digits, 10);
  }

  async openSendTokenModalFromShortProfile(): Promise<void> {
    await expect(this.selector.shortProfile.transferFundsRow).toBeVisible({ timeout: 5000 });
    await this.selector.shortProfile.transferFundsRow.click();
  }

  async verifySendTokenModalVisible(): Promise<void> {
    await expect(this.selector.sendModal.searchUserInput).toBeVisible({ timeout: 5000 });
    await expect(this.selector.sendModal.amountInput).toBeVisible({ timeout: 5000 });
    await expect(this.selector.sendModal.noteInput).toBeVisible({ timeout: 5000 });
  }

  async verifySendTokenModalHidden(): Promise<void> {
    await expect(this.selector.sendModal.searchUserInput).toBeHidden({ timeout: 15000 });
  }

  async openTransactionHistoryFromShortProfile(): Promise<void> {
    await this.page.waitForTimeout(3000);
    await this.selector.shortProfile.transactionHistoryRow.click();
  }

  async searchAndSelectUser(username: string): Promise<void> {
    await expect(this.selector.sendModal.searchUserInput).toBeVisible({ timeout: 5000 });
    await this.selector.sendModal.searchUserInput.fill(username);
    const userItem = this.selector.sendModal.selectItem.filter({ hasText: username }).first();
    await expect(userItem).toBeVisible({ timeout: 5000 });
    await userItem.click();
  }

  async fillAmount(amount: string): Promise<void> {
    await this.selector.sendModal.amountInput.fill(amount);
    await this.page.waitForTimeout(1000);
  }

  async fillNote(note: string): Promise<void> {
    await this.selector.sendModal.noteInput.fill(note);
    await expect(this.selector.sendModal.noteInput).toHaveValue(note);
  }

  async isSendButtonDisabled(): Promise<boolean> {
    const sendButton = this.selector.sendModal.sendButton;
    await expect(sendButton).toBeVisible({ timeout: 5000 });
    return await sendButton.isDisabled();
  }

  async clickSend(): Promise<void> {
    await expect(this.selector.sendModal.sendButton).toBeEnabled({ timeout: 5000 });
    await this.selector.sendModal.sendButton.click();
    await expect(this.selector.sendModal.searchUserInput).toBeHidden({ timeout: 15000 });
  }

  async clickCancel(): Promise<void> {
    await this.selector.sendModal.cancelButton.click();
    await expect(this.selector.sendModal.searchUserInput).toBeHidden({ timeout: 5000 });
  }

  async verifySendTokenCardInDM(note: string): Promise<void> {
    const title = this.selector.messageCard.title.last();
    await expect(title).toBeVisible({ timeout: 20000 });
    await expect(title).toContainText('Funds Transferred:');
    await expect(this.selector.messageCard.detail.last()).toHaveText(note);
    await expect(this.selector.messageCard.openHistoryButton.last()).toBeVisible();
  }

  async openTransactionHistoryFromMessageCard(): Promise<void> {
    await expect(this.selector.messageCard.openHistoryButton.last()).toBeVisible({
      timeout: 5000,
    });
    await this.selector.messageCard.openHistoryButton.last().click();
    await expect(this.selector.transactionHistory.itemAmount.first()).toBeVisible({
      timeout: 10000,
    });
  }

  getTransactionItemByAmount(amount: string): Locator {
    return this.selector.transactionHistory.itemAmount.filter({ hasText: amount }).first();
  }

  async verifyTransactionByAmount(
    amount: string,
    expectedStatus: string,
    timeout = 60000
  ): Promise<Locator> {
    const item = this.getTransactionItemByAmount(amount);
    await expect(item).toBeVisible({ timeout });
    await this.verifyTransactionStatus(item, expectedStatus);
    return item;
  }

  async verifyTransactionStatus(item: Locator, expectedStatus: string): Promise<void> {
    const status = item.locator('..').locator(this.selector.transactionHistory.itemStatus);

    await expect(status).toHaveText(expectedStatus, { timeout: 5000 });
    await this.page.waitForTimeout(2000);
  }

  async openTransactionDetail(item: Locator): Promise<void> {
    const transactionItem = item.locator('xpath=../..');

    await transactionItem.locator(this.selector.transactionHistory.openDetailButton).click();

    await expect(
      this.selector.transactionHistory.detailLabel.filter({
        hasText: 'Sender',
      })
    ).toBeVisible({ timeout: 5000 });
    await this.page.waitForTimeout(2000);
  }

  async getTransactionDetailValue(item: Locator, label: string): Promise<string> {
    const detailBlock = this.page
      .locator('div.space-y-2')
      .filter({
        has: this.selector.transactionHistory.detailLabel.filter({
          hasText: label,
        }),
      })
      .first();

    const value = detailBlock.locator(this.selector.transactionHistory.detailValue);

    await expect(value).toBeVisible({ timeout: 5000 });
    await this.page.waitForTimeout(2000);

    return (await value.innerText()).trim();
  }

  async closeTransactionModal() {
    await this.selector.transactionHistory.closeTransactionButton.click();
  }
}
