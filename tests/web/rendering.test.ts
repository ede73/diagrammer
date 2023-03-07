// @ts-check
import type * as jis from 'jest-image-snapshot'
import { toMatchImageSnapshot } from 'jest-image-snapshot'
// import { type Page } from 'puppeteer'
import { clearGeneratorResults, clearGraph, clearParsingErrors, getDiagrammerCode, getParsingError, selectExampleCode, selectGeneratorVisualizer, setDiagrammerCode, waitForGeneratorResults, waitUntilGraphDrawn } from './diagrammer_support.js'
import { singleElementScreenSnapshot } from './snapshot_single_element.js'
import { describe, expect, it } from '@jest/globals'
// defines global.browser and global.page
import 'jest-environment-puppeteer'
import { type Page, type Browser } from 'puppeteer'

// node_modules/jest-environment-puppeteer/lib/env.js:201:                this.global.browser = await puppeteer.connect({

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

// jest-puppeteer adds shit to puppeteer Page (subtype)
const getPage = (): Page => { return page as unknown as Page }

describe('Diagrammer', () => {
  beforeAll(async () => {
    await page.goto('http://localhost/~ede/diagrammer/?do_not_load_initial_example=1')
    // Suddenly (after working for a long time!) started getting errors from here
    // Protocol error (Emulation.setDeviceMetricsOverride): Invalid parameters Failed to deserialize params.height
    // Usually if I close the chrome browser, this goes away, wtf? cache? out of memory?
    await page.setViewport({ width: 1024, height: 800 })
    // await captureBrowserLogs(page);
  })

  it('asserts against diagrammer main page regressions', async () => {
    expect.extend({
      toMatchImageSnapshot
    })
    const image = await page.screenshot({ fullPage: true })
    expect(image).toMatchImageSnapshot(setConfig('main_screen_just_loaded', 0.0001))
  })

  it('ensures that writing diagrammer code is shown in ace editor', async () => {
    await clearGeneratorResults(getPage())
    await setDiagrammerCode(getPage(), 'a>b>c')
    await waitForGeneratorResults(getPage())
    const graphText = await getDiagrammerCode(getPage())
    await expect(graphText).toMatch('a>b>c')
  })

  it('ensures that parsing error is displayed correctly', async () => {
    await clearGeneratorResults(getPage())
    // of course there isn't any pre-existing errors, but safer this way
    await clearParsingErrors(getPage())
    try {
      await setDiagrammerCode(getPage(), 'a>')
      expect(false)
    } catch {
      // Parsing must fail!
    }

    const graphText = await getDiagrammerCode(getPage())
    await expect(graphText).toMatch('a>')

    const errorText = await getParsingError(getPage())
    await expect(errorText).toMatch(/.*Parsing error:.+Parse error on line 1.+a&gt;/)
  })

  it('selects dendrogram example, verifies parsing succeeds and correct graph is visualized', async () => {
    await clearGeneratorResults(getPage())
    await clearGraph(getPage())

    await selectExampleCode(getPage(), 'test_inputs/dendrogram.txt')
    await waitForGeneratorResults(getPage())

    const graphText = await getDiagrammerCode(getPage())
    await expect(graphText).toMatch(/^generator dendrogram/)

    await waitUntilGraphDrawn(getPage())
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
      throw Error('Could not get SVG code')
    }
    // jest-puppeteer adds its own shit to browser and conflicts with puppeteer Browser (subtype)
    const buffer = await singleElementScreenSnapshot(browser as unknown as Browser, svg, bbox?.width, bbox?.height)
    expect.extend({
      toMatchImageSnapshot
    })
    expect(buffer).toMatchImageSnapshot(snapshotConfig)
  };

  it('asserts reingold-tilford(dendrogram)(d3.js) visualization works', async () => {
    // flaky: main page loads (initializes with) AST visualization BEFORE our new selection overrides it. Not a TEST problem, but rather index loading default visualization problem
    await testDynamicRendering(getPage(), 'test_inputs/dendrogram.txt')
  }, 1000)

  it('asserts radial dendrogram(d3.js) visualization works', async () => {
    // flaky: main page loads (initializes with) AST visualization BEFORE our new selection overrides it. Not a TEST problem, but rather index loading default visualization problem
    await testDynamicRendering(getPage(), 'test_inputs/dendrogram.txt', 'dendrogram:radialdendrogram')
  }, 1000)

  it('asserts sankey(d3.js) visualization works', async () => {
    await testDynamicRendering(getPage(), 'test_inputs/sankey.txt')
  }, 1000)

  it('asserts circlepackage(d3.js) visualization works', async () => {
    // TODO:
  }, 1000)

  it('asserts umlclass2(GoJS) visualization works', async () => {
    await testDynamicRendering(getPage(), 'test_inputs/umlclass2.txt')
  }, 1000)

  it('asserts layerbands(GoJS) visualization works', async () => {
    await testDynamicRendering(getPage(), 'test_inputs/layerbands.txt')
  }, 1000)

  it('asserts parsetree(GoJS) visualization works', async () => {
    await testDynamicRendering(getPage(), 'test_inputs/parsetree.txt')
  }, 1000)
})
