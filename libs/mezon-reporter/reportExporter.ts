import generateRandomString from '@/utils/randomString';
import * as archiver from 'archiver';
import AWS from 'aws-sdk';
import * as fs from 'fs';
import { REPORT_SERVER_URL } from 'libs/mezon-reporter/constant';
import * as path from 'path';
export interface ReportUploadResult {
  success: boolean;
  reportUrl?: string;
  folderId?: string;
  error?: string;
  zipPath?: string;
}

class S3Client {
  private s3: AWS.S3;
  constructor(s3: AWS.S3) {
    this.s3 = s3;
  }

  async uploadFile(
    bucketName: string,
    key: string,
    body: Buffer
  ): Promise<AWS.S3.ManagedUpload.SendData> {
    return this.s3
      .upload({
        Bucket: bucketName,
        Key: key,
        Body: body,
      })
      .promise();
  }
}

export class ReportExporter {
  private webhookUrl?: string;
  private enabled: boolean = true;
  private s3Client!: S3Client;
  private bucketName = 'mezon-auto';
  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl || process.env.WEBHOOK_URL || `${REPORT_SERVER_URL}/webhook`;

    this.s3Client = new S3Client(
      new AWS.S3({
        endpoint: `https://storage.dungxbuif.com`,
        accessKeyId: '2z6YQm4SMLcjGCizgDL8',
        secretAccessKey: 'NLnUX7SbTVy8eIMCzf0eB1Up7FpDJSuM5tvyogKz',
        signatureVersion: 'v4',
        region: 'us-east-1',
        s3ForcePathStyle: true,
      })
    );
  }

  async exportPlaywrightReport(): Promise<ReportUploadResult> {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Disabled via configuration',
      };
    }
    try {
      const zipPath = await this.createPlaywrightReportZip();
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

  private async createPlaywrightReportZip(): Promise<string | null> {
    try {
      const reportDir = 'playwright-report';
      const reportPath = path.resolve(reportDir);
      if (!fs.existsSync(reportPath)) {
        throw new Error(`Report directory not found: ${reportPath}`);
      }
      const zipPath = path.join(process.cwd(), `playwright-report.zip`);
      return new Promise<string>((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver.default('zip', {
          zlib: { level: 9 },
        });

        output.on('close', () => {
          console.log(`✅ Report zip created: ${zipPath}`);
          console.log(`📦 Archive size: ${archive.pointer()} bytes`);
          resolve(zipPath);
        });

        output.on('error', err => {
          console.error('❌ Error writing zip file:', err);
          reject(err);
        });

        archive.on('error', (err: Error) => {
          console.error('❌ Error creating archive:', err);
          reject(err);
        });

        archive.on('warning', (err: Error & { code?: string }) => {
          if (err.code === 'ENOENT') {
            console.warn('⚠️ Archive warning:', err);
          } else {
            reject(err);
          }
        });
        archive.pipe(output);
        archive.directory(reportPath, path.basename(reportPath));
        archive.finalize();
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error creating report zip:', errorMessage);
      return null;
    }
  }

  private async uploadReportToServer(zipFilePath: string): Promise<ReportUploadResult> {
    try {
      if (!fs.existsSync(zipFilePath)) {
        throw new Error(`Report file not found: ${zipFilePath}`);
      }
      const fileBuffer = fs.readFileSync(zipFilePath);
      const fileName = generateRandomString(16);
      await this.s3Client.uploadFile(this.bucketName, fileName, fileBuffer);
      const reportUrl = await this.sendToWebhook(fileName);
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
}
