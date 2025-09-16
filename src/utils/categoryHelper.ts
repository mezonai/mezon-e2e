import { expect, Page } from '@playwright/test';
import { CategoryPage } from '@/pages/CategoryPage';
import generateRandomString from './randomString';
import { AllureReporter } from './allureHelpers';

export class CategoryTestHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async createAndVerifyCategory(categoryType: 'private' | 'public'): Promise<string> {
    const categoryPage = new CategoryPage(this.page);
    const categoryName = `${categoryType}-category-${generateRandomString(10)}`;

    await AllureReporter.addParameter('categoryName', categoryName);
    await AllureReporter.addParameter('categoryType', categoryType);

    let isCategoryPresent = false;

    await AllureReporter.step(`Create new ${categoryType} category: ${categoryName}`, async () => {
      await categoryPage.createCategory(categoryName, categoryType);
      isCategoryPresent = await categoryPage.isCategoryPresent(categoryName);
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
