import { REPORT_SERVER_URL } from 'libs/mezon-reporter/constant';

export interface ReportUploadResult {
  success: boolean;
  reportUrl?: string;
  folderId?: string;
  error?: string;
  zipPath?: string;
}

export class ReportExporter {
  private webhookUrl?: string;

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl || process.env.WEBHOOK_URL || `${REPORT_SERVER_URL}/webhook`;
  }

  async exportPlaywrightReport(
    customReportPath: string = 'playwright-report'
  ): Promise<ReportUploadResult> {
    try {
      const zipPath = await this.createPlaywrightReportZip(customReportPath);
      if (!zipPath) {
        return {
          success: false,
          error: 'Failed to create report zip file',
        };
      }
      const uploadResult = await this.uploadReportToServer(zipPath);
      await this.cleanupZipFile(zipPath);
      return {
        ...uploadResult,
        zipPath,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async createPlaywrightReportZip(customReportPath?: string): Promise<string | null> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { execSync } = await import('child_process');

      // Default to playwright-report directory
      const reportDir = customReportPath || 'playwright-report';
      const reportPath = path.resolve(reportDir);

      if (!fs.existsSync(reportPath)) {
        throw new Error(`Report directory not found: ${reportPath}`);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const zipPath = path.join(process.cwd(), `playwright-report-${timestamp}.zip`);

      // console.log(`📦 Creating zip of ${reportDir}...`);

      try {
        // Create zip using native zip command (works on Unix-like systems)
        execSync(
          `cd "${path.dirname(reportPath)}" && zip -r "${zipPath}" "${path.basename(reportPath)}"`,
          {
            stdio: 'pipe',
          }
        );

        // console.log(`✅ Report zip created: ${zipPath}`);
        return zipPath;
      } catch (zipError) {
        console.warn('Zip command failed, trying tar:', zipError);
        // Fallback: try using tar command for compression
        try {
          const tarPath = zipPath.replace('.zip', '.tar.gz');
          execSync(
            `tar -czf "${tarPath}" -C "${path.dirname(reportPath)}" "${path.basename(reportPath)}"`,
            {
              stdio: 'pipe',
            }
          );

          console.log(`✅ Report archive created: ${tarPath}`);
          return tarPath;
        } catch (tarError) {
          console.warn('Tar command failed:', tarError);
          throw new Error('Both zip and tar commands failed');
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error creating report zip:', errorMessage);
      return null;
    }
  }

  private async uploadReportToServer(zipFilePath: string): Promise<ReportUploadResult> {
    try {
      const fs = await import('fs');
      const path = await import('path');

      if (!fs.existsSync(zipFilePath)) {
        throw new Error(`Report file not found: ${zipFilePath}`);
      }

      const fileName = path.basename(zipFilePath);
      console.log(`📤 Uploading report to transfer.sh: ${fileName}`);

      // Use transfer.sh API - simple PUT request with file content
      const fileBuffer = fs.readFileSync(zipFilePath);
      const uploadUrl = `https://transfer.adttemp.com.br/${fileName}`;

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: fileBuffer,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      const downloadUrl = await response.text();
      const trimmedUrl = downloadUrl.trim();
      console.log('✅ Report upload successful!');
      console.log(`🔗 Download URL: ${trimmedUrl}`);
      const reportUrl = await this.sendToWebhook(trimmedUrl);
      return {
        success: true,
        reportUrl,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(error);
      console.error('❌ Error uploading report:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async sendToWebhook(url: string): Promise<string> {
    try {
      if (!this.webhookUrl) {
        console.warn('⚠️ No webhook URL configured, skipping webhook notification');
        return '';
      }

      console.log('📨 Sending transfer.sh link to webhook...');

      const webhookPayload = {
        url,
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });
      const result = await response.json();
      console.log('Webhook response:', result);
      if (response.ok) {
        console.log('✅ Webhook notification sent successfully');
      } else {
        console.warn(`⚠️ Webhook notification failed: ${response.status} ${response.statusText}`);
      }
      return `${REPORT_SERVER_URL}/${result?.folderId || ''}`;
    } catch (error) {
      console.warn('⚠️ Failed to send webhook notification:', error);
      return '';
    }
  }

  private async cleanupZipFile(zipPath: string): Promise<void> {
    try {
      const fs = await import('fs');
      fs.unlinkSync(zipPath);
      // console.log(`🗑️ Cleaned up temporary zip file: ${zipPath}`);
    } catch (cleanupError) {
      console.warn(`⚠️ Could not clean up zip file: ${zipPath}`, cleanupError);
    }
  }

  // Utility method to just create zip without uploading
  async createReportZip(customReportPath?: string): Promise<string | null> {
    return await this.createPlaywrightReportZip(customReportPath);
  }

  // Utility method to upload an existing zip file
  async uploadExistingZip(zipFilePath: string): Promise<ReportUploadResult> {
    return await this.uploadReportToServer(zipFilePath);
  }

  // Utility method to set webhook URL
  setWebhookUrl(webhookUrl: string): void {
    this.webhookUrl = webhookUrl;
  }
}
