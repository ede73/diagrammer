import { dumpWholePage, dumpWholePage2, sleepABit, getElementText, writeToElement, captureBrowserLogs } from './jest_puppeteer_support.js';
import { clearGeneratorResults, getDiagrammerCode, selectExampleCode, waitUntilGraphDrawn, setDiagrammerCode, waitForGeneratorResults, clearParsingErrors, getParsingError, getGeneratorResult, clearGraph } from './diagrammer_support.js';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

// test saving, loading from local storage
describe('Diagrammer', () => {
    beforeAll(async () => {
        await page.goto('http://localhost/~ede/diagrammer/');
        await page.setViewport({ width: 1800, height: 1800 });
        // await captureBrowserLogs(page);
    });

    it('Edit code, save it to local storage', async () => {
        //TODO:
    });

    it('Load code from local storage', async () => {
        //TODO:
    });
});
