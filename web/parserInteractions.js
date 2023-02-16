// @ts-check
import { diagrammerParser } from '../build/diagrammer_parser.js'
import { removeOldVisualizations } from './d3support.js'
import { getError, getGenerator, getHTMLElement, getInputElement, getVisualizer, setError, setGenerator, updateImage } from './uiComponentAccess.js'
import { visualizations } from './globals.js'
import 'jquery'

/**
 * @type {number}
 */
let parsingStarted

/**
 * @type {HTMLInputElement}
 */
const result = getInputElement('result')

function ParseResult (err) {
  alert(err)
}

/**
 *
 * @param {string} str
 * @param {string} hash
 */
// TODO: MOVING TO GraphCanvas
diagrammerParser.yy.parseError = function (str, hash) {
  const pe = `Parsing error:\n${str}\n${hash}`
  console.log('pe')
  setError(pe)
  throw new Error(str)
}

diagrammerParser.yy.parsedGeneratorAndVisualizer = (generator, visualizer, preferParsed) => {
  console.log(`  ..script suggests using generator ${generator} and visualizer ${visualizer} and prefer ${preferParsed}`)
  if (preferParsed && generator) {
    const useVisualizer = visualizer === 'undefined' ? undefined : visualizer
    setGenerator(generator, useVisualizer)
    console.log(`  .. changed generator to ${generator} and visualizer ${useVisualizer}`)
  }
}

/**
 *
 * @param {string} line
 */
// called line by line...
// TODO: MOVING TO GraphCanvas
diagrammerParser.yy.result = function (line) {
  if (parsingStarted === 1) {
    console.log('  ...parsing results start coming in...')
    result.value = ''
  }
  parsingStarted++
  result.value = `${result.value + line}\n`
}

/**
 * @param {string} x
 */
// TODO: MOVING TO GraphCanvas
diagrammerParser.trace = function (x) {
  console.log(`TRACE:${x}`)
}

/**
 * @param {string} diagrammerCode Diagrammer graph to parse using
 * @param {function(string, string):void} successCallback Passing final generator, visualizer
 * @param {function(string, DOMException):void} failureCallback passing error as string, exception as Exception
 */
export function parse (diagrammerCode, successCallback, failureCallback, preferScriptSpecifiedGeneratorAndVisualizer = false) {
  const generator = getGenerator()
  const visualizer = getVisualizer()

  console.log(`parse(${generator} ${visualizer} ${preferScriptSpecifiedGeneratorAndVisualizer})`)
  if (!generator) {
    throw new Error('Generator not defined')
  }
  if (!visualizer) {
    throw new Error('Visualizer not defined')
  }
  // not atomic, but good enuf for UI
  if (parsingStarted >= 1) {
    console.log('We already have a parsing underway, bail out!')
  }
  parsingStarted = 1
  setError('')
  try {
    delete (diagrammerParser.yy.GRAPHCANVAS)
    delete (diagrammerParser.yy.EDGES)
    delete (diagrammerParser.yy.OBJECTS)
    // TODO: MOVING TO GraphCanvas
    diagrammerParser.yy.USE_GENERATOR = generator
    // TODO: MOVING TO GraphCanvas
    diagrammerParser.yy.USE_VISUALIZER = visualizer
    // If true, actually prefer generator/visualizer from loaded script IF specified
    // used while loading new examples...
    diagrammerParser.yy.PREFER_GENERATOR_VISUALIZER_FROM_DIAGRAMMER = preferScriptSpecifiedGeneratorAndVisualizer
    // @ts-ignore
    diagrammerParser.parse(diagrammerCode)
    console.log(`  ..parsed, calling it a success with ${getGenerator()} and ${getVisualizer()}`)
    successCallback(getGenerator(), getVisualizer())
  } catch (ex) {
    console.log(`  ..parsed, and failed ${getError()} and ${ex}`)
    failureCallback(getError(), ex)
  } finally {
    parsingStarted = 0
  }
}

function makeNewImageHolder () {
  removeOldVisualizations()
  const imgdiv = getHTMLElement('graphVisualizationHere')
  const img = document.createElement('img')
  img.align = 'bottom'
  // using % here fails (even if it works directly in HTML)
  img.width = 400
  img.height = 400
  img.id = 'image'
  // auto adjusts
  img.style.height = 'auto'
  img.src = 'web/result.png'
  img.onclick = "javascript:openImage('web/result.png');"
  imgdiv.appendChild(img)
}

export function visualize (visualizer) {
  const statelang = result.value
  if (!visualizer) {
    throw new Error('Visualizer not defined')
  }
  const visualizeUrl = `web/visualize.php?visualizer=${visualizer}`
  // TODO: loads uselessly if web visualizer used
  makeNewImageHolder()
  // eslint-disable-next-line no-undef
  $.ajax({
    type: 'POST',
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
      updateImage(msg)
    },
    error: function (err) {
      alert(`ERROR: ${JSON.stringify(err)}`)
      if (err.status === 200) {
        ParseResult(err)
      } else {
        alert(`Error:${err.responseText}  Status: ${err.status}`)
      }
    }
  })
  /*
        <img align="bottom" id="image" width="30%" src="web/result.png"
            onclick="javascript:openImage('web/result.png');" />
    */

  if (visualizations.has(visualizer)) {
    // this is web only visualization
    console.log(`Visualize using ${visualizer}`)
    visualizations.get(visualizer)(result.value)
    console.log(`Finished visualizing ${visualizer}`)
  } else if (visualizer === 'dot') {
    // hack to get Viz display graphviz as comparison..
    try {
      getHTMLElement('svg').innerHTML = Viz(statelang, 'svg')
    } catch (err) {
      console.log(err)
    }
    // try{
    // const canviz = new Canviz('graph_container');
    // canviz.load("http://192.168.11.215/~ede/state/post.txt");
    // }catch(err){
    // console.log(err);
    // }
    // TODO: Use visualizations/generators maps
  }
}
