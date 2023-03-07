// @ts-check
import { type Page, type HTTPRequest, type HTTPResponse } from 'puppeteer'
// defines global.browser and global.page
// import 'jest-environment-puppeteer'

/**
 * Dump the whole page HTML (and return it)
 */
export async function dumpWholePage(page: Page) {
  const bodyHTML = await page.evaluate(() => document.body.innerHTML)
  return bodyHTML
}

/**
 * Dump each element in the page (and return them)
 *
 */
export async function dumpWholePage2(page: Page) {
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
 * @param  elementId CSS selector like #IdHere or textarea[name=xx]
 */
async function assertElementExists(page: Page, elementId: string) {
  if (await page.$(elementId) === null) {
    throw new Error(`Element ${elementId} does not exist`)
  }
}

/**
 * Sleep a bit, you should never need to use is after polishing the test properly
 */
export async function sleepABit(milliSeconds: number) {
  await new Promise(function (resolve) { setTimeout(resolve, milliSeconds) })
}

// /**
//  * @param elementId #IdHere, input[name=xx]
//  * @returns Return element text(value)
//  */
// export async function getElementText(page: Page, elementId: string) {
//   await assertElementExists(page, elementId)
//   return page.$eval(elementId, element => {
//     return (element as HTMLInputElement).value
//   })
// }

// /**
//  * @param elementId #IdHere, input[name=xx]
//  * @returns Return element innerHTML(value)
//  */
// export async function getElementInnerHtml(page: Page, elementId: string) {
//   await assertElementExists(page, elementId)
//   return page.$eval(elementId, element => {
//     return element.innerHTML
//   })
// }

// /**
//  * @param elementId #IdHere, input[name=xx]
//  */
// export async function setElementInnerHtml(page: Page, elementId: string, value: string) {
//   await assertElementExists(page, elementId)
//   return page.$eval(elementId, (element, value) => {
//     element.innerHTML = value
//   }, value)
// }

export async function writeToElement(page: Page, elementId: string, text: string) {
  await assertElementExists(page, elementId)
  await page.$eval(elementId, (el, text) => {
    (el as HTMLInputElement).value = text
  }, text)
}

function consoleLogWithTime(msg: string) {
  console.warn(`${new Date().toISOString()}: ${msg} `)
}
/**
 * Setup capture trap for all browser 'chatter' and dump on console
 * Useful while debugging tests - since browser runs headless..
 */
export async function captureBrowserLogs(page: Page) {
  page
    .on('console', message => {
      consoleLogWithTime(`${(message.type() as string).substr(0, 3).toUpperCase()} ${message.text() as string} `)
    })
    .on('pageerror', ({ message }) => { consoleLogWithTime(message) })
    .on('response', (response: HTTPResponse) => {
      consoleLogWithTime(`${response.status() as number} ${response.url() as string} `)
    })
    .on('requestfailed', (request: HTTPRequest) => {
      consoleLogWithTime(`${request.failure()?.errorText as string} ${request.url() as string}`)
    })
}
