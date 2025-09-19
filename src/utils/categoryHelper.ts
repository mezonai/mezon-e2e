import { expect, Page } from '@playwright/test';
import { CategoryPage } from '@/pages/CategoryPage';
import generateRandomString from './randomString';
import { AllureReporter } from './allureHelpers';
import { ClanPageV2 } from '@/pages/ClanPageV2';
import { ChannelStatus, ChannelType } from '@/types/clan-page.types';

export class CategoryTestHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async createAndVerifyCategory(categoryType: 'private' | 'public', hasChannel?: boolean): Promise<{ categoryName: string, channelName: string }> {
    const categoryPage = new CategoryPage(this.page);
    const clanPage = new ClanPageV2(this.page);
    const categoryName = `${categoryType}-category-${generateRandomString(10)}`;
    const channelName = `channel-${generateRandomString(10)}`;

    await AllureReporter.addParameter('categoryName', categoryName);
    await AllureReporter.addParameter('categoryType', categoryType);

    let isCategoryPresent = false;

    await AllureReporter.step(`Create new ${categoryType} category: ${categoryName}`, async () => {
      await categoryPage.createCategory(categoryName, categoryType);
      isCategoryPresent = await categoryPage.isCategoryPresent(categoryName);
      if(hasChannel) {
        await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PUBLIC, categoryName);
      }
    });
    if (isCategoryPresent) {
      return {
        categoryName,
        channelName
      };
    }
    return { categoryName: '', channelName: '' };
  }

  async deleteAndVerifyCategory(categoryName: string, categoryType: 'private' | 'public'): Promise<void> {
    const categoryPage = new CategoryPage(this.page);

    await AllureReporter.addParameter('categoryName', categoryName);
    await AllureReporter.addParameter('categoryType', categoryType);

    await AllureReporter.step(`Delete new ${categoryType} category: ${categoryName}`, async () => {
      await categoryPage.deleteCategory(categoryName);
    });

    await AllureReporter.step('Verify category is deleted from category list', async () => {
      const isCategoryDeleted = await categoryPage.isCategoryDeleted(categoryName);
      expect(isCategoryDeleted).toBe(true);

      await this.page.reload();

      const isCategoryDeletedAfterReload = await categoryPage.isCategoryDeleted(categoryName);
      expect(isCategoryDeletedAfterReload).toBe(true);
    });

    await AllureReporter.attachScreenshot(
      this.page,
      `${categoryType} Category Deleted - ${categoryName}`
    );
  }

  async deleteAndVerifyCategoryWithChannel(categoryName: string, categoryType: 'private' | 'public', channelName: string): Promise<void> {
    const categoryPage = new CategoryPage(this.page);
    const clanPage = new ClanPageV2(this.page);

    await AllureReporter.addParameter('categoryName', categoryName);
    await AllureReporter.addParameter('categoryType', categoryType);

    await AllureReporter.step(`Delete new ${categoryType} category: ${categoryName}`, async () => {
      await categoryPage.deleteCategory(categoryName);
    });

    await AllureReporter.step('Verify category is deleted from category list', async () => {
      await this.page.waitForTimeout(3000);
      const isCategoryDeleted = await categoryPage.isCategoryDeleted(categoryName);
      const isChannelPresent = await clanPage.isNewChannelPresent(channelName);
      expect(isCategoryDeleted).toBe(true);
      expect(isChannelPresent).toBe(false);
      await this.page.waitForTimeout(3000);


      await this.page.reload();

      const isCategoryDeletedAfterReload = await categoryPage.isCategoryDeleted(categoryName);
      const isChannelPresentAfterReload = await clanPage.isNewChannelPresent(channelName);
      expect(isCategoryDeletedAfterReload).toBe(true);
      expect(isChannelPresentAfterReload).toBe(false);
    });

    await AllureReporter.attachScreenshot(
      this.page,
      `${categoryType} Category Deleted - ${categoryName}`
    );
  }
}
