import * as fs from 'fs'
// required to populate generators/visualizations
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { diagrammerParser } from '../build/diagrammer_parser.js'
import * as puppeteer from 'puppeteer'
import { type Page } from 'puppeteer'
import { singleElementScreenSnapshot } from '../tests/web/snapshot_single_element.js'
import {
  clearGeneratorResults, clearParsingErrors, getParsingError,
  selectGeneratorVisualizer, setDiagrammerCode, waitForGeneratorResults, waitUntilGraphDrawn
} from '../tests/web/diagrammer_support.js'
import { type VisualizeConfigType } from './visualizeConfigType.js'

// just a test code
async function _sshot(page: Page) {
  const options = {
    path: 'sshot.png',
    fullPage: false,
    clip: {
      x: 0,
      y: 0,
      width: 1024,
      height: 800
    }
  }
  await page.screenshot(options)
}

// TODO: oddity for momentarily, expecting diagrammer, not parser language..will change
async function _webRender(useConfig: VisualizeConfigType, visualizer: string, diagrammerCode: string, outputShot: string) {
  useConfig.tp(`Web render using ${visualizer} saving output to ${outputShot}`)
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  if (!useConfig.webPort) {
    useConfig.throwError('Missing webPort from config, cannot render')
  }
  await page.goto(`http://localhost:${useConfig.webPort}/?do_not_load_initial_example=1`)
  await page.setViewport({ width: 1024, height: 800 })

  await selectGeneratorVisualizer(page, visualizer)
  await waitUntilGraphDrawn(page)
  await clearParsingErrors(page)
  await clearGeneratorResults(page)
  await setDiagrammerCode(page, diagrammerCode)
  await waitForGeneratorResults(page)

  // TODO: D3.js ends up with div#graph../[div#default_,svg] GoJs div#graph../div#default_/svg
  const selector = (await page.$('#diagrammer-graph>svg') != null) ? '#diagrammer-graph>svg' : '#diagrammer-graph>div>svg'
  const elementHandle = await page.$(selector)

  const error = await getParsingError(page)
  if (error.trim()) {
    useConfig.throwError(error)
  }
  if (!elementHandle) {
    await _sshot(page)
    useConfig.throwError(`Could not find element ${selector}`)
  }
  // BBox, getBoundingClientRect
  const bbox = await elementHandle?.boundingBox()
  const svg = await page.evaluate((selector) => document.querySelector(selector).outerHTML, selector)
  if (!svg) {
    useConfig.throwError('Could not get SVG code')
  }
  const buffer = await singleElementScreenSnapshot(browser, svg, bbox?.width, bbox?.height)

  if (useConfig.isPipeMarker(outputShot)) {
    // TODO: yeah..doesnt work
    process.stdout.write(buffer)
  } else {
    const x = fs.createWriteStream(outputShot, { flags: 'w', autoClose: true })
    x.write(buffer)
    x.end()
  }
  await browser.close()
}

// TODO: read dynamically
export function _getWebVisualizers() {
  return ['dendrogram:circlepacked', 'dendrogram:radialdendrogram', 'dendrogram:reingoldtilford',
    'digraph:circo', 'digraph:dot', 'digraph:fdp', 'digraph:neato', 'digraph:osage',
    'digraph:sfdp', 'digraph:twopi', 'layerbands', 'parsetree', 'sankey', 'umlclass']
}

// TODO: oddity for momentarily, expecting diagrammer, not parser language..will change
export async function doWebVisualize(
  useConfig: VisualizeConfigType,
  generatedGraphCode: string,
  visualizer: string,
  finished: (exitcode: number) => void) {
  await _webRender(useConfig, useConfig.visualizer, generatedGraphCode, useConfig.visualizedGraph)
  finished(0)
}
