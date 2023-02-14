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
        await page.evaluate((localStorageKey) => {
            localStorage.clear(localStorageKey);
        }, localStorageKey);
        page.on('dialog', async dialog => {
            console.log(`Alert dialog displayed(${dialog.message()}), dismiss it`);
            await dialog.dismiss();
        });
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

    // Initially wanted these to be in separare file, but tests executed in paraller, so messing up local storage (between these two tests)
    it('Import from external storage (mocked)', async () => {
        await page.click('form[name="contact"]>button#import');

        // TODO: mock out
        // Import is asynchronous, it'll take a moment for results to arrive
        await sleepABit(500);

        const storedGraphs = await page.evaluate((localStorageKey) => {
            return localStorage.getItem(localStorageKey);
        }, localStorageKey);
        await sleepABit(2000);
        expect(storedGraphs).toMatch("{\"joo\":\"a>b>c>d\\n\"}");
    });

    // Only way to know export worked (in RL) would be to change smthg, export, import
    // This basically tests backend integration which is bad
    // Would be enough to test button to export route
    it.skip('Export to external storage (mocked)', async () => {
        // TODO:
        //await captureBrowserLogs(page);
        await page.click('form[name="contact"]>button#export');

        // TODO: mock out
        // Import is asynchronous, it'll take a moment for results to arrive
        await sleepABit(500);

        expect(true).toBeTruthy();
    });
});
