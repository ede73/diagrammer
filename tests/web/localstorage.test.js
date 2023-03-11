import { sleepABit, writeToElement } from './jest_puppeteer_support.js';
import { getDiagrammerCode, setDiagrammerCode, getParsingError, clearParsingErrors } from './diagrammer_support.js';
import { describe, expect, it } from '@jest/globals';
describe('Diagrammer', () => {
    const localStorageFilename = 'localstorage1';
    const filenameSelector = 'input#diagrammer-filename';
    const localStorageKey = 'graphs';
    beforeAll(async () => {
        const p = page;
        await p.goto('http://localhost:8000');
        await p.setViewport({ width: 1800, height: 1800 });
        p.on('dialog', async (dialog) => {
            await dialog.dismiss();
        });
    });
    let p;
    beforeEach(async () => {
        p = page;
    });
    it('Edit code, save it to local storage', async () => {
        await p.evaluate((localStorageKey) => {
            localStorage.clear();
        }, localStorageKey);
        await setDiagrammerCode(p, 'this>is>localstorage>test');
        await writeToElement(p, filenameSelector, localStorageFilename);
        await p.click('form[name="contact"]>button#diagrammer-savefile');
        const storedGraphs = await p.evaluate((localStorageKey) => {
            return localStorage.getItem(localStorageKey);
        }, localStorageKey);
        expect(storedGraphs).toMatch('{"localstorage1":"this>is>localstorage>test"}');
    });
    it('Load code from local storage', async () => {
        await p.evaluate((localStorageKey) => {
            localStorage.setItem('graphs', '{"localstorage1":"this>is>localstorage>test"}');
        }, localStorageKey);
        await setDiagrammerCode(p, '');
        await writeToElement(p, filenameSelector, localStorageFilename);
        await p.click('form[name="contact"]>button#diagrammer-loadfile');
        expect(getDiagrammerCode(p)).resolves.toMatch('this>is>localstorage>test');
        await clearParsingErrors(p);
    });
    it('Import from external storage (mocked)', async () => {
        await p.evaluate((localStorageKey) => {
            localStorage.setItem('graphs', '{"localstorage1":"this>is>localstorage>test"}');
        }, localStorageKey);
        await p.setRequestInterception(true);
        p.on('request', request => {
            if (request.url().includes('/loadExport')) {
                request.respond({
                    contentType: 'application/json',
                    body: JSON.stringify({ joo: 'a>b>c>d\n' })
                });
            }
        });
        await p.click('form[name="contact"]>button#diagrammer-import');
        await sleepABit(100);
        await p.setRequestInterception(false);
        const storedGraphs = await p.evaluate((localStorageKey) => {
            return localStorage.getItem(localStorageKey);
        }, localStorageKey);
        expect(storedGraphs).toMatch('{"localstorage1":"this>is>localstorage>test","joo":"a>b>c>d\\n"}');
        await p.setRequestInterception(false);
    });
    it('Export to external storage (mocked)', async () => {
        await clearParsingErrors(p);
        await p.setRequestInterception(true);
        p.on('request', interceptedRequest => {
            if (interceptedRequest.url().includes('/saveExport')) {
                interceptedRequest.respond({
                    contentType: 'text/plain',
                    body: '',
                    status: 200
                });
            }
        });
        await p.click('form[name="contact"]>button#diagrammer-export');
        await sleepABit(100);
        const error = await getParsingError(p);
        expect(error).toBeFalsy();
        await p.setRequestInterception(false);
    });
});
