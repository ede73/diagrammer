export async function dumpWholePage(page) {
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    return bodyHTML;
}
export async function dumpWholePage2(page) {
    const data = await page.evaluate(() => Array.from(document.querySelectorAll('*'))
        .map(elem => elem.tagName));
    return data;
}
async function assertElementExists(page, elementId) {
    if (await page.$(elementId) === null) {
        throw new Error(`Element ${elementId} does not exist`);
    }
}
export async function sleepABit(milliSeconds) {
    await new Promise(function (resolve) { setTimeout(resolve, milliSeconds); });
}
export async function writeToElement(page, elementId, text) {
    await assertElementExists(page, elementId);
    await page.$eval(elementId, (el, text) => {
        el.value = text;
    }, text);
}
function consoleLogWithTime(msg) {
    console.log(`${new Date().toISOString()}: ${msg} `);
}
export async function captureBrowserLogs(page) {
    page
        .on('console', message => {
        consoleLogWithTime(`${message.type().substr(0, 3).toUpperCase()} ${message.text()} `);
    })
        .on('pageerror', ({ message }) => { consoleLogWithTime(message); })
        .on('response', (response) => {
        consoleLogWithTime(`${response.status()} ${response.url()} `);
    })
        .on('requestfailed', (request) => {
        var _a;
        consoleLogWithTime(`${(_a = request.failure()) === null || _a === void 0 ? void 0 : _a.errorText} ${request.url()}`);
    });
}
