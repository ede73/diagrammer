// @ts-check
import { removeAllChildNodes, removeOldVisualizations } from './d3support.js'
import { getHTMLElement, getInputElement, openImage } from './uiComponentAccess.js'
import { visualizations } from './globals.js'
import { makeHTTPPost } from './ajax.js'
import Viz from '../js/viz.es.js'
import { mscgen } from '../generators/mscgen.js'

function _makeNewImageHolder(pngBase64: string) {
  const imgdiv = getHTMLElement('diagrammer-graph')
  const img = document.createElement('img')
  img.align = 'bottom'
  // using % here fails (even if it works directly in HTML)
  img.width = 400
  img.height = 400
  img.id = 'image'
  // auto adjusts
  img.style.height = 'auto'
  img.src = `data:image/png;base64,${pngBase64}`
  img.onclick = () => openImage(`${pngBase64}`)
  imgdiv.appendChild(img)
}

function beautify(generatedCode: string) {
  let data
  try {
    data = JSON.parse(generatedCode)
  } catch (ex) {
    // too aggressive for the use... many generated code not actually JSON
    console.log('Failed parsing generated code, perhaps not JSON(digraph etc)?')
    return
  }
  // Get DOM-element for inserting json-tree
  const wrapper = document.getElementById('diagrammer-beautified')
  // @ts-ignore
  // eslint-disable-next-line no-undef, no-unused-vars
  const tree = jsonTree.create(data, wrapper)
}

export function clearBeautified() {
  const result = getInputElement('diagrammer-beautified')
  removeAllChildNodes(result)
}

// TODO: move to editor (or elsewhere, but this really isn't parser thingy anymore)
export async function visualize(visualizer: string) {
  const result = getInputElement('diagrammer-result')
  const generatedResult = result.value

  beautify(generatedResult)

  if (!visualizer) {
    throw new Error('Visualizer not defined')
  }
  removeOldVisualizations()

  // TODO: let generator decide visualizer
  if (visualizer === 'ast_record') {
    visualizer = 'dot'
  }

  const canUseViz = ['circo', 'dot', 'fdp', 'neato', 'osage', 'twopi'].includes(visualizer)

  // if (visualizer === 'mscgen') {
  //   mscgen(generatedResult);
  //   return;
  // }
  if (visualizations.has(visualizer)) {
    // this is web only visualization
    console.log(`Visualize using ${visualizer}`)
    visualizations.get(visualizer)(generatedResult)
    console.log(`Finished visualizing ${visualizer}`)
  } else if (!canUseViz) {
    // backend visualizer (unless if we could use Viz)
    const visualizeUrl = `web/visualize.php?visualizer=${visualizer}`
    makeHTTPPost(visualizeUrl, generatedResult,
      (pngBase64) => {
        _makeNewImageHolder(pngBase64)
      },
      (statusCode, statusText, responseText) => {
        alert(`Visualize failed, error: ${responseText} status: ${statusText}`)
      })
  } else if (canUseViz) {
    // https://github.com/mdaines/viz.js/wiki/Usage
    try {
      const workerURL = 'js/full.render.js'
      const viz = new Viz({ workerURL })
      const anchor = 'diagrammer-graph' // viz_container

      // @ts-ignore
      const svg = await viz.renderSVGElement(generatedResult, {
        engine: visualizer,
        images: [
          { path: 'icons/actor1.png', width: '64', height: '64' },
          { path: 'icons/actor2.png', width: '64', height: '64' },
          { path: 'icons/actor3.png', width: '64', height: '64' },
          { path: 'icons/barcode.png', width: '64', height: '64' },
          { path: 'icons/basestation.png', width: '64', height: '64' },
          { path: 'icons/battery.png', width: '64', height: '64' },
          { path: 'icons/camera.png', width: '64', height: '64' },
          { path: 'icons/cpu.png', width: '64', height: '64' },
          { path: 'icons/documents.png', width: '64', height: '64' },
          { path: 'icons/harddisk.png', width: '64', height: '64' },
          { path: 'icons/keyboard.png', width: '64', height: '64' },
          { path: 'icons/laptop.png', width: '64', height: '64' },
          { path: 'icons/laser.png', width: '64', height: '64' },
          { path: 'icons/monitor.png', width: '64', height: '64' },
          { path: 'icons/mouse.png', width: '64', height: '64' },
          { path: 'icons/phone.png', width: '64', height: '64' },
          { path: 'icons/printer.png', width: '64', height: '64' },
          { path: 'icons/ram.png', width: '64', height: '64' },
          { path: 'icons/satellite.png', width: '64', height: '64' },
          { path: 'icons/scanner.png', width: '64', height: '64' },
          { path: 'icons/sim.png', width: '64', height: '64' },
          { path: 'icons/timer.png', width: '64', height: '64' },
          { path: 'icons/usbmemory.png', width: '64', height: '64' },
          { path: 'icons/wifi.png', width: '64', height: '64' }]
      })
      const vizContainer = getHTMLElement(anchor)
      removeAllChildNodes(vizContainer)
      vizContainer.appendChild(svg)
    } catch (err) {
      console.log('o...o')
      console.error(err)
    }
    // try{
    // const canviz = new Canviz('canviz_container');
    // canviz.load("http://192.168.11.215/~ede/state/post.txt");
    // }catch(err){
    // console.log(err);
    // }
    // TODO: Use visualizations/generators maps
  }
}
