import { Page, Locator } from '@playwright/test';

export class MessgaePage {
  readonly page: Page;
  readonly user: Locator;
  readonly addUserButton: Locator;
  readonly userItem: Locator;
  readonly createGroupButton: Locator;
  readonly firstUserName: Locator;
  readonly secondUserName: Locator;
  readonly group: Locator;
  readonly addToGroupButton: Locator;
  readonly sumMember: Locator;
  readonly memberCount: Locator;
  firstUserNameText: string = '';

  constructor(page: Page) {
    this.page = page;
    this.user = page.locator('.dm-wrap img:not([alt*=","])').first();
    this.firstUserName = page.locator('p.font-medium.text-2xl.text-theme-primary');
    this.addUserButton = page.locator('span[title="Add friends to DM"]');
    this.userItem = page
      .locator('div.bg-item-theme.flex.items-center.h-10.px-2.ml-3.mr-2.rounded-lg.cursor-pointer')
      .first();
    this.createGroupButton = page.locator('button:has-text("Create Group Chat")');
    this.secondUserName = this.userItem.locator(
      'span.text-base.font-medium.text-theme-primary-active.one-line'
    );
    this.group = page
      .locator('div.dm-wrap')
      .filter({ has: page.locator('span.one-line', { hasText: /,/ }) })
      .first();
    this.addToGroupButton = page.locator('button:has-text("Add to Group Chat")');
    this.sumMember = page.locator('button[title="Show Member List"]:not(.sbm\\:hidden)');
    this.memberCount = page.locator('div.p-2.bg-item-hover');
  }

  async countGroups(): Promise<number> {
    return await this.page.locator('.dm-wrap').count();
  }

  async createGroup(): Promise<boolean> {
    await this.user.click();
    this.firstUserNameText = (await this.firstUserName.textContent())?.trim() ?? '';
    await this.addUserButton.click();
    await this.userItem.waitFor({ state: 'visible', timeout: 50000 });
    await this.userItem.click();
    await this.createGroupButton.click();

    return true;
  }

  async isGroupCreated(prevGroupCount: number): Promise<boolean> {
    await this.page.waitForTimeout(2000);

    const currentGroupCount = await this.countGroups();
    if (currentGroupCount !== prevGroupCount + 1) {
      console.log(`Số nhóm không tăng lên 1: trước=${prevGroupCount}, sau=${currentGroupCount}`);
      return false;
    }

    const groupNames = await this.page
      .locator('p.text-xl.md\\:text-3xl.font-bold.pt-1.text-theme-primary-active')
      .allTextContents();
    const newGroupName = groupNames[groupNames.length - 1].trim();

    if (!newGroupName.startsWith(this.firstUserNameText)) {
      console.log(`Tên nhóm mới không bắt đầu bằng tên user đầu: ${newGroupName}`);
      return false;
    }

    return true;
  }

  async addMoreMemberToGroup(): Promise<void> {
    await this.group.click();
    await this.addUserButton.click();
    await this.userItem.waitFor({ state: 'visible', timeout: 5000 });
    await this.userItem.click();
    await this.addToGroupButton.click();

    await this.page.waitForTimeout(1000);
  }

  async getMemberCount(): Promise<number> {
    await this.group.click();
    await this.sumMember.click();

    const memberItems = this.memberCount;

    const count = await memberItems.count();
    return count;
  }

  async isMemberAdded(previousCount: number): Promise<boolean> {
    const memberItems = this.memberCount;

    const newCount = await memberItems.count();
    return newCount === previousCount + 1;
  }
}
