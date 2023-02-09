/**
 * @type {boolean}
 */
var parsingStarted;

/**
 * @type {HTMLElement}
 */
var result;

/**
 * 
 * @param {string} str 
 * @param {string} hash 
 */
// TODO: MOVING TO GraphCanvas
parser.yy.parseError = function (str, hash) {
    const pe = "Parsing error:\n" + str + "\n" + hash;
    console.log("pe");
    document.getElementById("error").innerText = pe;
    cancelVTimer();
    throw new Error(str);
};

/**
 * 
 * @param {string} line 
 */
// called line by line...
// TODO: MOVING TO GraphCanvas
parser.yy.result = function (line) {
    if (parsingStarted) {
        console.log("Parsing results coming in for " + parser.yy.USE_GENERATOR + " / " + parser.yy.VISUALIZER);
        parsingStarted = false;
        result.value = "";
    }
    result.value = result.value + line + "\n";
}

/**
 * @param {string} x 
 */
// TODO: MOVING TO GraphCanvas
parser.trace = function (x) {
    console.log("TRACE:" + x);
}

/**
 * 
 * @param {string} generator 
 * @param {string} visualizer 
 */
function parse(generator, visualizer) {
    if (!generator) {
        throw new Error("Generator not defined");
    }
    if (!visualizer) {
        throw new Error("Visualizer not defined");
    }
    const data = getText() + "\n";
    console.log("parse generator=" + generator + ", visualizer=" + visualizer);
    document.getElementById("error").innerText = "";
    parsingStarted = true;
    delete (parser.yy.GRAPHVANVAS);
    delete (parser.yy.EDGES);
    delete (parser.yy.OBJECTS);
    // TODO: MOVING TO GraphCanvas
    parser.yy.USE_GENERATOR = generator;
    // TODO: MOVING TO GraphCanvas
    parser.yy.USE_VISUALIZER = visualizer;
    console.log("Parse, set generator to " + parser.yy.USE_GENERATOR + " visualizer to " + parser.yy.USE_VISUALIZER);
    parser.parse(data);
    /*
     * const tc=textArea.textContent; parser.parse(tc+"\n"); highlight(tc);
     */
    cancelVTimer();
    vtimer = window.setTimeout(function () {
        vtimer = null;
        console.log("Visualize now using " + parser.yy.USE_VISUALIZER);
        visualize(parser.yy.USE_VISUALIZER);
    }, vdelay);
}
