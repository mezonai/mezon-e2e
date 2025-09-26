import crypto from 'crypto';
import fs from 'fs/promises';

export async function getImageHash(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return crypto.createHash('md5').update(buffer).digest('hex');
  } catch (error) {
    console.error(`Error getting hash for ${url}:`, error);
    return null;
  }
}
