// @ts-check
import { type Browser } from 'puppeteer'
// import 'jest-puppeteer'
// defines global.browser and global.page
// import 'jest-environment-puppeteer'

/**
 * @param elementHtml e.g. <svg..>..</svg>
 * @param width 800 wide unless otherwise specified
 * @param height 600 tall unless otherwise specified
 */
export async function singleElementScreenSnapshot(browser: Browser, elementHtml: string, width: number = 800, height: number = 600) {
  try {
    const page2 = await browser.newPage()
    await page2.setViewport({ width, height })
    await page2.setContent(elementHtml, { waitUntil: 'networkidle0' })
    const screenshot = await page2.screenshot({ type: 'png', fullPage: true }) as Buffer
    await page2.close()
    return Buffer.from(screenshot)
  } catch (error) {
    console.error('Error capturing screenshot:', error)
    throw error
  }
}
