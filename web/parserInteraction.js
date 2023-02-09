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
diagrammer_parser.yy.parseError = function (str, hash) {
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
diagrammer_parser.yy.result = function (line) {
    if (parsingStarted) {
        console.log("Parsing results coming in for " + diagrammer_parser.yy.USE_GENERATOR + " / " + diagrammer_parser.yy.VISUALIZER);
        parsingStarted = false;
        result.value = "";
    }
    result.value = result.value + line + "\n";
}

/**
 * @param {string} x 
 */
// TODO: MOVING TO GraphCanvas
diagrammer_parser.trace = function (x) {
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
    delete (diagrammer_parser.yy.GRAPHVANVAS);
    delete (diagrammer_parser.yy.EDGES);
    delete (diagrammer_parser.yy.OBJECTS);
    // TODO: MOVING TO GraphCanvas
    diagrammer_parser.yy.USE_GENERATOR = generator;
    // TODO: MOVING TO GraphCanvas
    diagrammer_parser.yy.USE_VISUALIZER = visualizer;
    console.log("Parse, set generator to " + diagrammer_parser.yy.USE_GENERATOR + " visualizer to " + diagrammer_parser.yy.USE_VISUALIZER);
    diagrammer_parser.parse(data);
    /*
     * const tc=textArea.textContent; diagrammer_parser.parse(tc+"\n"); highlight(tc);
     */
    cancelVTimer();
    vtimer = window.setTimeout(function () {
        vtimer = null;
        console.log("Visualize now using " + diagrammer_parser.yy.USE_VISUALIZER);
        visualize(diagrammer_parser.yy.USE_VISUALIZER);
    }, vdelay);
}
