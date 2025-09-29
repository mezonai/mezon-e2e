export async function expectMessageSent(contains: string): Promise<void> {
    await browser.waitUntil(
        async () => (await driver.getPageSource()).includes(contains),
        {
            timeout: 20000,
            timeoutMsg: `Message not found in source: ${contains}`,
        }
    );
}
