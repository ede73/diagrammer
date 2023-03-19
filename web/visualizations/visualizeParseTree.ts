// @ts-check
import go from 'gojs'
// import * as go from 'go';
import { removeOldVisualizations } from '../d3support.js'

// use ../manual_test_diagrams/parsetree.d
export async function visualizeParseTree(generatorResult: string) {
  const jsonData = JSON.parse(generatorResult)
  const $ = go.GraphObject.make // for conciseness in defining templates
  const svgimg = removeOldVisualizations('PARSETREENODE')
  // const svgimg = makeSVG();

  const myDiagram =
    $(go.Diagram, 'PARSETREENODE',
      {
        allowCopy: false,
        allowDelete: false,
        allowMove: false,
        initialAutoScale: go.Diagram.Uniform,
        layout:
          // @ts-expect-error TODO: just import conflict node vs. browser vs. VSCode, will resolve eventually
          $(FlatTreeLayout, // custom Layout, defined below
            {
              angle: 90,
              compaction: go.TreeLayout.CompactionNone
            }),
        'undoManager.isEnabled': true
      })

  myDiagram.nodeTemplate =
    $(go.Node, 'Vertical',
      { selectionObjectName: 'BODY' },
      $(go.Panel, 'Auto', { name: 'BODY' },
        $(go.Shape, 'RoundedRectangle',
          new go.Binding('fill'),
          new go.Binding('stroke')),
        $(go.TextBlock,
          { font: 'bold 12pt Arial, sans-serif', margin: new go.Margin(4, 2, 2, 2) },
          new go.Binding('text'))
      ),
      $(go.Panel, // this is underneath the "BODY"
        { height: 17 }, // always this height, even if the TreeExpanderButton is not visible
        $('TreeExpanderButton')
      )
    )

  myDiagram.linkTemplate =
    $(go.Link,
      $(go.Shape, { strokeWidth: 1.5 }))

  const nodeDataArray = jsonData

  // create the Model with data for the tree, and assign to the Diagram
  myDiagram.model =
    $(go.TreeModel,
      { nodeDataArray })
  const x = 0; const y = 0; const printSize = 1200
  const u = new go.Size(printSize, printSize)
  const svg = myDiagram.makeSvg({ scale: 1.0, position: new go.Point(x, y), size: u }) as SVGElement
  svgimg.appendChild(svg)
}

// Customize the TreeLayout to position all of the leaf nodes at the same vertical Y position.
function FlatTreeLayout() {
  go.TreeLayout.call(this) // call base constructor
}
go.Diagram.inherit(FlatTreeLayout, go.TreeLayout)

// This assumes the TreeLayout.angle is 90 -- growing downward
FlatTreeLayout.prototype.commitLayout = function () {
  // @ts-expect-error TODO: just import conflict node vs. browser vs. VSCode, will resolve eventually
  go.TreeLayout.prototype.commitLayout.call(this) // call base method first
  // find maximum Y position of all Nodes
  let y = -Infinity
  // network is definitely
  this.network.vertexes.each(function (v) {
    y = Math.max(y, v.node.position.y)
  })
  // move down all leaf nodes to that Y position, but keeping their X position
  this.network.vertexes.each(function (v) {
    if (v.destinationEdges.count === 0) {
      // shift the node down to Y
      v.node.position = new go.Point(v.node.position.x, y)
      // extend the last segment vertically
      v.node.toEndSegmentLength = Math.abs(v.centerY - y)
    } else { // restore to normal value
      v.node.toEndSegmentLength = 10
    }
  })
}
