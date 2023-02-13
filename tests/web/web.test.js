import { dumpWholePage, dumpWholePage2, sleepABit, getElementText, writeToElement, captureBrowserLogs } from './jest_puppeteer_support.js';
import { clearGeneratorResults, getDiagrammerCode, selectExampleCode, waitUntilGraphDrawn, setDiagrammerCode, waitForGeneratorResults, clearParsingErrors, getParsingError, getGeneratorResult } from './diagrammer_support.js';

// graphVisualizationHere all the graphcics sit here..
// result transpiled results come here (diagrammer -> generator)
// graph_container CanVIZ
// debug_output

describe('Diagrammer', () => {
  beforeAll(async () => {
    await page.goto('http://localhost/~ede/diagrammer/');
    await page.setViewport({ width: 1800, height: 1800 });
    await captureBrowserLogs(page);
  });

  it('Take a screenshot of the diagrammer"', async () => {
    //await page.screenshot({ path: 'screenshot1.png' });
    // TODO: Visual regression test
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
    await clearGeneratorResults(page);
    await selectExampleCode(page, 'test_inputs/dendrogram.txt');
    await waitForGeneratorResults(page);

    const graphText = await getDiagrammerCode(page);
    await expect(graphText).toMatch(/^generator dendrogram/);

    await waitForGeneratorResults(page);
  }, 20000);
});
