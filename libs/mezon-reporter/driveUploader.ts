import * as fs from 'fs';
import type { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import * as path from 'path';

const parentFolder = '1T8ubwKRrlLP4uiGr2IkCIdS3lLL6RJ2m';

const OAUTH2_TOKEN = {
  access_token:
    'ya29.a0AS3H6NxT445P6GNMIZD-DnTTUkoERQoXi0U1M6w_ymYGwnxDtYOoCx_U0B9IeSYTschZnI5j7gGZY-KZ1-yVxoso1MoMLROz8jN95ve680J2pY9i-FMSaVMwrQicIuHPzif6A0RHuW2qx3-ZnnZijYgCqgKuuWDhkkJQCQKfSt-53gGdAD2a30VTv3N8YyGehldb1WgaCgYKAQISARMSFQHGX2Mi6AnsvQ6-6fmIpkVp1dVYpQ0206',
  refresh_token:
    '1//0gfPoj5mWLzhFCgYIARAAGBASNwF-L9Ir8Wb2P-y-aU13mJxvOS5f_h68izscp_-253kNiMcUnyHX5upK4Rjw_wkegTSziTfq_qU',
  scope: 'https://www.googleapis.com/auth/drive.file',
  token_type: 'Bearer',
  expiry_date: 1757435927552,
};
const OAUTH2_CREDENTIALS = {
  client_id: '139697473690-ucfv80vn82had5ab9pfv3se0csf42d05.apps.googleusercontent.com',
  client_secret: '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',
  redirect_uris: ['http://localhost'],
};

export default class DriveUploader {
  private oAuth2Client: OAuth2Client;

  constructor() {
    this.oAuth2Client = new google.auth.OAuth2(
      OAUTH2_CREDENTIALS.client_id,
      OAUTH2_CREDENTIALS.client_secret,
      OAUTH2_CREDENTIALS.redirect_uris[0]
    );
  }

  async authorize(): Promise<OAuth2Client> {
    try {
      this.oAuth2Client.setCredentials(OAUTH2_TOKEN);

      console.log('🔐 Using hard-coded OAuth2 token');
      return this.oAuth2Client;
    } catch (error) {
      console.error('❌ Failed to authorize OAuth2 client:', error);
      throw error;
    }
  }

  async uploadFile(
    auth: OAuth2Client,
    localFile: string,
    customParentFolder?: string
  ): Promise<string | null> {
    try {
      const drive = google.drive({ version: 'v3', auth });
      const fileMetadata = {
        name: path.basename(localFile),
        parents: [customParentFolder || parentFolder],
      };
      const media = {
        mimeType: localFile.endsWith('.tar.gz') ? 'application/gzip' : 'application/zip',
        body: fs.createReadStream(localFile),
      };
      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      });
      console.log(`✅ File uploaded successfully to Google Drive`);
      console.log(`📁 File ID: ${file.data.id}`);
      return file.data.id || null;
    } catch (error) {
      console.error('❌ Error uploading file to Google Drive:', error);
      throw error;
    }
  }

  async uploadFolder(
    auth: OAuth2Client,
    localFolderPath: string,
    customParentFolder?: string
  ): Promise<string | null> {
    try {
      const drive = google.drive({ version: 'v3', auth });

      // Create the main folder in Google Drive
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const folderName = `${path.basename(localFolderPath)}-${timestamp}`;

      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [customParentFolder || parentFolder],
      };

      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id',
      });

      if (!folder.data.id) {
        throw new Error('Failed to create main folder - no ID returned');
      }

      const mainFolderId = folder.data.id;
      console.log(`📁 Created main folder: ${folderName} (ID: ${mainFolderId})`);

      // Upload all files and subfolders recursively
      await this.uploadFolderContents(auth, localFolderPath, mainFolderId);

      console.log(`✅ Folder uploaded successfully to Google Drive`);
      console.log(`📁 Folder ID: ${mainFolderId}`);
      return mainFolderId;
    } catch (error) {
      console.error('❌ Error uploading folder to Google Drive:', error);
      throw error;
    }
  }

  private async uploadFolderContents(
    auth: OAuth2Client,
    localFolderPath: string,
    parentFolderId: string
  ): Promise<void> {
    const drive = google.drive({ version: 'v3', auth });
    const entries = fs.readdirSync(localFolderPath);

    for (const entry of entries) {
      const fullPath = path.join(localFolderPath, entry);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        // Create subfolder
        const subfolderMetadata = {
          name: entry,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId],
        };

        const subfolder = await drive.files.create({
          requestBody: subfolderMetadata,
          fields: 'id',
        });

        console.log(`📂 Created subfolder: ${entry}`);

        // Recursively upload subfolder contents
        if (subfolder.data.id) {
          await this.uploadFolderContents(auth, fullPath, subfolder.data.id);
        }
      } else {
        // Upload file
        const fileMetadata = {
          name: entry,
          parents: [parentFolderId],
        };

        const media = {
          mimeType: this.getMimeType(entry),
          body: fs.createReadStream(fullPath),
        };

        await drive.files.create({
          requestBody: fileMetadata,
          media: media,
        });

        console.log(`📄 Uploaded file: ${entry}`);
      }
    }
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
      '.tar.gz': 'application/gzip',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}
