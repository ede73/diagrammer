function getAndAssertHTMLElement(selector) {
    return document.querySelector(selector);
}
export function getAndAssertHTMLInputElement(selector) {
    return getAndAssertHTMLElement(selector);
}
export async function clearGeneratorResults(page) {
    await page.evaluate(function () {
        document.querySelector('#diagrammer-result').value = '';
    });
}
export async function waitForGeneratorResults(page) {
    await page.waitForSelector('#diagrammer-result:not([value=""])');
}
export async function setDiagrammerCode(page, code) {
    console.log('Testing page URL:', page.url());
    page.on('requestfailed', req => {
        console.error(`[NETWORK ERROR]: Failed to load: ${req.url()} - ${req.failure().errorText}`);
    });
    page.on('pageerror', err => {
        console.error(`[BROWSER CRASH]: ${err.toString()}`);
    });
    page.on('console', msg => {
        console.log(`[Browser]: ${msg.text()}`);
    });
    page.on('console', async (msg) => {
        const args = await Promise.all(msg.args().map(arg => arg.jsonValue()));
        console.log(`[Browser]: ${args.join(' ')}`);
    });
    await page.evaluate(() => {
        const props = Object.getOwnPropertyNames(window);
        console.log('--- AVAILABLE GLOBAL FUNCTIONS ---');
        console.log(JSON.stringify(props.filter(p => typeof window[p] === 'function' && p.toLowerCase().includes('graph'))));
    });
    await page.evaluate((code) => {
        setGraphText(code);
        generatorChanged();
    }, code);
}
export async function getDiagrammerCode(page) {
    return page.evaluate(() => {
        return getGraphText();
    });
}
export async function clearParsingErrors(page) {
    return page.evaluate(() => {
        document.querySelector('div#diagrammer-error').innerHTML = '';
    });
}
export async function getParsingError(page) {
    return page.evaluate(() => {
        return document.querySelector('div#diagrammer-error').innerHTML;
    });
}
export async function selectExampleCode(page, testname) {
    await page.$(`select#diagrammer-example>option[value="${testname}"]`);
    await page.select('#diagrammer-example', testname);
}
export async function selectGeneratorVisualizer(page, genViz) {
    await page.$(`select#diagrammer-generator>option[value="${genViz}"]`);
    await page.select('#diagrammer-generator', genViz);
}
export async function clearGraph(page) {
    await page.evaluate(() => {
        document.querySelector('#diagrammer-graph').innerHTML = '';
    });
}
export async function waitUntilGraphDrawn(page) {
    await page.waitForSelector('#diagrammer-graph:not(:empty)');
}
