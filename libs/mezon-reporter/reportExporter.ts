import fs from 'fs';
import { REPORT_WEBHOOK_URL } from 'libs/mezon-reporter/constant';
import DriveUploader from 'libs/mezon-reporter/driveUploader';
import path from 'path';

export interface ReportUploadResult {
  success: boolean;
  folderId?: string | null;
  error?: string;
}

export class ReportExporter {
  private serverUrl: string;
  private uploader: DriveUploader;

  constructor(serverUrl?: string) {
    this.serverUrl = serverUrl || process.env.REPORT_SERVER_URL || REPORT_WEBHOOK_URL;
    this.uploader = new DriveUploader();
  }

  async uploadFolderToServer(): Promise<ReportUploadResult> {
    try {
      // Check if folder exists
      const reportPath = path.resolve('playwright-report');
      if (!fs.existsSync(reportPath)) {
        throw new Error(`Report directory not found: ${reportPath}`);
      }
      const auth = await this.uploader.authorize();
      const folderId = await this.uploader.uploadFolder(auth, reportPath);
      return {
        success: true,
        folderId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to upload report folder:', errorMessage);
      return {
        success: false,
        folderId: null,
        error: `Upload failed: ${errorMessage}`,
      };
    }
  }
}
