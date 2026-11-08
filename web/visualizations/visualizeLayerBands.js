import go from 'gojs';
import { removeOldVisualizations } from '../d3support.js';
export async function visualizeLayerBands(generatorResult) {
    const jsonData = JSON.parse(generatorResult);
    const HORIZONTAL = true;
    class BandedTreeLayout extends go.TreeLayout {
        constructor() {
            super();
            this.layerStyle = go.TreeLayout.LayerUniform;
        }
        commitLayers(layerRects, offset) {
            const bands = this.diagram.findPartForKey('_BANDS');
            if (!bands) {
                return;
            }
            const model = this.diagram.model;
            bands.location = this.arrangementOrigin.copy().add(offset);
            for (let it = bands.elements; it.next();) {
                const idx = it.key;
                const elt = it.value;
                elt.visible = idx < layerRects.length;
            }
            const arr = bands.data.itemArray;
            for (let i = 0; i < layerRects.length; i++) {
                const itemdata = arr[i];
                if (itemdata) {
                    model.setDataProperty(itemdata, 'bounds', layerRects[i]);
                }
            }
        }
    }
    ;
    function init() {
        const $ = go.GraphObject.make;
        const svgimg = removeOldVisualizations('LAYEREDBANDNODE');
        const myDiagram = $(go.Diagram, 'LAYEREDBANDNODE', {
            layout: $(BandedTreeLayout, {
                angle: HORIZONTAL ? 0 : 90,
                arrangement: HORIZONTAL ? go.TreeLayout.ArrangementVertical : go.TreeLayout.ArrangementHorizontal
            }),
            'undoManager.isEnabled': true
        });
        myDiagram.nodeTemplate =
            $(go.Node, go.Panel.Auto, $(go.Shape, 'Rectangle', { fill: 'white' }), $(go.TextBlock, { margin: 5 }, new go.Binding('text', 'key')));
        myDiagram.nodeTemplateMap.add('Bands', $(go.Part, 'Position', new go.Binding('itemArray'), {
            isLayoutPositioned: false,
            locationSpot: new go.Spot(0, 0, HORIZONTAL ? 0 : 16, HORIZONTAL ? 16 : 0),
            layerName: 'Background',
            pickable: false,
            selectable: false,
            itemTemplate: $(go.Panel, HORIZONTAL ? 'Vertical' : 'Horizontal', new go.Binding('position', 'bounds', function (b) { return b.position; }), $(go.TextBlock, {
                angle: HORIZONTAL ? 0 : 270,
                textAlign: 'center',
                wrap: go.TextBlock.None,
                font: 'bold 11pt sans-serif',
                background: $(go.Brush, 'Linear', { 0: 'aqua', 1: go.Brush.darken('aqua') })
            }, new go.Binding('text'), new go.Binding('width', 'bounds', function (r) { return HORIZONTAL ? r.width : r.height; })), $(go.Shape, { stroke: null, strokeWidth: 0 }, new go.Binding('desiredSize', 'bounds', function (r) { return r.size; }), new go.Binding('fill', 'itemIndex', function (i) { return i % 2 === 0 ? 'whitesmoke' : go.Brush.darken('whitesmoke'); }).ofObject()))
        }));
        myDiagram.linkTemplate =
            $(go.Link, $(go.Shape));
        const nodearray = jsonData;
        myDiagram.model = new go.TreeModel(nodearray);
        const x = 0;
        const y = 0;
        const printSize = new go.Size(300, 300);
        const svg = myDiagram.makeSvg({ scale: 1.0, position: new go.Point(x, y), size: printSize });
        svgimg.appendChild(svg);
    }
    init();
}
