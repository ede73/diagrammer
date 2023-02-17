import { sleepABit, writeToElement } from './jest_puppeteer_support.js'
import { getDiagrammerCode, setDiagrammerCode } from './diagrammer_support.js'

// test saving, loading from local storage
describe('Diagrammer', () => {
  const localStorageFilename = 'localstorage1'
  const filenameSelector = 'input#filename'
  const localStorageKey = 'graphs'

  beforeAll(async () => {
    /** @type {Page} */
    // eslint-disable-next-line no-undef
    const p = page
    await p.goto('http://localhost/~ede/diagrammer/')
    await p.setViewport({ width: 1800, height: 1800 })
    await p.evaluate((localStorageKey) => {
      localStorage.clear(localStorageKey)
    }, localStorageKey)
    p.on('dialog', async dialog => {
      console.log(`Alert dialog displayed(${dialog.message()}), dismiss it`)
      await dialog.dismiss()
    })
    // await captureBrowserLogs(page);
  })

  it('Edit code, save it to local storage', async () => {
    /** @type {Page} */
    // eslint-disable-next-line no-undef
    const p = page
    await setDiagrammerCode(p, 'this>is>localstorage>test')
    await writeToElement(p, filenameSelector, localStorageFilename)

    // CSS selector for puppeteer
    await p.click('form[name="contact"]>button#savefile')
    const storedGraphs = await p.evaluate((localStorageKey) => {
      return localStorage.getItem(localStorageKey)
    }, localStorageKey)
    expect(storedGraphs).toMatch('{"localstorage1":"this>is>localstorage>test"}')
  })

  it('Load code from local storage', async () => {
    /** @type {Page} */
    // eslint-disable-next-line no-undef
    const p = page
    await setDiagrammerCode(p, '')
    await writeToElement(p, filenameSelector, localStorageFilename)

    // CSS selector for puppeteer
    await p.click('form[name="contact"]>button#loadfile')
    expect(getDiagrammerCode(p)).resolves.toMatch('this>is>localstorage>test')
  })

  // Initially wanted these to be in separare file, but tests executed in paraller, so messing up local storage (between these two tests)
  it('Import from external storage (mocked)', async () => {
    /** @type {Page} */
    // eslint-disable-next-line no-undef
    const p = page
    await p.click('form[name="contact"]>button#import')

    // TODO: mock out
    // Import is asynchronous, it'll take a moment for results to arrive
    await sleepABit(500)

    const storedGraphs = await p.evaluate((localStorageKey) => {
      return localStorage.getItem(localStorageKey)
    }, localStorageKey)
    await sleepABit(2000)
    expect(storedGraphs).toMatch('{"joo":"a>b>c>d\\n"}')
  })

  // Only way to know export worked (in RL) would be to change smthg, export, import
  // This basically tests backend integration which is bad
  // Would be enough to test button to export route
  it.skip('Export to external storage (mocked)', async () => {
    /** @type {Page} */
    // eslint-disable-next-line no-undef
    const p = page
    // TODO:
    // await captureBrowserLogs(page);
    await p.click('form[name="contact"]>button#export')

    // TODO: mock out
    // Import is asynchronous, it'll take a moment for results to arrive
    await sleepABit(500)

    expect(true).toBeTruthy()
  })
})
