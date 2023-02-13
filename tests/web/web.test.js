import { dumpWholePage, dumpWholePage2, sleepABit, getElementText, writeToElement } from './jest_puppeteer_support.js';
import { clearGeneratorResults, getDiagrammerCode, selectExampleCode, waitUntilGraphDrawn, setDiagrammerCode, waitForGeneratorResults } from './diagrammer_support.js';

// graphVisualizationHere all the graphcics sit here..
// result transpiled results come here (diagrammer -> generator)
// graph_container CanVIZ
// debug_output

describe('Diagrammer', () => {
  beforeAll(async () => {
    await page.goto('http://localhost/~ede/diagrammer/');
    await page.setViewport({ width: 1800, height: 1800 });
  });

  it('Take a screenshot of the diagrammer"', async () => {
    //await page.screenshot({ path: 'screenshot1.png' });
    // TODO: Visual regression test
  });

  it('test writing to ace editor', async () => {
    await clearGeneratorResults(page);
    await setDiagrammerCode(page, 'a>b>c');
    await waitForGeneratorResults(page);
  });

  it('should be able to select dendrogram', async () => {
    await clearGeneratorResults(page);
    await selectExampleCode(page, 'test_inputs/dendrogram.txt');
    await waitForGeneratorResults(page);

    const graphText = await getDiagrammerCode(page);
    await expect(graphText).toMatch(/^generator dendrogram/);

    await waitForGeneratorResults(page);
  }, 20000);
});
