import crypto from 'crypto';

export function getOriginalImageUrl(url: string): string {
  const imgProxyUrlPattern =
    /^https?:\/\/[^/]*imgproxy[^/]*\/.+\/plain\/((?:https?:\/\/|https?%3A%2F%2F).+)@([a-zA-Z0-9]+)$/i;
  const match = url.match(imgProxyUrlPattern);

  if (!match) return url;

  const originalUrl = match[1];

  try {
    return decodeURIComponent(originalUrl);
  } catch {
    return originalUrl;
  }
}

export async function getImageHash(url: string): Promise<string | null> {
  try {
    const imageUrl = getOriginalImageUrl(url);
    console.log(imageUrl);

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${imageUrl}: ${response.statusText}`);
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
