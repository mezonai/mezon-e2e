import AdmZip from 'adm-zip';
import AWS from 'aws-sdk';
import fs, { createWriteStream } from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
const bucketName = 'mezon-auto';

class FileDownloader {
  constructor() {
    const [ACCESS_KEY_ID, SECRET_ACCESS_KEY] = 'key'.split(':');

    this.s3 = new AWS.S3({
      endpoint: `https://storage.dungxbuif.com`,
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
      signatureVersion: 'v4',
      region: 'us-east-1',
      s3ForcePathStyle: true,
    });
  }

  async downloadAndExtract(key, destPath) {
    console.log(`📥 Downloading from: ${key}`);

    try {
      const fileName = `${key}.zip`;
      const downloadPath = path.join(destPath, fileName);

      // Create destination directory
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }

      await this.downloadFile(key, downloadPath);
      console.log(`✅ File downloaded: ${fileName}`);

      // If it's a zip file, extract it
      if (fileName.toLowerCase().endsWith('.zip')) {
        console.log(`📦 Extracting zip file: ${fileName}`);
        const extractDir = await this.extractZipFile(downloadPath, destPath);

        // Remove the zip file after extraction
        fs.unlinkSync(downloadPath);
        console.log(`✅ Extraction completed`);
        await this.s3.deleteObject({ Bucket: bucketName, Key: key }).promise();
        return extractDir;
      }
      await this.s3.deleteObject({ Bucket: bucketName, Key: key }).promise();
      return destPath;
    } catch (error) {
      console.error(`❌ Download failed for ${key}:`, error.message);
      throw error;
    }
  }

  getFileNameFromUrl(parsedUrl) {
    // Extract filename from URL path
    const pathname = parsedUrl.pathname;
    let filename = path.basename(pathname);

    // If no filename in path, generate one
    if (!filename || filename === '/') {
      filename = 'download.zip';
    }

    // Ensure .zip extension if not present and it looks like a transfer link
    if (!filename.includes('.') && parsedUrl.hostname.includes('transfer')) {
      filename += '.zip';
    }

    return filename;
  }

  async downloadFile(key, filePath) {
    return new Promise((resolve, reject) => {
      const fileStream = createWriteStream(filePath);
      const fileBuffer = this.s3.getObject({ Bucket: bucketName, Key: key }).createReadStream();
      pipeline(fileBuffer, fileStream)
        .then(() => {
          console.log(`✅ File saved to: ${filePath}`);
          resolve();
        })
        .catch(reject);
    });
  }

  async extractZipFile(zipPath, extractDir) {
    try {
      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();

      console.log(`📦 Found ${zipEntries.length} files in zip`);

      // Extract all files
      zip.extractAllTo(extractDir, true);

      // Check if there's a playwright-report folder and move its contents up
      const playwrightReportDir = path.join(extractDir, 'playwright-report');
      if (fs.existsSync(playwrightReportDir)) {
        console.log(`📁 Found playwright-report folder, moving contents up...`);

        // Get all files and folders in playwright-report
        const items = fs.readdirSync(playwrightReportDir);

        for (const item of items) {
          const sourcePath = path.join(playwrightReportDir, item);
          const destPath = path.join(extractDir, item);

          // Move each item to the parent directory
          fs.renameSync(sourcePath, destPath);
        }

        // Remove the empty playwright-report directory
        fs.rmdirSync(playwrightReportDir);
        console.log(`✅ Moved all contents from playwright-report folder`);
      }

      return extractDir;
    } catch (error) {
      console.error(`❌ Failed to extract zip file:`, error.message);
      throw error;
    }
  }
}

export default FileDownloader;
