import { dumpWholePage, dumpWholePage2, sleepABit, getElementText, writeToElement, captureBrowserLogs } from './jest_puppeteer_support.js';
import { clearGeneratorResults, getDiagrammerCode, selectExampleCode, waitUntilGraphDrawn, setDiagrammerCode, waitForGeneratorResults, clearParsingErrors, getParsingError, getGeneratorResult, clearGraph } from './diagrammer_support.js';
import * as jis from 'jest-image-snapshot';
import { singleElementScreenSnapshot } from './snapshot_single_element.js';
import { Page } from 'puppeteer';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

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
export function setConfig(filename, threshold = 0.0001) {
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
    const p = page;
    await p.goto('http://localhost/~ede/diagrammer/');
    await p.setViewport({ width: 1800, height: 1800 });
    // await captureBrowserLogs(page);
  });

  it('asserts against diagrammer main page regressions', async () => {
    /** @type {Page} */
    const p = page;
    expect.extend({
      toMatchImageSnapshot,
    });
    const image = await p.screenshot({ fullPage: true });
    expect(image).toMatchImageSnapshot(setConfig('main_screen_just_loaded', 0.0001));
  });

  it('ensures that writing diagrammer code is shown in ace editor', async () => {
    /** @type {Page} */
    const p = page;
    await clearGeneratorResults(p);
    await setDiagrammerCode(p, 'a>b>c');
    await waitForGeneratorResults(p);
    const graphText = await getDiagrammerCode(p);
    await expect(graphText).toMatch("a>b>c");
  });

  it('ensures that parsing error is displayed correctly', async () => {
    /** @type {Page} */
    const p = page;
    await clearGeneratorResults(p);
    // of course there isn't any pre-existing errors, but safer this way
    await clearParsingErrors(p);
    try {
      await setDiagrammerCode(p, 'a>');
      expect(false);
    } catch {
      // Parsing must fail!
    }

    const graphText = await getDiagrammerCode(p);
    await expect(graphText).toMatch("a>");

    const errorText = await getParsingError(p);
    await expect(errorText).toMatch(/^Parsing error:.+Parse error on line 1.+a&gt;/);
  });

  it('selects dendrogram example, verifies parsing succeeds and correct graph is visualized', async () => {
    /** @type {Page} */
    const p = page;
    await clearGeneratorResults(p);
    await clearGraph(p);

    await selectExampleCode(p, 'test_inputs/dendrogram.txt');
    await waitForGeneratorResults(p);

    const graphText = await getDiagrammerCode(p);
    await expect(graphText).toMatch(/^generator dendrogram/);

    await waitUntilGraphDrawn(p);
  }, 200 /* it takes sometimes about 40ms to parse/generate the graph on my laptop (linux running in WSL2)*/);

  /**
   * 
   * @param {Page} page 
   * @param {string} example File in tests/test_inputs/*.txt
   */
  async function testDynamicRendering(page, example) {
    await clearGeneratorResults(page);
    await clearGraph(page);
    await selectExampleCode(page, example);
    // <div id="default_"></div><svg id="the_SVG_ID" w..
    await waitUntilGraphDrawn(page);
    const svg = await page.evaluate(() => document.querySelector('#graphVisualizationHere>svg').outerHTML);
    const elementHandle = await page.$('#graphVisualizationHere>svg');
    const bbox = await elementHandle.boundingBox();
    const filename = example.match(/.+\/([^\.]+)/)[1];
    const snapshotConfig = setConfig(filename, 0.0001)
    const buffer = await singleElementScreenSnapshot(snapshotConfig, svg, bbox.width, bbox.height);
    expect.extend({
      toMatchImageSnapshot,
    });
    expect(buffer).toMatchImageSnapshot(snapshotConfig);

  };

  it('asserts dendrogram visualization works', async () => {
    await testDynamicRendering(page, 'test_inputs/dendrogram.txt');
  }, 1000);

  it('asserts sankey visualization works', async () => {
    await testDynamicRendering(page, 'test_inputs/sankey.txt');
  }, 1000);

  // it('asserts umlclass2(GoJS) visualization works', async () => {
  //   await testDynamicRendering(page, 'test_inputs/umlclass2.txt');
  // }, 1000);

  // it('asserts layerbands(GoJS) visualization works', async () => {
  //   await testDynamicRendering(page, 'test_inputs/layerbands.txt');
  // }, 1000);

  // it('asserts parsetree(GoJS) visualization works', async () => {
  //   await testDynamicRendering(page, 'test_inputs/parsetree.txt');
  // }, 1000);
});
