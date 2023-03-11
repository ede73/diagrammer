export async function singleElementScreenSnapshot(browser, elementHtml, width = 800, height = 600) {
    const page2 = await browser.newPage();
    await page2.setViewport({ width, height });
    await page2.setContent(elementHtml);
    return page2.screenshot({ fullPage: true });
}
