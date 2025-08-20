import { chromium } from '@playwright/test';
import { ENV_CONFIG } from './environment';

async function globalSetup() {
    const fs = await import('fs');
    const path = await import('path');
    
    const authDir = path.join(process.cwd(), 'playwright', '.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const browser = await chromium.launch({
      headless: ENV_CONFIG.browser.headless,
    });
    
    const context = await browser.newContext({
      baseURL: ENV_CONFIG.baseURL,
    });
    
    const page = await context.newPage();
    
    await page.goto('/');
    
    const title = await page.title();
    if (!title.includes('Mezon')) {
      throw new Error('Site is not accessible or title is incorrect');
    }
    
    await context.storageState({ path: 'playwright/.auth/user.json' });
    
    await context.close();
    await browser.close();
}

export default globalSetup;