import crypto from 'crypto';

export async function getImageHash(url: string): Promise<string | null> {
  try {
    console.log(url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
    }
    console.log(response);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return crypto.createHash('md5').update(buffer).digest('hex');
  } catch (error) {
    console.error(`Error getting hash for ${url}:`, error);
    return null;
  }
}

export function getImageId(url: string | null) {
  if (!url) return null;
  const match = url.match(/\/([^/]+)\.jpg/);
  return match ? match[1] : null;
}
