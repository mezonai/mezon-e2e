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

  async createAndVerifyCategory(categoryType: 'private' | 'public', hasChannel?: boolean): Promise<string> {
    const categoryPage = new CategoryPage(this.page);
    const clanPage = new ClanPageV2(this.page);
    const categoryName = `${categoryType}-category-${generateRandomString(10)}`;

    await AllureReporter.addParameter('categoryName', categoryName);
    await AllureReporter.addParameter('categoryType', categoryType);

    let isCategoryPresent = false;

    await AllureReporter.step(`Create new ${categoryType} category: ${categoryName}`, async () => {
      await categoryPage.createCategory(categoryName, categoryType);
      isCategoryPresent = await categoryPage.isCategoryPresent(categoryName);
      if(hasChannel) {
        const channelName = `channel-${generateRandomString(10)}`;
        await clanPage.createNewChannel(ChannelType.TEXT, channelName, ChannelStatus.PUBLIC, categoryName);
      }
    });
    if (isCategoryPresent) {
      return categoryName;
    }
    return '';
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
}
