import * as puppeteer from 'puppeteer';
import { Page } from 'puppeteer';
import * as jis from 'jest-image-snapshot';

/**
 * @param {jis.MatchImageSnapshotOptions} snapshotConfig jest-image-snapshot config
 * @param {string} elementHtml e.g. <svg..>..</svg>
 * @param {number} width 800 wide unless otherwise specified
 * @param {number} height 600 tall unless otherwise specified
 */
export async function singleElementScreenSnapshot(snapshotConfig, elementHtml, width = 800, height = 600) {
  //const browser2 = await puppeteer.launch();
  /** @type {Page} */
  const page2 = await browser.newPage();
  await page2.setViewport({ width: width, height: height });
  await page2.setContent(elementHtml);
  const filePath = `${snapshotConfig.customSnapshotsDir}${snapshotConfig.customSnapshotIdentifier}.png`;
  //return await page2.screenshot({ path: filePath });
  return await page2.screenshot({ fullPage: true });
}