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

    constructor(page: Page) {
        this.page = page;
        this.clanName = page.locator('p.text-theme-primary-active.text-base.font-semibold.select-none.one-line');
        this.createCategoryButton = page.locator('li', { hasText: 'Create Category' }).locator('..');
        this.categoryNameInput = page.locator('input[placeholder="Enter the category\'s name"]');
        this.privateButton = page.locator('#id-c01');
        this.confirmButton = page.locator('button:has-text("Create Category")');
        this.showEmtyCategoryButton = page.locator('#id-c01');
        this.cancelButton = page.locator('button:has-text("Cancel")');
    }

    async createCategory(name: string, type: 'private' | 'public'): Promise<boolean> {
        await this.clanName.click();

        await this.showEmtyCategoryButton.click();

        await this.createCategoryButton.click();

        await this.categoryNameInput.waitFor({ state: 'visible', timeout: 3000 });
        await this.categoryNameInput.fill(name);

        if (type === 'private') {
            await this.privateButton.click();
            await this.page.waitForTimeout(500);
        }

        await this.confirmButton.click();

        try {
            await this.page.waitForSelector(`div[data-index] p:has-text("${name}")`, { timeout: 5000 });
            return true;
        } catch {
            return false;
        }
    }

    async isCategoryPresent(categoryName: string): Promise<boolean> {
        const categoryLocator = this.page.locator(`div[data-index] p:has-text("${categoryName}")`);
        try {
            await categoryLocator.waitFor({ state: 'visible', timeout: 5000 });
            return true;
        } catch {
            return false;
        }
    }

    async cancelCreateCategory(name: string): Promise<boolean> {
        await this.clanName.click();

        await this.showEmtyCategoryButton.click();

        await this.createCategoryButton.click();

        await this.categoryNameInput.waitFor({ state: 'visible', timeout: 3000 });
        await this.categoryNameInput.fill(name);

        await this.cancelButton.click();

        return !(await this.isCategoryPresent(name));
    }
}
