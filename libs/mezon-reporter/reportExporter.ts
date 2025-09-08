export interface ReportUploadResult {
  success: boolean;
  reportUrl?: string;
  folderId?: string;
  error?: string;
  zipPath?: string;
}

export class ReportExporter {
  private serverUrl: string;

  constructor(serverUrl?: string) {
    this.serverUrl =
      serverUrl || process.env.REPORT_SERVER_URL || 'https://mezon-reports.nccquynhon.edu.vn';
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
        // Fallback: try using tar command for compression
        try {
          const tarPath = zipPath.replace('.zip', '.tar.gz');
          execSync(
            `tar -czf "${tarPath}" -C "${path.dirname(reportPath)}" "${path.basename(reportPath)}"`,
            {
              stdio: 'pipe',
            }
          );

          // console.log(`✅ Report archive created: ${tarPath}`);
          return tarPath;
        } catch (tarError) {
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

      if (!fs.existsSync(zipFilePath)) {
        throw new Error(`Report file not found: ${zipFilePath}`);
      }

      // console.log(`📤 Uploading report: ${zipFilePath}`);
      // console.log(`🌐 Server URL: ${this.serverUrl}/upload`);

      // Create FormData and upload file
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(zipFilePath);
      const blob = new Blob([fileBuffer]);
      const fileName = zipFilePath.split('/').pop() || 'playwright-report.zip';

      formData.append('report', blob, fileName);

      const response = await fetch(`${this.serverUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        // console.log('✅ Report upload successful!');
        // console.log(`🆔 Folder ID: ${result.folderId}`);
        // console.log(`🔗 Report URL: ${result.reportUrl}`);

        return {
          success: true,
          reportUrl: result.reportUrl,
          folderId: result.folderId,
        };
      } else {
        console.error('❌ Report upload failed:', result.error);
        return {
          success: false,
          error: result.error || 'Upload failed',
        };
      }
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

  private async cleanupZipFile(zipPath: string): Promise<void> {
    try {
      const fs = await import('fs');
      fs.unlinkSync(zipPath);
      // console.log(`🗑️ Cleaned up temporary zip file: ${zipPath}`);
    } catch (cleanupError) {
      console.warn(`⚠️ Could not clean up zip file: ${zipPath}`);
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
}
