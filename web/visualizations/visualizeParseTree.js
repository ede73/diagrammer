import go from 'gojs';
import { removeOldVisualizations } from '../d3support.js';
export async function visualizeParseTree(generatorResult) {
    const jsonData = JSON.parse(generatorResult);
    const $ = go.GraphObject.make;
    const svgimg = removeOldVisualizations('PARSETREENODE');
    const myDiagram = $(go.Diagram, 'PARSETREENODE', {
        allowCopy: false,
        allowDelete: false,
        allowMove: false,
        initialAutoScale: go.Diagram.Uniform,
        layout: $(FlatTreeLayout, {
            angle: 90,
            compaction: go.TreeLayout.CompactionNone
        }),
        'undoManager.isEnabled': true
    });
    myDiagram.nodeTemplate =
        $(go.Node, 'Vertical', { selectionObjectName: 'BODY' }, $(go.Panel, 'Auto', { name: 'BODY' }, $(go.Shape, 'RoundedRectangle', new go.Binding('fill'), new go.Binding('stroke')), $(go.TextBlock, { font: 'bold 12pt Arial, sans-serif', margin: new go.Margin(4, 2, 2, 2) }, new go.Binding('text'))), $(go.Panel, { height: 17 }, $('TreeExpanderButton')));
    myDiagram.linkTemplate =
        $(go.Link, $(go.Shape, { strokeWidth: 1.5 }));
    const nodeDataArray = jsonData;
    myDiagram.model =
        $(go.TreeModel, { nodeDataArray });
    const x = 0;
    const y = 0;
    const printSize = 1200;
    const u = new go.Size(printSize, printSize);
    const svg = myDiagram.makeSvg({ scale: 1.0, position: new go.Point(x, y), size: u });
    svgimg.appendChild(svg);
}
function FlatTreeLayout() {
    go.TreeLayout.call(this);
}
go.Diagram.inherit(FlatTreeLayout, go.TreeLayout);
FlatTreeLayout.prototype.commitLayout = function () {
    go.TreeLayout.prototype.commitLayout.call(this);
    let y = -Infinity;
    this.network.vertexes.each(function (v) {
        y = Math.max(y, v.node.position.y);
    });
    this.network.vertexes.each(function (v) {
        if (v.destinationEdges.count === 0) {
            v.node.position = new go.Point(v.node.position.x, y);
            v.node.toEndSegmentLength = Math.abs(v.centerY - y);
        }
        else {
            v.node.toEndSegmentLength = 10;
        }
    });
};
