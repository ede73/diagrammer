import { Page, Browser } from 'puppeteer';

// npm install @types/jest --save-dev 
// fixed it
// puppeteer import above works, but it give
// puppeteer.page and puppeteer.browser
// https://pptr.dev/api/puppeteer.page
// https://pptr.dev/api/puppeteer.browser

/**
 * Clear the generator results (in order to be able to wait for the results)
 * @param {Page} page 
 * @return {Promise<void>}
 */
export async function clearGeneratorResults(page) {
    await page.evaluate(function () {
        document.querySelector('#result').value = '';
    });
}

/**
 * Return parsed generated result
 * @param {Page} page 
 * @return {Promise<string>}
 */
export async function getGeneratorResult(page) {
    await page.evaluate(function () {
        return document.querySelector('#result').value;
    });
}

/**
 * Wait until diagrammer parser(generator) has completed parsing/generation job
 * @param {Page} page 
 * @return {Promise<void>}
 */
export async function waitForGeneratorResults(page) {
    await page.waitForSelector('#result:not([value=""])');
}

/**
 * Set diagrammer code and launch the parser
 * @param {Page} page 
 * @param {string} code 
 * @return {Promise<void>}
 */
export async function setDiagrammerCode(page, code) {
    await page.evaluate((code) => {
        setGraphText(code);
        generatorChanged();
    }, code);
}

/**
 * Return what ever is in the diagrammer text editor
 * @param {Page} page 
 * @return {Promise<string}>
 */
export async function getDiagrammerCode(page) {
    return await page.evaluate(() => {
        return getGraphText();
    });
}

/**
 * Clear parsing errors
 * @param {Page} page 
 * @return {Promise<void}>
 */
export async function clearParsingErrors(page) {
    return await page.evaluate(() => {
        return document.querySelector('div#error').value = '';
    });
}

/**
 * Return what ever parsing error
 * @param {Page} page 
 * @return {Promise<string}>
 */
export async function getParsingError(page) {
    return await page.evaluate(() => {
        return document.querySelector('div#error').innerHTML;
    });
}

/**
 * Select a test input from dropdown, initiate parsing
 * @param {Page} page 
 * @param {string} testname E.g. test_inputs/dendrogram.txt - antyhing that's coded to the dropdown
 * @return {Promise<void>}
 */
export async function selectExampleCode(page, testname) {
    // assert such a test exists in index.html example dropdown, will throw if doesn't
    await page.$(`select#example>option[value="${testname}"]`);
    await page.select('#example', testname);
}

/**
 * Wait until a NEW graph has been drawn
 * @param {Page} page 
 * @return {Promise<void>}
 */
export async function waitUntilGraphDrawn(page) {
    // Uhh...UI side is so slow to pick up changes..
    // around 5s image is still old, after 6 we see the radial dendrogram!
    await sleepABit(6000);
}