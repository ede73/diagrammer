// @ts-check
import { Page, Browser } from 'puppeteer'

/**
 * @param elementHtml e.g. <svg..>..</svg>
 * @param width 800 wide unless otherwise specified
 * @param height 600 tall unless otherwise specified
 */
export async function singleElementScreenSnapshot(browser: Browser, elementHtml: string, width: number = 800, height: number = 600) {
  const page2 = await browser.newPage()
  await page2.setViewport({ width, height })
  await page2.setContent(elementHtml)
  return await page2.screenshot({ fullPage: true })
}
