import { dumpWholePage, dumpWholePage2, sleepABit, getElementText, writeToElement, captureBrowserLogs } from './jest_puppeteer_support.js';
import { clearGeneratorResults, getDiagrammerCode, selectExampleCode, waitUntilGraphDrawn, setDiagrammerCode, waitForGeneratorResults, clearParsingErrors, getParsingError, getGeneratorResult, clearGraph } from './diagrammer_support.js';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

// test importing and exporting via external interface
describe('Diagrammer', () => {
    beforeAll(async () => {
        await page.goto('http://localhost/~ede/diagrammer/');
        await page.setViewport({ width: 1800, height: 1800 });
        // await captureBrowserLogs(page);
    });

    it('Import from external storage (mocked)', async () => {
        // TODO:
    });

    it('Export to external storage (mocked)', async () => {
        // TODO:
    });
});  