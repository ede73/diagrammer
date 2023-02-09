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
 * @param {string} data Diagrammer graph to parse using 
 * @param {string} generator this generator
 * @param {string} visualizer and possibly this visualizer
 */
function parse(data, generator, visualizer, reloadImg) {
    if (!generator) {
        throw new Error("Generator not defined");
    }
    if (!visualizer) {
        throw new Error("Visualizer not defined");
    }
    if (!reloadImg) {
        throw new Error("Image reloader not defined");
    }
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
    const vdelay = 1000;
    vtimer = window.setTimeout(function () {
        vtimer = null;
        console.log("Visualize now using " + diagrammer_parser.yy.USE_VISUALIZER);
        visualize(diagrammer_parser.yy.USE_VISUALIZER, reloadImg);
    }, vdelay);
}

function visualize(visualizer, reloadImg) {
    const statelang = document.getElementById("result").value;
    if (!visualizer) {
        throw new Error("Visualizer not defined");
    }
    const visualizeUrl = "web/visualize.php?visualizer=" + visualizer;
    $.ajax({
        type: "POST",
        async: true,
        cache: false,
        url: visualizeUrl,
        data: statelang,
        // data: {body:statelang},
        // contentType: "application/json; charset=utf-8",
        // dataType: "json",
        success: function (msg) {
            // UseReturnedData(msg.d);
            // alert(msg);
            document.getElementById("image").setAttribute("src", msg);
            reloadImg('image');
        },
        error: function (err) {
            alert("ERROR: " + JSON.stringify(err));
            if (err.status == 200) {
                ParseResult(err);
            } else {
                alert('Error:' + err.responseText + '  Status: ' + err.status);
            }
        }
    });
    if (visualizer == "dot") {
        try {
            document.getElementById('svg').innerHTML = Viz(statelang, 'svg');
        } catch (err) {
            console.log(err);
        }
        // try{
        // const canviz = new Canviz('graph_container');
        // canviz.load("http://192.168.11.215/~ede/state/post.txt");
        // }catch(err){
        // console.log(err);
        // }
    } else if (visualizer == "radialdendrogram") {
        console.log("Visualize using visualizeRadialDendrogram");
        visualizeRadialDendrogram(JSON.parse(result.value));
    } else if (visualizer == "circlepacked") {
        console.log("Visualize using visualizeCirclePacked");
        alert("TBD");
        visualizeCirclePacked(JSON.parse(result.value));
    } else if (visualizer == "reingoldtilford") {
        console.log("Visualize using visualizeReingoldTilford");
        visualizeReingoldTilford(JSON.parse(result.value));
    } else if (visualizer == "parsetree") {
        console.log("Visualize using visualizeParseTree");
        visualizeParseTree(JSON.parse(result.value));
    } else if (visualizer == "layerbands") {
        console.log("Visualize using visualizeLayerBands");
        visualizeLayerBands(JSON.parse(result.value));
    } else if (visualizer == "umlclass") {
        console.log("Visualize using visualizeUmlClass");
        visualizeUmlClass(JSON.parse(result.value));
    } else {
        console.log("Unkknown WEB UI visualizer " + visualizer);
        document.getElementById('svg').innerHTML = "only for dotty";
    }
}