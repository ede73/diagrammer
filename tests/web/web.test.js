import { Page, Puppeteer } from 'puppeteer';
import { Browser } from 'puppeteer';
//import { jest } from 'jest';

//import {page} from 'puppeteer'; fails

// npm install @types/jest --save-dev 
// fixed it
// puppeteer import above works, but it give
// puppeteer.page and puppeteer.browser

// https://pptr.dev/api/puppeteer.page
// https://pptr.dev/api/puppeteer.browser

async function dumpWholePage() {
  let bodyHTML = await page.evaluate(() => document.body.innerHTML);
  console.log(bodyHTML);
}

async function dumpWholePage2() {
  //https://stackoverflow.com/questions/54563410/how-to-get-all-html-data-after-all-scripts-and-page-loading-is-done-puppeteer
  const data = await page.evaluate(
    () => Array.from(document.querySelectorAll('*'))
      .map(elem => elem.tagName)
  );
  console.log(data);
}

// graphVisualizationHere all the graphcics sit here..
// result transpiled results come here (diagrammer -> generator)
// graph_container CanVIZ
// debug_output
async function assertElementExists(elementId) {
  if (await page.$(elementId) == null) {
    throw new Error(`Element ${elementId} does not exist`);
  }
}

async function sleepABit(milliSeconds) {
  await new Promise(function (resolve) { setTimeout(resolve, milliSeconds) });
}

/**
 * @param {string} elementId 
 * @returns {string}
 */
async function getElementText(elementId) {
  await assertElementExists(elementId);
  return await page.$eval(elementId, element => element.value);
}

/**
 * @param {string} elementId 
 * @param {string} text
 */
async function writeToElement(elementId, text) {
  await assertElementExists(elementId);
  await page.$eval(elementId, (el, text) => el.value = text, text);
}

async function clearGeneratorResults() {
  await page.evaluate(function () {
    document.querySelector('textarea#result').value = ''
  });
}

async function waitForGeneratorResults() {
  await page.waitForSelector('#result:not([value=""])');
}

describe('Diagrammer', () => {
  beforeAll(async () => {
    await page.goto('http://localhost/~ede/diagrammer/');
    await page.setViewport({ width: 1800, height: 1800 });
  });

  it('Take a screenshot of the diagrammer"', async () => {
    //await page.screenshot({ path: 'screenshot1.png' });
    // TODO: Visual regression test
  });

  // https://www.npmjs.com/package/jest-environment-puppeteer
  it('test writing to ace editor', async () => {
    await clearGeneratorResults();
    await page.evaluate(() => {
      setGraphText('a>b>c');
      generatorChanged();
    });

    await waitForGeneratorResults();
  });

  it('should be able to select dendrogram', async () => {

    await clearGeneratorResults();

    // Select dendrogram as an example...
    await page.select('#example', 'test_inputs/dendrogram.txt');
    //await page.waitForSelector('#graphVisualizationHere:not(:empty)');
    await waitForGeneratorResults();

    const graphText = await page.evaluate(() => {
      return getGraphText();
    });
    await expect(graphText).toMatch(/^generator dendrogram/);
    // Uhh...UI side is so slow to pick up changes..
    // around 5s image is still old, after 6 we see the radial dendrogram!
    await sleepABit(6000);
    //await page.screenshot({ path: 'screenshot_dendro.png' });
  }, 20000);
});
