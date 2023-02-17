// @ts-check
// eslint-disable-next-line no-unused-vars
import { Page } from 'puppeteer'

/**
 * @param {string} elementHtml e.g. <svg..>..</svg>
 * @param {number} width 800 wide unless otherwise specified
 * @param {number} height 600 tall unless otherwise specified
 */
export async function singleElementScreenSnapshot (elementHtml, width = 800, height = 600) {
  // const browser2 = await puppeteer.launch();
  // defined by jest as global
  /** @type {Page} */
  // @ts-ignore
  // eslint-disable-next-line no-undef
  const page2 = await browser.newPage()
  await page2.setViewport({ width, height })
  await page2.setContent(elementHtml)
  return await page2.screenshot({ fullPage: true })
}
