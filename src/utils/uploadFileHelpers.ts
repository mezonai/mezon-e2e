import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { Page } from '@playwright/test';
import https from 'https';
import { generateE2eSelector } from './generateE2eSelector';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

export type UploadVerificationResult = {
  success: boolean;
  fileSize: number;
  errorMessage?: string;
};

export enum UploadType {
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
}

type UploadConfig = {
  selector: string;
  errorSelector?: string;
};

const UPLOAD_CONFIGS: Record<UploadType, UploadConfig> = {
  [UploadType.STICKER]: {
    selector: `${generateE2eSelector('clan_page.settings.upload.emoji_input')} input[accept*=".jpg"], input[accept*=".jpeg"], input[accept*=".png"], input[accept*=".gif"], input[accept*="image"]`,
  },
  [UploadType.VOICE_STICKER]: {
    selector: `${generateE2eSelector('clan_page.settings.upload.voice_sticker_input')} input[accept*="audio/mp3"], input[accept*="audio/mpeg"], input[accept*="audio/wav"]`,
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
      } catch {}
    }
  }

  // Generic upload method that can handle any upload type
  private async uploadFile(filePath: string, uploadType: UploadType): Promise<void> {
    const config = UPLOAD_CONFIGS[uploadType];
    const input = this.page.locator(config.selector);
    await input.setInputFiles(filePath);
  }

  // Generic verification method for most upload types
  private async verifyUpload(
    filePath: string,
    expectedSuccess: boolean,
    uploadType?: UploadType
  ): Promise<UploadVerificationResult> {
    const size = (await stat(filePath)).size;
    let errorMessage: string | undefined;

    // Handle special case for voice sticker
    if (uploadType === UploadType.VOICE_STICKER) {
      const config = UPLOAD_CONFIGS[uploadType];
      if (config.errorSelector) {
        const error = this.page.locator(config.errorSelector);
        if (await error.isVisible({ timeout: 3000 })) {
          errorMessage = await error.innerText();
        }
      }
    } else {
      errorMessage = await this.waitForErrorModal();
    }

    const success = !errorMessage;

    if (expectedSuccess) {
      await this.page.waitForTimeout(500);

      if (uploadType === UploadType.VOICE_STICKER && UPLOAD_CONFIGS[uploadType].errorSelector) {
        const error = this.page.locator(UPLOAD_CONFIGS[uploadType].errorSelector!);
        if (await error.isVisible({ timeout: 1000 })) {
          const lateError = await error.innerText();
          if (lateError) {
            return { success: false, fileSize: size, errorMessage: lateError };
          }
        }
      } else {
        const lateError = await this.waitForErrorModal();
        if (lateError) {
          return { success: false, fileSize: size, errorMessage: lateError };
        }
      }

      await this.waitForSuccessIndicator();
    }

    return { success, fileSize: size, errorMessage };
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

  private async visible(locator: ReturnType<Page['locator']>): Promise<boolean> {
    try {
      return await locator.first().isVisible({ timeout: 300 });
    } catch {
      return false;
    }
  }

  private async waitForErrorModal(): Promise<string | undefined> {
    const modalValidate = this.page.locator(generateE2eSelector('modal.validate_file'));
    const modalValidateContent = this.page.locator(
      generateE2eSelector('modal.validate_file.content')
    );

    if ((await this.visible(modalValidate)) === false) {
      return undefined;
    }
    return await modalValidateContent.innerText();
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
          } catch {}
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
    return await this.verifyUpload(filePath, expectedSuccess, uploadType);
  }

  // Public methods for uploading and verifying files
  async uploadFileAndVerify(
    filePath: string,
    expectedSuccess: boolean
  ): Promise<UploadVerificationResult> {
    await this.setFileOnBestInput(filePath);
    return await this.verifyUpload(filePath, expectedSuccess);
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
    return await this.verifyUpload(filePath, expectedSuccess, uploadType);
  }
}
