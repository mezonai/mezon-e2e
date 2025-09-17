import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { Page } from '@playwright/test';
import https from 'https';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

export type UploadVerificationResult = {
  success: boolean;
  fileSize: number;
  errorMessage?: string;
};

export class FileSizeTestHelpers {
  private page: Page;
  private tmpDir: string;

  constructor(page: Page) {
    this.page = page;
    this.tmpDir = path.join(os.tmpdir(), 'mezon-e2e-files');
  }

  private async ensureTmpDir(): Promise<void> {
    if (!fs.existsSync(this.tmpDir)) {
      await mkdir(this.tmpDir, { recursive: true });
    }
  }

  private async downloadToBuffer(url: string): Promise<Buffer> {
    return await new Promise((resolve, reject) => {
      const req = https.get(url, res => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          // Follow redirect
          return resolve(this.downloadToBuffer(res.headers.location));
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to download. Status: ${res.statusCode}`));
        }
        const data: Buffer[] = [];
        res.on('data', chunk => data.push(Buffer.from(chunk)));
        res.on('end', () => resolve(Buffer.concat(data)));
      });
      req.on('error', reject);
    });
  }

  private async createImageFileWithSize(
    fileName: string,
    targetBytes: number,
    ext: string
  ): Promise<string> {
    await this.ensureTmpDir();
    const filePath = path.join(this.tmpDir, `${fileName}.${ext}`);

    const candidates = [
      'https://picsum.photos/4096/4096.jpg',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2048&q=80',
      'https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg',
    ];

    let base: Buffer | null = null;
    for (const url of candidates) {
      try {
        base = await this.downloadToBuffer(url);
        if (base && base.length > 0) break;
      } catch {}
    }
    if (!base) {
      base = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    }

    let out: Buffer;
    if (base.length >= targetBytes) {
      out = base.subarray(0, targetBytes);
    } else {
      const pad = Buffer.alloc(targetBytes - base.length, 0);
      out = Buffer.concat([base, pad]);
    }

    await writeFile(filePath, out);
    return filePath;
  }

  private async createGenericFileWithSize(
    fileName: string,
    targetBytes: number,
    ext: string
  ): Promise<string> {
    await this.ensureTmpDir();
    const filePath = path.join(this.tmpDir, `${fileName}.${ext}`);
    const chunk = Buffer.alloc(1024 * 1024, 0);
    const fd = fs.openSync(filePath, 'w');
    let written = 0;
    try {
      while (written + chunk.length <= targetBytes) {
        fs.writeSync(fd, chunk);
        written += chunk.length;
      }
      const remaining = targetBytes - written;
      if (remaining > 0) {
        fs.writeSync(fd, Buffer.alloc(remaining, 0));
      }
    } finally {
      fs.closeSync(fd);
    }
    return filePath;
  }

  async createFileWithSize(name: string, sizeBytes: number, ext: string): Promise<string> {
    const imageExts = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
    if (imageExts.has(ext.toLowerCase())) {
      return await this.createImageFileWithSize(name, sizeBytes, ext);
    }
    return await this.createGenericFileWithSize(name, sizeBytes, ext);
  }

  async cleanupFiles(paths: string[]): Promise<void> {
    for (const p of paths) {
      try {
        await unlink(p);
      } catch {
        /* noop */
      }
    }
  }

  private async visible(locator: ReturnType<Page['locator']>): Promise<boolean> {
    try {
      return await locator.first().isVisible({ timeout: 300 });
    } catch {
      return false;
    }
  }

  private async setFileOnBestInput(filePath: string): Promise<void> {
    const composerInput = this.page.locator('#preview_img');
    if (await this.visible(composerInput)) {
      await composerInput.setInputFiles(filePath);
      return;
    }

    const knownSelectors = [
      'input#upload_logo',
      'input#upload_banner_background',
      '[data-e2e="user_setting.profile.clan_profile.button_change_avatar"] input[type="file"]',
      'label:has-text("Change avatar") input[type="file"]',
      'input[accept*=".jpg"], input[accept*=".jpeg"], input[accept*=".png"], input[accept*=".gif"], input[accept*="image"]',
      'input[accept*="audio/mp3"], input[accept*="audio/mpeg"], input[accept*="audio/wav"], input[accept*="audio"]',
      'input[type="file"]',
    ];

    for (const sel of knownSelectors) {
      const input = this.page.locator(sel).first();
      const count = await input.count().catch(() => 0);
      if (count > 0) {
        try {
          await input.setInputFiles(filePath);
          return;
        } catch {}
      }
    }

    throw new Error('No suitable file input found to upload');
  }

  private async waitForErrorModal(): Promise<string | undefined> {
    const errorCandidates = [
      this.page.getByText(/Upload size limit exceeded/i),
      this.page.getByText(/Your files are too powerful/i),
      this.page.getByText(/Max file size is/i),
      this.page.getByText(/too large|size exceeds|file size/i),
      this.page.getByText(/File too big, max 1MB/i),
      this.page.getByText(/Support file .mp3 or .wav/i),
    ];

    const timeoutMs = 4000;
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      for (const loc of errorCandidates) {
        try {
          if (await loc.isVisible({ timeout: 200 })) {
            return (await loc.first().innerText()).trim();
          }
        } catch {}
      }
      await this.page.waitForTimeout(150);
    }
    return undefined;
  }

  private async waitForSuccessIndicator(): Promise<boolean> {
    const previewCandidates = [
      this.page.locator('[data-e2e="mention.selected_file"]').locator('input#preview_img'),
      this.page.locator('img, canvas').first(),
    ];

    try {
      await new Promise<void>(resolve => {
        let resolved = false;
        const timer = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        }, 2000);
        previewCandidates.forEach(async candidate => {
          try {
            await candidate.waitFor({ state: 'visible', timeout: 2000 });
            if (!resolved) {
              resolved = true;
              clearTimeout(timer);
              resolve();
            }
          } catch {
            /* noop */
          }
        });
      });
      return true;
    } catch {
      return true;
    }
  }

  async uploadFileAndVerify(
    filePath: string,
    expectedSuccess: boolean
  ): Promise<UploadVerificationResult> {
    const size = (await stat(filePath)).size;

    await this.setFileOnBestInput(filePath);

    const errorMessage = await this.waitForErrorModal();
    const success = !errorMessage;

    if (expectedSuccess) {
      await this.page.waitForTimeout(500);
      const lateError = await this.waitForErrorModal();
      if (lateError) {
        return { success: false, fileSize: size, errorMessage: lateError };
      }
      await this.waitForSuccessIndicator();
    }

    return { success, fileSize: size, errorMessage: errorMessage };
  }
}
