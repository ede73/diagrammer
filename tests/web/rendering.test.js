import { dumpWholePage, dumpWholePage2, sleepABit, getElementText, writeToElement, captureBrowserLogs } from './jest_puppeteer_support.js';
import { clearGeneratorResults, getDiagrammerCode, selectExampleCode, waitUntilGraphDrawn, setDiagrammerCode, waitForGeneratorResults, clearParsingErrors, getParsingError, getGeneratorResult, clearGraph } from './diagrammer_support.js';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

// graphVisualizationHere all the graphcics sit here..
// result transpiled results come here (diagrammer -> generator)
// graph_container CanVIZ
// debug_output

// jest-image-snapshot custom configuration in order to save screenshots and compare the with the baseline
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
    await page.goto('http://localhost/~ede/diagrammer/');
    await page.setViewport({ width: 1800, height: 1800 });
    // await captureBrowserLogs(page);
  });

  it('Take a screenshot of the diagrammer"', async () => {
    expect.extend({
      toMatchImageSnapshot,
    });
    //await page.screenshot({ path: 'screenshot1.png' });
    const image = await page.screenshot({ fullPage: true });
    expect(image).toMatchImageSnapshot(setConfig('main_screen_just_loaded', 0.0001));
  });

  it('test writing to ace editor', async () => {
    await clearGeneratorResults(page);
    await setDiagrammerCode(page, 'a>b>c');
    await waitForGeneratorResults(page);
    const graphText = await getDiagrammerCode(page);
    await expect(graphText).toMatch("a>b>c");
  });

  it('test language parser error handling', async () => {
    await clearGeneratorResults(page);
    // of course there isn't any pre-existing errors, but safer this way
    await clearParsingErrors(page);
    try {
      await setDiagrammerCode(page, 'a>');
      expect(false);
    } catch {
      // Parsing must fail!
    }

    const graphText = await getDiagrammerCode(page);
    await expect(graphText).toMatch("a>");

    const errorText = await getParsingError(page);
    await expect(errorText).toMatch(/^Parsing error:.+Parse error on line 1.+a&gt;/);
  });

  it('should be able to select dendrogram', async () => {
    //await captureBrowserLogs(page);
    await clearGeneratorResults(page);
    await clearGraph(page);
    // had an image here...
    //<div id="default_"></div><img align="bottom" width="400" height="400" id="image" src="http://localhost/~ede/diagrammer/web/result.png?v=1676328865406" style="height: auto;">
    //console.log(await page.evaluate(() => document.querySelector('#graphVisualizationHere').innerHTML));

    await selectExampleCode(page, 'test_inputs/dendrogram.txt');
    await waitForGeneratorResults(page);

    const graphText = await getDiagrammerCode(page);
    await expect(graphText).toMatch(/^generator dendrogram/);

    await waitForGeneratorResults(page);
    // <div id="default_"></div><svg id="the_SVG_ID" w..
    await waitUntilGraphDrawn(page);
    //await page.screenshot({ path: 'screenshot1.png' });
    // TODO: inspect the graph!
  }, 100 /* it takes sometimes about 40ms to parse/generate the graph on my laptop (linux running in WSL2)*/);
});
