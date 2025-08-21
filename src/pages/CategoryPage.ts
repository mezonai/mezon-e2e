import { Page, Locator } from '@playwright/test';

export class CategoryPage {
    readonly page: Page;
    readonly clanName: Locator;
    readonly createCategoryButton: Locator;
    readonly categoryNameInput: Locator;
    readonly privateButton: Locator;
    readonly confirmButton: Locator;
    readonly showEmtyCategoryButton: Locator;
    readonly cancelButton: Locator;
    readonly categories: Locator;
    readonly clan: Locator;

    constructor(page: Page) {
        this.page = page;
        this.clanName = page.locator('p.text-theme-primary-active.text-base.font-semibold.select-none.one-line');
        this.createCategoryButton = page.locator('li', { hasText: 'Create Category' }).locator('..');
        this.categoryNameInput = page.locator('input[placeholder="Enter the category\'s name"]');
        this.privateButton = page.locator('#id-c01');
        this.confirmButton = page.locator('button:has-text("Create Category")');
        this.showEmtyCategoryButton = page.locator('#id-c01');
        this.cancelButton = page.locator('button:has-text("Cancel")');
        this.categories = page.locator('button span.one-line');
        this.clan = page.locator('div[title]').nth(1);
    }

     async showCategory(): Promise<void> {
        await this.clan.click();
        await this.clanName.click();

        await this.showEmtyCategoryButton.click();
    }

    async createCategory(name: string, type: 'private' | 'public'): Promise<void> {
        await this.clan.click();
        await this.clanName.click();

        await this.createCategoryButton.click();

        await this.categoryNameInput.waitFor({ state: 'visible', timeout: 3000 });
        await this.categoryNameInput.fill(name);

        if (type === 'private') {
            await this.privateButton.click();
            await this.page.waitForTimeout(500);
        }

        await this.confirmButton.click();
    }

    // async isCategoryPresent(categoryName: string): Promise<boolean> {
    //     const nameCategorySpan = await this.nameCategory.innerText();
    //     if (categoryName !== nameCategorySpan){
    //         return false;
    //     }
    //     return true;
    // }

    async countCategories(): Promise<number> {
        await this.page.waitForTimeout(3000);
        const count = await this.categories.count();
        return count;
    }

    async isCategoryPresent(categoryName: string, prevCategoryCount: number): Promise<boolean> {
        const categoryLocator = this.page.locator('button span.one-line', { hasText: categoryName });

        if (await categoryLocator.isVisible()) {
            const currentCategoryCount = await this.countCategories();
            if (currentCategoryCount !== prevCategoryCount + 1) {
                return false;
            }
            return true;
        } else {
            return false;
        }
    }

    async cancelCreateCategory(name: string): Promise<void> {
        await this.clan.click();
        await this.clanName.click();

        await this.showEmtyCategoryButton.click();

        await this.createCategoryButton.click();

        await this.categoryNameInput.waitFor({ state: 'visible', timeout: 3000 });
        await this.categoryNameInput.fill(name);

        await this.cancelButton.click();
    }
}
