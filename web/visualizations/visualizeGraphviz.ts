// @ts-check

import { visualizations } from '../globals.js'
import Viz from '../../js/viz.es.js'
import { getHTMLElement } from '../uiComponentAccess.js'
import { removeAllChildNodes } from '../d3support.js'

visualizations.set('circo', visualizeCirco)
visualizations.set('dot', visualizeCirco)
visualizations.set('fdp', visualizeFdp)
visualizations.set('neato', visualizeNeato)
visualizations.set('osage', visualizeOsage)
visualizations.set('twopi', visualizeTwopi)

export function visualizeCirco(generatorResult: string) { visualizeGraphviz(generatorResult, 'circo') }
export function visualizeDot(generatorResult: string) { visualizeGraphviz(generatorResult, 'dot') }
export function visualizeFdp(generatorResult: string) { visualizeGraphviz(generatorResult, 'fdp') }
export function visualizeNeato(generatorResult: string) { visualizeGraphviz(generatorResult, 'neato') }
export function visualizeOsage(generatorResult: string) { visualizeGraphviz(generatorResult, 'osage') }
export function visualizeTwopi(generatorResult: string) { visualizeGraphviz(generatorResult, 'twopi') }

async function visualizeGraphviz(generatorResult: string, visualizer: string) {
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
