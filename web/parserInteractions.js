// ignore for now ts-check
import { diagrammer_parser } from '../build/diagrammer_parser.js';
import { getHTMLElement, getInputElement, setError, setGenerator, updateImage } from './uiComponentAccess.js';
import { visualizeCirclePacked } from './visualizations/visualizeCirclePacked.js';
import { visualizeLayerBands } from './visualizations/visualizeLayerBands.js';
import { visualizeParseTree } from './visualizations/visualizeParseTree.js';
import { visualizeRadialDendrogram } from './visualizations/visualizeRadialDendrogram.js';
import { visualizeReingoldTilford } from './visualizations/visualizeReingoldTilford.js';
import { visualizeUmlClass } from './visualizations/visualizeUmlClass.js';
import { visualizeSankey } from './visualizations/visualizeSankey.js';

/**
 * @type {boolean}
 */
var parsingStarted;

/**
 * @type {HTMLInputElement}
 */
var result = getInputElement("result");

function ParseResult(err) {
    alert(err);
}

/**
 * 
 * @param {string} str 
 * @param {string} hash 
 */
// TODO: MOVING TO GraphCanvas
diagrammer_parser.yy.parseError = function (str, hash) {
    const pe = "Parsing error:\n" + str + "\n" + hash;
    console.log("pe");
    setError(pe);
    //cancelVTimer();
    throw new Error(str);
};

diagrammer_parser.yy.parsedGeneratorAndVisualizer = (generator, visualizer, preferParsed) => {
    console.log(`  ..script suggests using generator ${generator} and visualizer ${visualizer} and prefer ${preferParsed}`);
    if (preferParsed && generator) {
        setGenerator(generator, visualizer == "undefined" ? undefined : visualizer);
    }
};

/**
 * 
 * @param {string} line 
 */
// called line by line...
// TODO: MOVING TO GraphCanvas
diagrammer_parser.yy.result = function (line) {
    if (parsingStarted) {
        console.log("  ...parsing results start coming in...");
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
export function parse(data, generator, visualizer, preferScriptSpecifiedGeneratorAndVisualizer = false) {
    console.log(`parse ${generator} ${visualizer} ${preferScriptSpecifiedGeneratorAndVisualizer}`);
    if (!generator) {
        throw new Error("Generator not defined");
    }
    if (!visualizer) {
        throw new Error("Visualizer not defined");
    }
    console.log("parse generator=" + generator + ", visualizer=" + visualizer);
    setError("");
    parsingStarted = true;
    delete (diagrammer_parser.yy.GRAPHVANVAS);
    delete (diagrammer_parser.yy.EDGES);
    delete (diagrammer_parser.yy.OBJECTS);
    // TODO: MOVING TO GraphCanvas
    diagrammer_parser.yy.USE_GENERATOR = generator;
    // TODO: MOVING TO GraphCanvas
    diagrammer_parser.yy.USE_VISUALIZER = visualizer;
    // If true, actually prefer generator/visualizer from loaded script IF specified
    // used while loading new examples...  
    diagrammer_parser.yy.PREFER_GENERATOR_VISUALIZER_FROM_DIAGRAMMER = preferScriptSpecifiedGeneratorAndVisualizer;
    console.log("Parse, set generator to " + diagrammer_parser.yy.USE_GENERATOR + " visualizer to " + diagrammer_parser.yy.USE_VISUALIZER);
    diagrammer_parser.parse(data);
    console.log('  ..parsed');
    /*
     * const tc=textArea.textContent; diagrammer_parser.parse(tc+"\n"); highlight(tc);
     */
    //cancelVTimer();
    const vdelay = 1000;
    const vtimer = window.setTimeout(function () {
        //vtimer = null;
        console.log("Visualize now using " + diagrammer_parser.yy.USE_VISUALIZER);
        visualize(diagrammer_parser.yy.USE_VISUALIZER);
    }, vdelay);
}

export function visualize(visualizer) {
    const statelang = result.value;
    if (!visualizer) {
        throw new Error("Visualizer not defined");
    }
    const visualizeUrl = "web/visualize.php?visualizer=" + visualizer;
    // @ts-ignore
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
            updateImage(msg);
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
            getHTMLElement('svg').innerHTML = Viz(statelang, 'svg');
        } catch (err) {
            console.log(err);
        }
        // try{
        // const canviz = new Canviz('graph_container');
        // canviz.load("http://192.168.11.215/~ede/state/post.txt");
        // }catch(err){
        // console.log(err);
        // }
        // TODO: Use visualizations/generators maps
    } else if (visualizer == "radialdendrogram") {
        visualizeRadialDendrogram(JSON.parse(result.value));
    } else if (visualizer == "circlepacked") {
        alert("TBD");
        visualizeCirclePacked(JSON.parse(result.value));
    } else if (visualizer == "reingoldtilford") {
        visualizeReingoldTilford(JSON.parse(result.value));
    } else if (visualizer == "parsetree") {
        visualizeParseTree(JSON.parse(result.value));
    } else if (visualizer == "layerbands") {
        visualizeLayerBands(JSON.parse(result.value));
    } else if (visualizer == "umlclass") {
        visualizeUmlClass(JSON.parse(result.value));
    } else if (visualizer == "sankey") {
        visualizeSankey(JSON.parse(result.value));
    } else {
        console.log("Unkknown WEB UI visualizer " + visualizer);
        getHTMLElement('svg').innerHTML = "only for dotty";
    }
}