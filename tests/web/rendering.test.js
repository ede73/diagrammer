import * as jis from 'jest-image-snapshot'
import { toMatchImageSnapshot } from 'jest-image-snapshot'
import { Page } from 'puppeteer'
import { clearGeneratorResults, clearGraph, clearParsingErrors, getDiagrammerCode, getParsingError, selectExampleCode, selectGeneratorVisualizer, setDiagrammerCode, waitForGeneratorResults, waitUntilGraphDrawn } from './diagrammer_support.js'
import { singleElementScreenSnapshot } from './snapshot_single_element.js'

// graphVisualizationHere all the graphcics sit here..
// result transpiled results come here (diagrammer -> generator)
// graph_container CanVIZ
// debug_output

/**
 *
 * @param {string} filename
 * @param {float} threshold
 * @returns {jis.toMatchImageSnapshot}
 */
export function setConfig (filename, threshold = 0.0001) {
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
    /** @type {Page} */
    const p = page
    await p.goto('http://localhost/~ede/diagrammer/')
    await p.setViewport({ width: 1800, height: 1800 })
    // await captureBrowserLogs(page);
  })

  it('asserts against diagrammer main page regressions', async () => {
    /** @type {Page} */
    const p = page
    expect.extend({
      toMatchImageSnapshot
    })
    const image = await p.screenshot({ fullPage: true })
    expect(image).toMatchImageSnapshot(setConfig('main_screen_just_loaded', 0.0001))
  })

  it('ensures that writing diagrammer code is shown in ace editor', async () => {
    /** @type {Page} */
    const p = page
    await clearGeneratorResults(p)
    await setDiagrammerCode(p, 'a>b>c')
    await waitForGeneratorResults(p)
    const graphText = await getDiagrammerCode(p)
    await expect(graphText).toMatch('a>b>c')
  })

  it('ensures that parsing error is displayed correctly', async () => {
    /** @type {Page} */
    const p = page
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
    await expect(errorText).toMatch(/^Parsing error:.+Parse error on line 1.+a&gt;/)
  })

  it('selects dendrogram example, verifies parsing succeeds and correct graph is visualized', async () => {
    /** @type {Page} */
    const p = page
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
   * @param {Page} page
   * @param {string} example File in tests/test_inputs/*.txt
   */
  async function testDynamicRendering (page, example, overrideGeneratorVisualizer) {
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
    const selector = (await page.$('#graphVisualizationHere>svg') != null) ? '#graphVisualizationHere>svg' : '#graphVisualizationHere>div>svg'
    const svg = await page.evaluate((selector) => document.querySelector(selector).outerHTML, selector)
    const elementHandle = await page.$(selector)
    const bbox = await elementHandle.boundingBox()
    const filename = example.match(/.+\/([^\.]+)/)[1] + (overrideGeneratorVisualizer ? '_' + overrideGeneratorVisualizer.replace(':', '_') : '')
    const snapshotConfig = setConfig(filename, 1)
    const buffer = await singleElementScreenSnapshot(snapshotConfig, svg, bbox.width, bbox.height)
    expect.extend({
      toMatchImageSnapshot
    })
    expect(buffer).toMatchImageSnapshot(snapshotConfig, 0.0001)
  };

  it('asserts reingold-tilford(dendrogram)(d3.js) visualization works', async () => {
    await testDynamicRendering(page, 'test_inputs/dendrogram.txt')
  }, 1000)

  it('asserts radial dendrogram(d3.js) visualization works', async () => {
    await testDynamicRendering(page, 'test_inputs/dendrogram.txt', 'dendrogram:radialdendrogram')
  }, 1000)

  it('asserts sankey(d3.js) visualization works', async () => {
    await testDynamicRendering(page, 'test_inputs/sankey.txt')
  }, 1000)

  it('asserts circlepackage(d3.js) visualization works', async () => {
    // TODO:
  }, 1000)

  it('asserts umlclass2(GoJS) visualization works', async () => {
    await testDynamicRendering(page, 'test_inputs/umlclass2.txt')
  }, 1000)

  it('asserts layerbands(GoJS) visualization works', async () => {
    await testDynamicRendering(page, 'test_inputs/layerbands.txt')
  }, 1000)

  it('asserts parsetree(GoJS) visualization works', async () => {
    await testDynamicRendering(page, 'test_inputs/parsetree.txt')
  }, 1000)
})
