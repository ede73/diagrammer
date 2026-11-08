export async function singleElementScreenSnapshot(browser, elementHtml, width = 800, height = 600) {
    try {
        const page2 = await browser.newPage();
        await page2.setViewport({ width: Math.round(width), height: Math.round(height) });
        await page2.setContent(elementHtml, { waitUntil: 'networkidle0' });
        const screenshot = await page2.screenshot({ type: 'png', fullPage: true });
        await page2.close();
        return Buffer.from(screenshot);
    }
    catch (error) {
        console.error('Error capturing screenshot:', error);
        throw error;
    }
}
