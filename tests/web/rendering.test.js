import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { singleElementScreenSnapshot } from './snapshot_single_element.js';
import { clearGeneratorResults, clearGraph, clearParsingErrors, getDiagrammerCode, getParsingError, selectExampleCode, selectGeneratorVisualizer, setDiagrammerCode, waitForGeneratorResults, waitUntilGraphDrawn } from './diagrammer_support.js';
import { describe, expect, it } from '@jest/globals';
import 'jest-environment-puppeteer';
export function setConfig(filename, threshold = 0.0001) {
    return {
        failureThreshold: threshold,
        failureThresholdType: 'percent',
        customSnapshotsDir: new URL('snapshots/', import.meta.url).pathname,
        customSnapshotIdentifier: filename,
        noColors: true
    };
}
const getPage = () => { return page; };
describe('Diagrammer', () => {
    beforeAll(async () => {
        var _a;
        await page.goto(`http://localhost:${(_a = process.env.MINISERVER_TEST_PORT) !== null && _a !== void 0 ? _a : ''}/?do_not_load_initial_example=1`, {
            waitUntil: 'load'
        });
        await page.setViewport({ width: 1024, height: 800 });
    });
    it('asserts against diagrammer main page regressions', async () => {
        expect.extend({
            toMatchImageSnapshot
        });
        const screenshot = await page.screenshot({ type: 'png', fullPage: true });
        const image = Buffer.from(screenshot);
        expect(image).toMatchImageSnapshot(setConfig('main_screen_just_loaded', 0.005));
    });
    it('ensures that writing diagrammer code is shown in ace editor', async () => {
        await clearGeneratorResults(getPage());
        await setDiagrammerCode(getPage(), 'a>b>c');
        await waitForGeneratorResults(getPage());
        const graphText = await getDiagrammerCode(getPage());
        await expect(graphText).toMatch('a>b>c');
    });
    it('ensures that parsing error is displayed correctly', async () => {
        await clearGeneratorResults(getPage());
        await clearParsingErrors(getPage());
        try {
            await setDiagrammerCode(getPage(), 'a>');
            expect(false);
        }
        catch (_a) {
        }
        const graphText = await getDiagrammerCode(getPage());
        await expect(graphText).toMatch('a>');
        const errorText = await getParsingError(getPage());
        await expect(errorText).toMatch(/.*Parse error on line 1/);
    });
    it('selects dendrogram example, verifies parsing succeeds and correct graph is visualized', async () => {
        await clearGeneratorResults(getPage());
        await clearGraph(getPage());
        await selectExampleCode(getPage(), 'test_inputs/dendrogram.txt');
        await waitForGeneratorResults(getPage());
        const graphText = await getDiagrammerCode(getPage());
        await expect(graphText).toMatch(/^visualizer reingoldtilford/);
        await waitUntilGraphDrawn(getPage());
    }, 200);
    async function testDynamicRendering(page, example, overrideGeneratorVisualizer) {
        await clearGeneratorResults(page);
        await clearGraph(page);
        await selectExampleCode(page, example);
        await waitForGeneratorResults(page);
        if (overrideGeneratorVisualizer) {
            await waitUntilGraphDrawn(page);
            await clearGeneratorResults(page);
            await selectGeneratorVisualizer(page, overrideGeneratorVisualizer);
            await waitForGeneratorResults(page);
        }
        await waitUntilGraphDrawn(page);
        const selector = (await page.$('#diagrammer-graph>svg') != null) ? '#diagrammer-graph>svg' : '#diagrammer-graph>div>svg';
        const elementHandle = await page.$(selector);
        if (!elementHandle) {
            throw new Error(`Could not find element ${selector}`);
        }
        const bbox = await elementHandle.boundingBox();
        const matches = example.match(/.+\/([^.]+)/);
        if (!matches) {
            throw new Error('Could not read example');
        }
        const filename = matches[1] + (overrideGeneratorVisualizer ? '_' + overrideGeneratorVisualizer.replace(':', '_') : '');
        const snapshotConfig = setConfig(filename, 1);
        const svg = await page.evaluate((selector) => { var _a; return (_a = document.querySelector(selector)) === null || _a === void 0 ? void 0 : _a.outerHTML; }, selector);
        if (!svg) {
            throw Error('Could not get SVG code');
        }
        const buffer = await singleElementScreenSnapshot(browser, svg, bbox === null || bbox === void 0 ? void 0 : bbox.width, bbox === null || bbox === void 0 ? void 0 : bbox.height);
        expect.extend({
            toMatchImageSnapshot
        });
        expect(buffer).toMatchImageSnapshot(snapshotConfig);
    }
    ;
    it('asserts reingold-tilford(dendrogram)(d3.js) visualization works', async () => {
        await testDynamicRendering(getPage(), 'test_inputs/dendrogram.txt');
    });
    it('asserts radial dendrogram(d3.js) visualization works', async () => {
        await testDynamicRendering(getPage(), 'test_inputs/dendrogram.txt', 'radialdendrogram');
    });
    it('asserts sankey(d3.js) visualization works', async () => {
        await testDynamicRendering(getPage(), 'test_inputs/sankey.txt');
    });
    it('asserts circlepackage(d3.js) visualization works', async () => {
    });
    it('asserts umlclass2(GoJS) visualization works', async () => {
        await testDynamicRendering(getPage(), 'test_inputs/umlclass2.txt');
    });
    it('asserts layerbands(GoJS) visualization works', async () => {
        await testDynamicRendering(getPage(), 'test_inputs/layerbands.txt');
    });
    it('asserts parsetree(GoJS) visualization works', async () => {
        await testDynamicRendering(getPage(), 'test_inputs/parsetree.txt');
    });
    it('asserts in-browser mermaid flowchart renders valid SVG', async () => {
        await clearGeneratorResults(getPage());
        await clearGraph(getPage());
        await setDiagrammerCode(getPage(), 'a>b>c');
        await selectGeneratorVisualizer(getPage(), 'mermaid');
        await waitForGeneratorResults(getPage());
        await waitUntilGraphDrawn(getPage());
        const svgExists = await getPage().evaluate(() => {
            const svg = document.querySelector('#diagrammer-graph svg');
            return svg !== null && svg.children.length > 0;
        });
        expect(svgExists).toBe(true);
    });
});
