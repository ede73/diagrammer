// @ts-check
// eslint-disable-next-line no-unused-vars
import { Page } from 'puppeteer'
import { setGraphText, generatorChanged, getGraphText } from '../../web/editorInteractions.js'

/**
 * Clear the generator results (in order to be able to wait for the results)
 * @param {Page} page
 * @return {Promise<void>}
 */
export async function clearGeneratorResults (page) {
  await page.evaluate(function () {
    // @ts-ignore
    document.querySelector('#diagrammer-result').value = ''
  })
}

/**
 * Return parsed generated result
 * @param {Page} page
 * @return {Promise<string>}
 */
export async function getGeneratorResult (page) {
  return await page.evaluate(() => {
    // @ts-ignore
    return document.querySelector('#diagrammer-result').value
  })
}

/**
 * Wait until diagrammer parser(generator) has completed parsing/generation job
 * @param {Page} page
 * @return {Promise<void>}
 */
export async function waitForGeneratorResults (page) {
  await page.waitForSelector('#diagrammer-result:not([value=""])')
}

/**
 * Set diagrammer code and launch the parser
 * @param {Page} page
 * @param {string} code
 * @return {Promise<void>}
 */
export async function setDiagrammerCode (page, code) {
  await page.evaluate((code) => {
    setGraphText(code)
    generatorChanged()
  }, code)
}

/**
 * Return what ever is in the diagrammer text editor
 * @param {Page} page
 * @return {Promise<string>}
 */
export async function getDiagrammerCode (page) {
  return await page.evaluate(() => {
    return getGraphText()
  })
}

/**
 * Clear parsing errors
 * @param {Page} page
 * @return {Promise<void>}>
 */
export async function clearParsingErrors (page) {
  return await page.evaluate(() => {
    // @ts-ignore
    document.querySelector('div#diagrammer-error').innerHTML = ''
  })
}

/**
 * Return what ever parsing error
 * @param {Page} page
 * @return {Promise<string>}
 */
export async function getParsingError (page) {
  return await page.evaluate(() => {
    // @ts-ignore
    return document.querySelector('div#diagrammer-error').innerHTML
  })
}

/**
 * Select a test input from dropdown, initiate parsing
 * @param {Page} page
 * @param {string} testname E.g. test_inputs/dendrogram.txt - antyhing that's coded to the dropdown
 * @return {Promise<void>}
 */
export async function selectExampleCode (page, testname) {
  // assert such a test exists in index.html example dropdown, will throw if doesn't
  await page.$(`select#diagrammer-example>option[value="${testname}"]`)
  await page.select('#diagrammer-example', testname)
}

/**
 *
 * @param {Page} page
 * @param {string} genViz eg. dendrogram:radialdendrogram
 */
export async function selectGeneratorVisualizer (page, genViz) {
  // assert such a test exists in index.html example dropdown, will throw if doesn't
  await page.$(`select#generator>option[value="${genViz}"]`)
  await page.select('#generator', genViz)
}

/**
 * Clear the graph, so we can quickly wait for it to appear..
 * @param {Page} page
 */
export async function clearGraph (page) {
  await page.evaluate(() => {
    // @ts-ignore
    document.querySelector('#diagrammer-graph').innerHTML = ''
  })
}

/**
 * Wait until a NEW graph has been drawn
 * @param {Page} page
 * @return {Promise<void>}
 */
export async function waitUntilGraphDrawn (page) {
  // Uhh...UI side is so slow to pick up changes..
  // around 5s image is still old, after 6 we see the radial dendrogram!
  await page.waitForSelector('#diagrammer-graph:not(:empty)')
  // console.log(await page.evaluate(() => document.querySelector('#diagrammer-graph').innerHTML));
  // await sleepABit(200);
}
