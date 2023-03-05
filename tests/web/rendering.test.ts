// @ts-check
import * as jis from 'jest-image-snapshot'
import { toMatchImageSnapshot } from 'jest-image-snapshot'
import { Page } from 'puppeteer'
import { clearGeneratorResults, clearGraph, clearParsingErrors, getDiagrammerCode, getParsingError, selectExampleCode, selectGeneratorVisualizer, setDiagrammerCode, waitForGeneratorResults, waitUntilGraphDrawn } from './diagrammer_support.js'
import { singleElementScreenSnapshot } from './snapshot_single_element.js'

/**
 */
export function setConfig(filename: string, threshold: number = 0.0001): jis.MatchImageSnapshotOptions {
  return {
    failureThreshold: threshold,
    failureThresholdType: 'percent',
    customSnapshotsDir: 'tests/web/snapshots/',
    customSnapshotIdentifier: filename,
    noColors: true
  }
}

describe('Diagrammer', () => {
  beforeAll(async () => {
    // @ts-ignore Jest-puppeteer annoyance, using globals
    const p: Page = page
    await p.goto('http://localhost/~ede/diagrammer/?do_not_load_initial_example=1')
    // Suddenly (after working for a long time!) started getting errors from here
    // Protocol error (Emulation.setDeviceMetricsOverride): Invalid parameters Failed to deserialize params.height
    // Usually if I close the chrome browser, this goes away, wtf? cache? out of memory?
    await p.setViewport({ width: 1024, height: 800 })
    // await captureBrowserLogs(page);
  })

  let p: Page
  beforeEach(async () => {
    // @ts-ignore Jest-puppeteer annoyance, using globals
    p = page
  })

  it('asserts against diagrammer main page regressions', async () => {
    expect.extend({
      toMatchImageSnapshot
    })
    const image = await p.screenshot({ fullPage: true })
    expect(image).toMatchImageSnapshot(setConfig('main_screen_just_loaded', 0.0001))
  })

  it('ensures that writing diagrammer code is shown in ace editor', async () => {
    await clearGeneratorResults(p)
    await setDiagrammerCode(p, 'a>b>c')
    await waitForGeneratorResults(p)
    const graphText = await getDiagrammerCode(p)
    await expect(graphText).toMatch('a>b>c')
  })

  it('ensures that parsing error is displayed correctly', async () => {
    await clearGeneratorResults(p)
    // of course there isn't any pre-existing errors, but safer this way
    await clearParsingErrors(p)
    try {
      await setDiagrammerCode(p, 'a>')
      expect(false)
    } catch {
      // Parsing must fail!
    }

    const graphText = await getDiagrammerCode(p)
    await expect(graphText).toMatch('a>')

    const errorText = await getParsingError(p)
    await expect(errorText).toMatch(/.*Parsing error:.+Parse error on line 1.+a&gt;/)
  })

  it('selects dendrogram example, verifies parsing succeeds and correct graph is visualized', async () => {
    await clearGeneratorResults(p)
    await clearGraph(p)

    await selectExampleCode(p, 'test_inputs/dendrogram.txt')
    await waitForGeneratorResults(p)

    const graphText = await getDiagrammerCode(p)
    await expect(graphText).toMatch(/^generator dendrogram/)

    await waitUntilGraphDrawn(p)
  }, 200 /* it takes sometimes about 40ms to parse/generate the graph on my laptop (linux running in WSL2) */)

  /**
   *
   * @param example File in tests/test_inputs/*.txt
   * @param overrideGeneratorVisualizer
   */
  async function testDynamicRendering(page: Page, example: string, overrideGeneratorVisualizer?: string) {
    await clearGeneratorResults(page)
    await clearGraph(page)
    await selectExampleCode(page, example)

    if (overrideGeneratorVisualizer) {
      // example code will run what ever generator it hat selected
      await waitUntilGraphDrawn(page)
      await clearGeneratorResults(page)
      await selectGeneratorVisualizer(page, overrideGeneratorVisualizer)
    }
    await waitUntilGraphDrawn(page)

    // TODO: D3.js ends up with div#graph../[div#default_,svg] GoJs div#graph../div#default_/svg
    const selector: string = (await page.$('#diagrammer-graph>svg') != null) ? '#diagrammer-graph>svg' : '#diagrammer-graph>div>svg'

    const elementHandle = await page.$(selector)
    if (!elementHandle) {
      throw new Error(`Could not find element ${selector}`)
    }
    // BBox, getBoundingClientRect
    const bbox = await elementHandle.boundingBox()
    const matches = example.match(/.+\/([^.]+)/)
    if (!matches) {
      throw new Error('Could not read example')
    }
    const filename = matches[1] + (overrideGeneratorVisualizer ? '_' + overrideGeneratorVisualizer.replace(':', '_') : '')
    const snapshotConfig = setConfig(filename, 1)
    const svg = await page.evaluate((selector: string) => document.querySelector(selector)?.outerHTML, selector)
    if (!svg) {
      throw Error("Could not get SVG code")
    }
    const buffer = await singleElementScreenSnapshot(browser, svg, bbox?.width, bbox?.height)
    expect.extend({
      toMatchImageSnapshot
    })
    expect(buffer).toMatchImageSnapshot(snapshotConfig)
  };

  it('asserts reingold-tilford(dendrogram)(d3.js) visualization works', async () => {
    // flaky: main page loads (initializes with) AST visualization BEFORE our new selection overrides it. Not a TEST problem, but rather index loading default visualization problem
    await testDynamicRendering(p, 'test_inputs/dendrogram.txt')
  }, 1000)

  it('asserts radial dendrogram(d3.js) visualization works', async () => {
    // flaky: main page loads (initializes with) AST visualization BEFORE our new selection overrides it. Not a TEST problem, but rather index loading default visualization problem
    await testDynamicRendering(p, 'test_inputs/dendrogram.txt', 'dendrogram:radialdendrogram')
  }, 1000)

  it('asserts sankey(d3.js) visualization works', async () => {
    await testDynamicRendering(p, 'test_inputs/sankey.txt')
  }, 1000)

  it('asserts circlepackage(d3.js) visualization works', async () => {
    // TODO:
  }, 1000)

  it('asserts umlclass2(GoJS) visualization works', async () => {
    await testDynamicRendering(p, 'test_inputs/umlclass2.txt')
  }, 1000)

  it('asserts layerbands(GoJS) visualization works', async () => {
    await testDynamicRendering(p, 'test_inputs/layerbands.txt')
  }, 1000)

  it('asserts parsetree(GoJS) visualization works', async () => {
    await testDynamicRendering(p, 'test_inputs/parsetree.txt')
  }, 1000)
})
