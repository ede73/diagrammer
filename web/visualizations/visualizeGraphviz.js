import Viz from '../js/viz.es.js';
import { getHTMLElement } from '../uiComponentAccess.js';
import { removeAllChildNodes } from '../d3support.js';
export async function visualizeGraphviz(generatedResult, visualizer) {
    try {
        const workerURL = 'web/js/full.render.js';
        const viz = new Viz({ workerURL });
        const anchor = 'diagrammer-graph';
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
                { path: 'icons/rack.png', width: '64', height: '64' }
            ]
        });
        // Make Graphviz default background transparent to blend seamlessly with canvas
        const bg = svg.querySelector('g.graph > polygon:first-of-type');
        if (bg) {
            const fill = bg.getAttribute('fill');
            if (fill === '#ffffff' || fill === 'white' || fill === '#fff') {
                bg.setAttribute('fill', 'transparent');
                bg.setAttribute('stroke', 'transparent');
            }
        }
        const vizContainer = getHTMLElement(anchor);
        removeAllChildNodes(vizContainer);
        vizContainer.appendChild(svg);
    }
    catch (err) {
        console.error(err);
    }
}
