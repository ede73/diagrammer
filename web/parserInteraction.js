
// TODO: MOVING TO GraphMeta
parser.yy.parseError = function (str, hash) {
    const pe = "Parsing error:\n" + str + "\n" + hash;
    console.log("pe");
    document.getElementById("error").innerText = pe;
    cancelVTimer();
    throw new Error(str);
};
// called line by line...
// TODO: MOVING TO GraphMeta
parser.yy.result = function (line) {
    if (parsingStarted) {
        console.log("Parsing results coming in for " + parser.yy.USE_GENERATOR + " / " + parser.yy.VISUALIZER);
        parsingStarted = false;
        result.value = "";
    }
    result.value = result.value + line + "\n";
}

// TODO: MOVING TO GraphMeta
parser.trace = function (x) {
    console.log("TRACE:" + x);
}

function parse(generator, visualizer) {
    const data = getText() + "\n";
    console.log("parse generator=" + generator + ", visualizer=" + visualizer);
    document.getElementById("error").innerText = "";
    parsingStarted = true;
    delete (parser.yy.GRAPHROOT);
    delete (parser.yy.EDGES);
    delete (parser.yy.OBJECTS);
    // TODO: MOVING TO GraphMeta
    parser.yy.USE_GENERATOR = generator;
    // TODO: MOVING TO GraphMeta
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
