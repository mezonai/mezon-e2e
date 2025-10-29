export function splitDomainAndPath(url: string): { domain: string; path: string } {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.origin;
    const path = urlObj.pathname + urlObj.search + urlObj.hash;
    return { domain, path };
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
  }
}
