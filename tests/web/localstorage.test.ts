// @ts-check
import { sleepABit, writeToElement } from './jest_puppeteer_support.js'
import { getDiagrammerCode, setDiagrammerCode, getParsingError, clearParsingErrors } from './diagrammer_support.js'
import { type Page } from 'puppeteer'
import { describe, expect, it } from '@jest/globals'
import { captureBrowserLogs } from './jest_puppeteer_support.js'
// test saving, loading from local storage
describe('Diagrammer', () => {
  const localStorageFilename = 'localstorage1'
  const filenameSelector = 'input#diagrammer-filename'
  const localStorageKey = 'graphs'

  beforeAll(async () => {
    // @ts-expect-error page = jest global
    const p: Page = page
    // await p.goto('http://localhost/~ede/diagrammer/')
    await p.goto('http://localhost:8000')
    await p.setViewport({ width: 1800, height: 1800 })
    p.on('dialog', async dialog => {
      // console.warn(`Alert dialog displayed(${dialog.message()}), dismiss it`)
      await dialog.dismiss()
    })
  })

  // Jest/Puppeteer annoyance, using globals
  let p: Page
  beforeEach(async () => {
    // @ts-expect-error page = jest global
    p = page
    await p.evaluate((localStorageKey) => {
      localStorage.clear()
    }, localStorageKey)
  })

  it('Edit code, save it to local storage', async () => {
    await p.evaluate((localStorageKey) => {
      localStorage.clear()
    }, localStorageKey)
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
    await p.evaluate((localStorageKey) => {
      localStorage.setItem('graphs', '{"localstorage1":"this>is>localstorage>test"}')
    }, localStorageKey)
    await setDiagrammerCode(p, '')
    await writeToElement(p, filenameSelector, localStorageFilename)

    // CSS selector for puppeteer
    await p.click('form[name="contact"]>button#diagrammer-loadfile')
    expect(getDiagrammerCode(p)).resolves.toMatch('this>is>localstorage>test')
    await clearParsingErrors(p)
  })

  // Initially wanted these to be in separare file, but tests executed in paraller, so messing up local storage (between these two tests)
  it('Import from external storage (mocked)', async () => {
    await p.evaluate((localStorageKey) => {
      localStorage.setItem('graphs', '{"localstorage1":"this>is>localstorage>test"}')
    }, localStorageKey)
    // mock the import
    await p.setRequestInterception(true)
    p.on('request', request => {
      if (request.url().includes('/loadExport')) {
        request.respond({
          contentType: 'application/json',
          body: JSON.stringify({ joo: 'a>b>c>d\n' })
        })
      }
    })

    await p.click('form[name="contact"]>button#diagrammer-import')

    // Import is asynchronous, it'll take a moment for results to arrive
    await sleepABit(100)
    await p.setRequestInterception(false)
    const storedGraphs = await p.evaluate((localStorageKey) => {
      return localStorage.getItem(localStorageKey)
    }, localStorageKey)
    // we have import now (ie. external changes imported over to local ones)
    expect(storedGraphs).toMatch('{"localstorage1":"this>is>localstorage>test","joo":"a>b>c>d\\n"}')
    await p.setRequestInterception(false)
  })

  // Only way to know export worked (in RL) would be to change smthg, export, import
  // This basically tests backend integration which is bad
  // Would be enough to test button to export route
  it('Export to external storage (mocked)', async () => {
    // mock the import
    await clearParsingErrors(p)
    await p.setRequestInterception(true)
    p.on('request', interceptedRequest => {
      if (interceptedRequest.url().includes('/saveExport')) {
        interceptedRequest.respond({
          contentType: 'text/plain',
          body: '',
          status: 200
        })
      }
    })

    await p.click('form[name="contact"]>button#diagrammer-export')
    // Export is asynchronous, it'll take a moment for results to arrive
    await sleepABit(100)
    const error = await getParsingError(p)
    expect(error).toBeFalsy()
    await p.setRequestInterception(false)
  })
})
