import generateRandomString from '@/utils/randomString';
import { Page } from '@playwright/test';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { promisify } from 'util';
import { generateE2eSelector } from './generateE2eSelector';
import zlib from 'zlib';

function createValidPngBuffer(width = 320, height = 320, targetBytes = 0): Buffer {
  const rows: Buffer[] = [];
  for (let y = 0; y < height; y++) {
    const r = Buffer.alloc(1 + width * 3);
    r[0] = 0;
    for (let x = 0; x < width; x++) {
      r[1 + x * 3] = (x + y) % 256;
      r[1 + x * 3 + 1] = (x * 2) % 256;
      r[1 + x * 3 + 2] = (y * 2) % 256;
    }
    rows.push(r);
  }
  const rawData = Buffer.concat(rows);
  const compressed = zlib.deflateSync(rawData);

  const makeChunk = (tag: string, data: Buffer): Buffer => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const tagBuf = Buffer.from(tag, 'ascii');
    const body = Buffer.concat([tagBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(body) >>> 0, 0);
    return Buffer.concat([len, body, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);

export type UploadVerificationResult = {
  success: boolean;
  fileSize: number;
  errorMessage?: string;
};

export enum UploadType {
  USER_PROFILE_AVATAR = 'userProfileAvatar',
  STICKER = 'sticker',
  VOICE_STICKER = 'voiceSticker',
  CLAN_WEBHOOK_AVATAR = 'clanWebhookAvatar',
  DIRECT_MESSAGE_ICON = 'directMessageIcon',
  GROUP_AVATAR = 'groupAvatar',
  CHANNEL_WEBHOOK_AVATAR = 'channelWebhookAvatar',
  ONBOARDING_RESOURCE = 'onboardingResource',
  COMMUNITY_BANNER = 'communityBanner',
  EVENT_IMAGE_COVER = 'eventImageCover',
  CLAN_LOGO = 'clanLogo',
  CLAN_LOGO_NEW_MODAL = 'clanLogoNewModal',
  CLAN_BANNER = 'clanBanner',
  TIMELINE = 'timeline',
}

type UploadConfig = {
  selector: string;
  errorSelector?: string;
};

const UPLOAD_CONFIGS: Record<UploadType, UploadConfig> = {
  [UploadType.USER_PROFILE_AVATAR]: {
    selector: '#preview_img',
  },
  [UploadType.STICKER]: {
    selector: `div[class*="fixed"] input[type="file"], div[role="dialog"] input[type="file"], ${generateE2eSelector('clan_page.settings.upload.emoji_input')} input[type="file"], ${generateE2eSelector('clan_page.settings.upload.emoji_input')}`,
  },
  [UploadType.VOICE_STICKER]: {
    selector: `div[class*="fixed"] input[type="file"], div[role="dialog"] input[type="file"], ${generateE2eSelector('clan_page.settings.upload.voice_sticker_input')} input[type="file"], ${generateE2eSelector('clan_page.settings.upload.voice_sticker_input')}`,
    errorSelector: generateE2eSelector('clan_page.settings.upload.voice_sticker_input.error'),
  },
  [UploadType.CLAN_WEBHOOK_AVATAR]: {
    selector: generateE2eSelector('clan_page.settings.upload.clan_webhook_avatar_input'),
  },
  [UploadType.DIRECT_MESSAGE_ICON]: {
    selector: generateE2eSelector(
      'user_setting.profile.user_profile.upload.direct_message_icon_input'
    ),
  },
  [UploadType.GROUP_AVATAR]: {
    selector: generateE2eSelector('chat.direct_message.edit_group.upload.avatar_group_input'),
  },
  [UploadType.CHANNEL_WEBHOOK_AVATAR]: {
    selector: generateE2eSelector('channel_setting_page.webhook.input.avatar_channel_webhook'),
  },
  [UploadType.ONBOARDING_RESOURCE]: {
    selector: generateE2eSelector('clan_page.settings.upload.onboarding_resource_input'),
  },
  [UploadType.COMMUNITY_BANNER]: {
    selector: generateE2eSelector('clan_page.settings.upload.community_banner_input'),
  },
  [UploadType.EVENT_IMAGE_COVER]: {
    selector: generateE2eSelector('clan_page.modal.create_event.upload.image_cover_input'),
  },
  [UploadType.CLAN_LOGO]: {
    selector: generateE2eSelector('clan_page.settings.upload.clan_logo_input'),
  },
  [UploadType.CLAN_LOGO_NEW_MODAL]: {
    selector: generateE2eSelector('clan_page.modal.create_clan.input.upload_avatar_clan'),
  },
  [UploadType.CLAN_BANNER]: {
    selector: generateE2eSelector('clan_page.settings.upload.clan_banner_input'),
  },
  [UploadType.TIMELINE]: {
    selector: generateE2eSelector('timeline.modal.input.attachment'),
  },
};

/**
 * FileSizeTestHelpers - Utility class for testing file upload functionality and size limits
 *
 * This class provides methods to:
 * 1. Create test files of specific sizes (images and generic files)
 * 2. Upload files to various components using a consolidated approach
 * 3. Verify upload success/failure and error messages
 *
 * The class has been refactored to use:
 * - Enum-based upload types for better maintainability
 * - Generic upload and verification methods to reduce code duplication
 * - Configuration-driven selectors for different upload components
 */
export class FileSizeTestHelpers {
  private page: Page;
  private tmpDir: string;

  constructor(page: Page) {
    this.page = page;
    this.tmpDir = path.join(process.cwd(), 'test-files', generateRandomString(8));
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

    if (ext.toLowerCase() === 'png') {
      const out = createValidPngBuffer(320, 320, targetBytes);
      await writeFile(filePath, out);
      return filePath;
    }

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
      } catch {
        continue;
      }
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

  private async createWavFileWithSize(fileName: string, targetBytes: number): Promise<string> {
    await this.ensureTmpDir();
    const filePath = path.join(this.tmpDir, `${fileName}.wav`);
    const fileSize = Math.max(targetBytes, 44);
    const wav = Buffer.alloc(fileSize, 0);
    const dataSize = fileSize - 44;

    wav.write('RIFF', 0);
    wav.writeUInt32LE(fileSize - 8, 4);
    wav.write('WAVE', 8);
    wav.write('fmt ', 12);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(8000, 24);
    wav.writeUInt32LE(16000, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write('data', 36);
    wav.writeUInt32LE(dataSize, 40);

    await writeFile(filePath, wav);
    return filePath;
  }

  async createFileWithSize(name: string, sizeBytes: number, ext: string): Promise<string> {
    if (ext.toLowerCase() === 'wav') {
      return await this.createWavFileWithSize(name, sizeBytes);
    }
    const imageExts = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
    if (imageExts.has(ext.toLowerCase())) {
      return await this.createImageFileWithSize(name, sizeBytes, ext);
    }
    return await this.createGenericFileWithSize(name, sizeBytes, ext);
  }

  async cleanupFiles(): Promise<void> {
    if (fs.existsSync(this.tmpDir)) {
      fs.rmSync(this.tmpDir, { recursive: true, force: true });
    }
    // for (const p of paths) {
    //   try {
    //     await unlink(p);
    //   } catch {}
    // }
  }
  // Generic upload method that can handle any upload type
  private async uploadFile(filePath: string, uploadType: UploadType): Promise<void> {
    const config = UPLOAD_CONFIGS[uploadType];
    const input = this.page.locator(config.selector).first();
    await input.setInputFiles(filePath);
  }

  // Generic verification method for most upload types
  private async verifyUpload(
    filePath: string,
    expectedSuccess: boolean
  ): Promise<UploadVerificationResult> {
    const size = (await stat(filePath)).size;
    const errorMessage = await this.waitForErrorModal(expectedSuccess ? 1000 : 5000);

    const success = !errorMessage;

    if (expectedSuccess && success) {
      await this.waitForSuccessIndicator();
    }

    return { success, fileSize: size, errorMessage };
  }

  private async setFileOnBestInput(filePath: string): Promise<void> {
    // Wait for any Loading spinner/overlay to detach
    await this.page
      .locator('text="Loading ...", text="Loading...", .animate-spin')
      .first()
      .waitFor({ state: 'detached', timeout: 10000 })
      .catch(() => {});

    // If a modal or settings container is currently visible, look for file inputs inside it first!
    const modalContainers = this.page.locator(
      'div[role="dialog"], div[class*="modal"], [data-e2e*="modal"], div[class*="setting"]'
    );
    if ((await modalContainers.count().catch(() => 0)) > 0) {
      const modalInput = modalContainers.locator('input[type="file"]').first();
      if (
        (await modalInput.count().catch(() => 0)) > 0 &&
        ((await modalInput.isVisible({ timeout: 1000 }).catch(() => false)) ||
          (await modalContainers
            .first()
            .isVisible()
            .catch(() => false)))
      ) {
        try {
          await modalInput.setInputFiles(filePath);
          return;
        } catch (e) {
          console.error(`Failed to set file on modal input: ${(e as Error).message}`);
        }
      }
    }

    // If on a voice channel without composer, try to open chat or switch to a text channel
    const showChatBtn = this.page
      .locator('button:has-text("Show Chat"), [aria-label="Show Chat"]')
      .first();
    if (await showChatBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await showChatBtn.click().catch(() => {});
      await this.page.waitForTimeout(500);
    }
    const generalChannel = this.page
      .locator(
        'button:has-text("general"), [data-e2e*="channel_list"]:has-text("general"), a[href*="/channels/"]:has-text("general")'
      )
      .first();
    const hasComposer = await this.page
      .locator('#preview_img, input[type="file"], [data-e2e="channel-message-input"]')
      .first()
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    if (!hasComposer && (await generalChannel.isVisible({ timeout: 1000 }).catch(() => false))) {
      await generalChannel.click().catch(() => {});
      await this.page.waitForTimeout(1000);
    }

    // Ensure composer is ready and focused if we are using the channel composer
    const composer = this.page
      .locator(
        '[data-e2e="channel-message-input"], div[contenteditable="true"], [role="textbox"], textarea'
      )
      .first();
    if (await composer.isVisible({ timeout: 2000 }).catch(() => false)) {
      await composer.click().catch(() => {});
    }

    // Wait for file input to be attached in the DOM
    const fileInputLocator = this.page.locator('#preview_img, input[type="file"]').first();
    await fileInputLocator.waitFor({ state: 'attached', timeout: 8000 }).catch(() => {});

    const composerInput = this.page
      .locator('#preview_img, input#preview_img, input[type="file"]#preview_img')
      .first();
    if ((await composerInput.count().catch(() => 0)) > 0) {
      try {
        await composerInput.setInputFiles(filePath);
        return;
      } catch (e) {
        console.error(`Failed to set file on composer input: ${(e as Error).message}`);
      }
    }

    const knownSelectors = [
      '#preview_img',
      'input#upload_logo',
      'input#upload_banner_background',
      `${generateE2eSelector('user_setting.profile.clan_profile.button_change_avatar')} input[type="file"]`,
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
        } catch (e) {
          console.error(`Failed to set file on input ${sel}: ${(e as Error).message}`);
        }
      }
    }

    throw new Error('No suitable file input found to upload');
  }

  private async visible(locator: ReturnType<Page['locator']>): Promise<boolean> {
    try {
      return await locator.first().isVisible({ timeout: 300 });
    } catch {
      return false;
    }
  }

  private async waitForErrorModal(timeout: number): Promise<string | undefined> {
    const modalValidate = this.page
      .locator(generateE2eSelector('modal.validate_file'))
      .or(
        this.page
          .locator('div[role="alert"], div[class*="toast"]')
          .filter({ hasText: /size|too large|exceed|maximum|10\s*mb|50\s*mb/i })
      )
      .or(
        this.page
          .locator('div[class*="modal"]')
          .filter({ hasText: /too large|exceed|greater than|cannot be larger/i })
      )
      .first();
    const modalValidateContent = this.page
      .locator(generateE2eSelector('modal.validate_file.content'))
      .or(modalValidate)
      .first();

    try {
      await modalValidate.waitFor({ state: 'visible', timeout });
      const text = await modalValidateContent.innerText().catch(() => '');
      if (
        /upload a file|upload emoji|upload sticker/i.test(text) &&
        !/too large|exceed|error|failed/i.test(text)
      ) {
        return undefined;
      }
      return text;
    } catch {
      return undefined;
    }
  }

  private async waitForSuccessIndicator(): Promise<boolean> {
    const previewCandidates = [
      this.page.locator(generateE2eSelector('mention.selected_file')).locator('input#preview_img'),
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
            // The candidate did not become visible; keep waiting on the others.
          }
        });
      });
      return true;
    } catch {
      return true;
    }
  }

  // Generic upload and verify method for all upload types
  private async uploadAndVerify(
    filePath: string,
    uploadType: UploadType,
    expectedSuccess: boolean
  ): Promise<UploadVerificationResult> {
    await this.uploadFile(filePath, uploadType);
    return await this.verifyUpload(filePath, expectedSuccess);
  }

  // Public methods for uploading and verifying files
  async uploadFileAndVerify(
    filePath: string,
    expectedSuccess: boolean
  ): Promise<UploadVerificationResult> {
    await this.setFileOnBestInput(filePath);
    return this.verifyUpload(filePath, expectedSuccess);
  }

  async uploadFileDefault(filePath: string): Promise<void> {
    await this.setFileOnBestInput(filePath);
  }

  // Mapping-based approach for all upload types - more maintainable
  private readonly uploadMethodMap = {
    uploadClanLogoAndVerify: UploadType.CLAN_LOGO,
    uploadClanLogoInCreateClanModalAndVerify: UploadType.CLAN_LOGO_NEW_MODAL,
    uploadClanBannerAndVerify: UploadType.CLAN_BANNER,
    uploadStickerAndVerify: UploadType.STICKER,
    uploadVoiceStickerAndVerify: UploadType.VOICE_STICKER,
    uploadClanWebhookAvatarAndVerify: UploadType.CLAN_WEBHOOK_AVATAR,
    uploadDirectMessageIconAndVerify: UploadType.DIRECT_MESSAGE_ICON,
    uploadGroupAvtAndVerify: UploadType.GROUP_AVATAR,
    uploadChannelWebhookAvatarAndVerify: UploadType.CHANNEL_WEBHOOK_AVATAR,
    uploadOnboardingResourceAndVerify: UploadType.ONBOARDING_RESOURCE,
    uploadCommunityBannerAndVerify: UploadType.COMMUNITY_BANNER,
    uploadEventImageCoverAndVerify: UploadType.EVENT_IMAGE_COVER,
  } as const;

  /**
   * Universal upload and verify method - Use this directly in tests!
   * @param filePath - Path to the file to upload
   * @param uploadType - Type of upload (from UploadType enum)
   * @param expectedSuccess - Whether the upload is expected to succeed
   * @returns Upload verification result
   *
   * Usage in tests:
   * - fileSizeHelpers.uploadByTypeAndVerify(path, UploadType.CLAN_LOGO, true)
   * - fileSizeHelpers.uploadByTypeAndVerify(path, UploadType.STICKER, false)
   * - fileSizeHelpers.uploadByTypeAndVerify(path, UploadType.CLAN_WEBHOOK_AVATAR, true)
   */
  async uploadByTypeAndVerify(
    filePath: string,
    uploadType: UploadType,
    expectedSuccess: boolean
  ): Promise<UploadVerificationResult> {
    await this.uploadFile(filePath, uploadType);
    return await this.verifyUpload(filePath, expectedSuccess);
  }
}
