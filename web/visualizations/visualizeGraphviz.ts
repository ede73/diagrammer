// @ts-check

import { visualizations } from '../globals.js'
import Viz from '../js/viz.es.js'
import { getHTMLElement } from '../uiComponentAccess.js'
import { removeAllChildNodes } from '../d3support.js'

export async function visualizeCirco(generatedResult: string) { await visualizeGraphviz(generatedResult, 'circo') }
export async function visualizeDot(generatedResult: string) { await visualizeGraphviz(generatedResult, 'dot') }
export async function visualizeFdp(generatedResult: string) { await visualizeGraphviz(generatedResult, 'fdp') }
export async function visualizeNeato(generatedResult: string) { await visualizeGraphviz(generatedResult, 'neato') }
export async function visualizeOsage(generatedResult: string) { await visualizeGraphviz(generatedResult, 'osage') }
export async function visualizeTwopi(generatedResult: string) { await visualizeGraphviz(generatedResult, 'twopi') }

visualizations.set('circo', visualizeCirco)
visualizations.set('dot', visualizeDot)
visualizations.set('fdp', visualizeFdp)
visualizations.set('neato', visualizeNeato)
visualizations.set('osage', visualizeOsage)
visualizations.set('twopi', visualizeTwopi)

async function visualizeGraphviz(generatedResult: string, visualizer: string) {
  // https://github.com/mdaines/viz.js/wiki/Usage
  try {
    const workerURL = 'web/js/full.render.js'
    const viz = new Viz({ workerURL })
    const anchor = 'diagrammer-graph' // viz_container

    // @ts-expect-error TODO: just import conflict node vs. browser vs. VSCode, will resolve eventually
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
        { path: 'icons/wifi.png', width: '64', height: '64' },
        { path: 'icons/modem.png', width: '64', height: '64' },
        { path: 'icons/rack.png', width: '64', height: '64' }]
    })
    const vizContainer = getHTMLElement(anchor)
    removeAllChildNodes(vizContainer)
    vizContainer.appendChild(svg)
  } catch (err) {
    console.error(err)
  }
  // try{
  // const canviz = new Canviz('canviz_container');
  // canviz.load("http://192.168.11.215/~ede/state/post.txt");
  // }catch(err){
  // console.warn(err);
  // }
  // TODO: Use visualizations/generators maps
}
