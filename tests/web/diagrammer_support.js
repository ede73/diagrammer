import { setGraphText, generatorChanged, getGraphText } from '../../web/editorInteractions.js';
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
