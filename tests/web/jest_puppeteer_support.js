// eslint-disable-next-line no-unused-vars
import { Page, Puppeteer } from 'puppeteer'

/**
 * Dump the whole page HTML (and return it)
 * @param {Page} page
 * @return {Promise<string>} Page HTML
 */
export async function dumpWholePage (page) {
  const bodyHTML = await page.evaluate(() => document.body.innerHTML)
  return bodyHTML
}

/**
 * Dump each element in the page (and return them)
 *
 * @param {Page} page
 * @return {Promise<string[]>} Page HTML
 */
export async function dumpWholePage2 (page) {
  // https://stackoverflow.com/questions/54563410/how-to-get-all-html-data-after-all-scripts-and-page-loading-is-done-puppeteer
  const data = await page.evaluate(
    () => Array.from(document.querySelectorAll('*'))
      .map(elem => elem.tagName)
  )
  return data
}

/**
 * Assert a given element exists
 *
 * Used internally flagging errors in selectors
 *
 * @param {Page} page
 * @param {string} elementId CSS selector like #IdHere or textarea[name=xx]
 * @return {Promise<void>}
 */
async function assertElementExists (page, elementId) {
  if (await page.$(elementId) == null) {
    throw new Error(`Element ${elementId} does not exist`)
  }
}

/**
 * Sleep a bit, you should never need to use is after polishing the test properly
 * @param {number} milliSeconds
 * @return {Promise<void>}
 */
export async function sleepABit (milliSeconds) {
  await new Promise(function (resolve) { setTimeout(resolve, milliSeconds) })
}

/**
 * @param {Page} page
 * @param {string} elementId #IdHere, input[name=xx]
 * @returns {Promise<string>} Return element text(value)
 */
export async function getElementText (page, elementId) {
  await assertElementExists(elementId)
  return await page.$eval(elementId, element => element.value)
}

/**
 * @param {Page} page
 * @param {string} elementId
 * @param {string} text
 * @return {Promise<void>}
 */
export async function writeToElement (page, elementId, text) {
  await assertElementExists(page, elementId)
  await page.$eval(elementId, (el, text) => { el.value = text }, text)
}

function consoleLogWithTime (msg) {
  console.log(`${new Date().toISOString()}: ${msg} `)
}
/**
 * Setup capture trap for all browser 'chatter' and dump on console
 * Usefull while debugging tests - since browser runs headless..
 *
 * @param {Page} page
 * @return {Promsise<void>}
 */
export async function captureBrowserLogs (page) {
  page
    .on('console', message =>
      consoleLogWithTime(`${message.type().substr(0, 3).toUpperCase()} ${message.text()} `))
    .on('pageerror', ({ message }) => consoleLogWithTime(message))
    .on('response', response =>
      consoleLogWithTime(`${response.status()} ${response.url()} `))
    .on('requestfailed', request =>
      consoleLogWithTime(`${request.failure().errorText} ${request.url()} `))
}
