import { ClanPageV2 } from '@/pages/ClanPageV2';
import { generateClanName } from '@/utils/clanSetupHelper';

export interface ClanData {
  clanName: string;
  clanUrl: string;
}

export class ClanDataFactory {
  private clanName: string = '';
  private clanUrl: string = '';

  constructor() {}
  public getClanName(): string {
    return this.clanName;
  }
  public setClanName(clanName: string): void {
    this.clanName = clanName;
  }
  public getClanUrl(): string {
    return this.clanUrl;
  }
  public setClanUrl(clanUrl: string): void {
    this.clanUrl = clanUrl;
  }

  public async setupTestClan(clanPage: ClanPageV2, suiteName: string): Promise<void> {
    const clanName = generateClanName({ prefix: suiteName, clanName: 'Test Clan' });
    this.clanName = clanName;
    try {
      const createClanClicked = await clanPage.clickCreateClanButton();
      if (!createClanClicked) {
        throw new Error('Failed to click create clan button');
      }

      await clanPage.createNewClan(clanName);
      const clanExists = await clanPage.isClanPresent(clanName);
      if (!clanExists) {
        throw new Error(`Failed to create clan: ${clanName}`);
      }

      const clanUrl = clanPage.page.url();
      this.setClanUrl(clanUrl);
    } catch (error) {
      console.error(`❌ Failed to setup test clan: ${error}`);
      throw new Error(`Failed to setup test clan: ${error}`);
    }
  }

  public async cleanupTestClan(clanPage: ClanPageV2): Promise<void> {
    if (!this.clanName || !this.clanUrl) {
      return;
    }

    try {
      await clanPage.deleteClan(this.clanName);
      await clanPage.page.waitForTimeout(3000);
    } catch (error) {
      console.error(`❌ Failed to cleanup test clan: ${error}`);
    } 
  }
}
