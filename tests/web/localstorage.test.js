import { dumpWholePage, dumpWholePage2, sleepABit, getElementText, writeToElement, captureBrowserLogs } from './jest_puppeteer_support.js';
import { clearGeneratorResults, getDiagrammerCode, selectExampleCode, waitUntilGraphDrawn, setDiagrammerCode, waitForGeneratorResults, clearParsingErrors, getParsingError, getGeneratorResult, clearGraph } from './diagrammer_support.js';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

// test saving, loading from local storage
describe('Diagrammer', () => {
    const localStorageFilename = 'localstorage1';
    const filenameSelector = 'input#filename';
    const localStorageKey = 'graphs';

    beforeAll(async () => {
        await page.goto('http://localhost/~ede/diagrammer/');
        await page.setViewport({ width: 1800, height: 1800 });
        // await captureBrowserLogs(page);
    });

    it('Edit code, save it to local storage', async () => {
        await setDiagrammerCode(page, 'this>is>localstorage>test');
        await writeToElement(page, filenameSelector, localStorageFilename);

        // CSS selector for puppeteer
        await page.click('form[name="contact"]>button#savefile');
        const storedGraphs = await page.evaluate((localStorageKey) => {
            return localStorage.getItem(localStorageKey);
        }, localStorageKey);
        expect(storedGraphs).toMatch("{\"localstorage1\":\"this>is>localstorage>test\"}");
    });

    it('Load code from local storage', async () => {
        await setDiagrammerCode(page, '');
        await writeToElement(page, filenameSelector, localStorageFilename);

        // CSS selector for puppeteer
        await page.click('form[name="contact"]>button#loadfile');
        expect(getDiagrammerCode(page)).resolves.toMatch("this>is>localstorage>test");
    });
});
