// @ts-check
import { Page } from 'puppeteer'
import { setGraphText, generatorChanged, getGraphText } from '../../web/editorInteractions.js'

function getAndAssertHTMLElement(selector: string): HTMLElement {
  return document.querySelector(selector) as HTMLElement
}

export function getAndAssertHTMLInputElement(selector: string): HTMLInputElement {
  return getAndAssertHTMLElement(selector) as HTMLInputElement
}

/**
 * Clear the generator results (in order to be able to wait for the results)
 */
export async function clearGeneratorResults(page: Page) {
  await page.evaluate(function () {
    // cannot refer to local functions, this is executed in the browser
    (document.querySelector('#diagrammer-result') as HTMLInputElement).value = ''
  })
}

/**
 * Return parsed generated result
 */
export async function getGeneratorResult(page: Page) {
  return await page.evaluate(() => {
    // cannot refer to local functions, this is executed in the browser
    return (document.querySelector('#diagrammer-result') as HTMLInputElement).value
  })
}

/**
 * Wait until diagrammer parser(generator) has completed parsing/generation job
 */
export async function waitForGeneratorResults(page: Page) {
  await page.waitForSelector('#diagrammer-result:not([value=""])')
}

/**
 * Set diagrammer code and launch the parser
 */
export async function setDiagrammerCode(page: Page, code: string) {
  await page.evaluate((code) => {
    setGraphText(code)
    generatorChanged()
  }, code)
}

/**
 * Return what ever is in the diagrammer text editor
 */
export async function getDiagrammerCode(page: Page) {
  return await page.evaluate(() => {
    return getGraphText()
  })
}

/**
 * Clear parsing errors
 */
export async function clearParsingErrors(page: Page) {
  return await page.evaluate(() => {
    // cannot refer to local functions, this is executed in the browser
    (document.querySelector('div#diagrammer-error') as HTMLInputElement).innerHTML = ''
  })
}

/**
 * Return what ever parsing error
 */
export async function getParsingError(page: Page) {
  return await page.evaluate(() => {
    // cannot refer to local functions, this is executed in the browser
    return (document.querySelector('div#diagrammer-error') as HTMLInputElement).innerHTML
  })
}

/**
 * Select a test input from dropdown, initiate parsing
 * @param testname E.g. test_inputs/dendrogram.txt - antyhing that's coded to the dropdown
 */
export async function selectExampleCode(page: Page, testname: string) {
  // assert such a test exists in index.html example dropdown, will throw if doesn't
  await page.$(`select#diagrammer-example>option[value="${testname}"]`)
  await page.select('#diagrammer-example', testname)
}

/**
 * @param genViz eg. dendrogram:radialdendrogram
 */
export async function selectGeneratorVisualizer(page: Page, genViz: string) {
  // assert such a test exists in index.html example dropdown, will throw if doesn't
  await page.$(`select#diagrammer-generator>option[value="${genViz}"]`)
  await page.select('#diagrammer-generator', genViz)
}

/**
 * Clear the graph, so we can quickly wait for it to appear..
 */
export async function clearGraph(page: Page) {
  await page.evaluate(() => {
    // cannot refer to local functions, this is executed in the browser
    return (document.querySelector('#diagrammer-graph') as HTMLElement).innerHTML = ''
  })
}

/**
 * Wait until a NEW graph has been drawn
 */
export async function waitUntilGraphDrawn(page: Page) {
  // Uhh...UI side is so slow to pick up changes..
  // around 5s image is still old, after 6 we see the radial dendrogram!
  await page.waitForSelector('#diagrammer-graph:not(:empty)')
  // console.warn(await page.evaluate(() => document.querySelector('#diagrammer-graph').innerHTML));
  // await sleepABit(200);
}
