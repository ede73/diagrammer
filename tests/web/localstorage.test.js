// @ts-check
import { sleepABit, writeToElement } from './jest_puppeteer_support.js'
import { getDiagrammerCode, setDiagrammerCode, getParsingError, clearParsingErrors } from './diagrammer_support.js'
// used as type
// eslint-disable-next-line no-unused-vars
import { Page, HTTPRequest } from 'puppeteer'
// import { jest } from '@jest/globals'

// test saving, loading from local storage
describe('Diagrammer', () => {
  const localStorageFilename = 'localstorage1'
  const filenameSelector = 'input#diagrammer-filename'
  const localStorageKey = 'graphs'

  beforeAll(async () => {
    /** @type {Page} */
    // @ts-ignore
    // eslint-disable-next-line no-undef
    const p = page
    await p.goto('http://localhost/~ede/diagrammer/')
    await p.setViewport({ width: 1800, height: 1800 })
    await p.evaluate((localStorageKey) => {
      localStorage.clear()
    }, localStorageKey)
    p.on('dialog', async dialog => {
      // console.log(`Alert dialog displayed(${dialog.message()}), dismiss it`)
      await dialog.dismiss()
    })
  })

  // Jest/Puppeteer annoyance, using globals
  /** @type {Page} */
  let p
  beforeEach(async () => {
    /** @type {Page} */
    // @ts-ignore
    // eslint-disable-next-line no-undef
    p = page
  })

  it('Edit code, save it to local storage', async () => {
    await setDiagrammerCode(p, 'this>is>localstorage>test')
    await writeToElement(p, filenameSelector, localStorageFilename)

    // CSS selector for puppeteer
    await p.click('form[name="contact"]>button#diagrammer-savefile')
    const storedGraphs = await p.evaluate((localStorageKey) => {
      return localStorage.getItem(localStorageKey)
    }, localStorageKey)
    expect(storedGraphs).toMatch('{"localstorage1":"this>is>localstorage>test"}')
  })

  it('Load code from local storage', async () => {
    await setDiagrammerCode(p, '')
    await writeToElement(p, filenameSelector, localStorageFilename)

    // CSS selector for puppeteer
    await p.click('form[name="contact"]>button#diagrammer-loadfile')
    expect(getDiagrammerCode(p)).resolves.toMatch('this>is>localstorage>test')
    await clearParsingErrors(p)
  })

  // Initially wanted these to be in separare file, but tests executed in paraller, so messing up local storage (between these two tests)
  it('Import from external storage (mocked)', async () => {
    // mock the import
    await p.setRequestInterception(true)
    p.on('request', request => {
      if (request.url().includes('/web/loadExport.php')) {
        request.respond({
          contentType: 'application/json',
          body: JSON.stringify({ joo: 'a>b>c>d\n' })
        })
      }
    })

    await p.click('form[name="contact"]>button#import')

    // Import is asynchronous, it'll take a moment for results to arrive
    await sleepABit(100)
    await p.setRequestInterception(false)
    const storedGraphs = await p.evaluate((localStorageKey) => {
      return localStorage.getItem(localStorageKey)
    }, localStorageKey)
    expect(storedGraphs).toMatch('{"joo":"a>b>c>d\\n"}')
  })

  // Only way to know export worked (in RL) would be to change smthg, export, import
  // This basically tests backend integration which is bad
  // Would be enough to test button to export route
  it('Export to external storage (mocked)', async () => {
    // mock the import
    await clearParsingErrors(p)
    await p.setRequestInterception(true)
    p.on('request', /** @type {HTTPRequest} */interceptedRequest => {
      if (interceptedRequest.url().includes('/web/saveExport.php')) {
        interceptedRequest.respond({
          contentType: 'text/plain',
          body: '',
          status: 200
        })
      }
    })

    await p.click('form[name="contact"]>button#export')
    // Export is asynchronous, it'll take a moment for results to arrive
    await sleepABit(100)
    const error = await getParsingError(p)
    expect(error).toBeFalsy()
  })
})
