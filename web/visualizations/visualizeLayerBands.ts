// @ts-check
// import go from '../../node_modules/gojs/release/go-debug-module.js'
import go from 'gojs'
// import * as go from 'go';
import { removeOldVisualizations } from '../d3support.js'
// Use in editor.. gets go.d.ts
// import * as go from '../../js/go'

// use ../manual_test_diagrams/layerbands.d
export async function visualizeLayerBands(generatorResult: string) {
  const jsonData = JSON.parse(generatorResult)
  const HORIZONTAL = true
  // Perform a TreeLayout where commitLayers is overridden to modify the background Part whose key is "_BANDS".
  class BandedTreeLayout extends go.TreeLayout {
    constructor() {
      super()
      this.layerStyle = go.TreeLayout.LayerUniform // needed for straight layers
    }

    /**
     * @param {go.Rect[]} layerRects an Array of Rects with the bounds of each of the "layers"
     * @param {go.Point} offset the position of the top-left corner of the banded area relative to the coordinates given by the layerRects
    */
    commitLayers(layerRects, offset) {
      // update the background object holding the visual "bands"
      // Some contradiction with gojs modules...
      // @ts-expect-error TODO: just import conflict node vs. browser vs. VSCode, will resolve eventually
      const bands = this.diagram.findPartForKey('_BANDS')
      if (!bands) {
        return
      }
      // Some contradiction with gojs modules...
      // @ts-expect-error TODO: just import conflict node vs. browser vs. VSCode, will resolve eventually
      const model = this.diagram.model
      // Some contradiction with gojs modules...
      bands.location = this.arrangementOrigin.copy().add(offset)

      // make each band visible or not, depending on whether there is a layer for it
      for (let it = bands.elements; it.next();) {
        const idx = it.key
        const elt = it.value // the item panel representing a band
        elt.visible = idx < layerRects.length
      }

      // set the bounds of each band via data binding of the "bounds" property
      const arr = bands.data.itemArray
      for (let i = 0; i < layerRects.length; i++) {
        const itemdata = arr[i]
        if (itemdata) {
          model.setDataProperty(itemdata, 'bounds', layerRects[i])
        }
      }
    }
  };

  // go.TreeLayout.call(this);
  // this.layerStyle = go.TreeLayout.LayerUniform;  // needed for straight layers

  function init() {
    const $ = go.GraphObject.make

    const svgimg = removeOldVisualizations('LAYEREDBANDNODE')
    // const svgimg = makeSVG();

    const myDiagram = $(go.Diagram, 'LAYEREDBANDNODE',
      {
        layout: $(BandedTreeLayout, // custom layout is defined above
          {
            angle: HORIZONTAL ? 0 : 90,
            arrangement: HORIZONTAL ? go.TreeLayout.ArrangementVertical : go.TreeLayout.ArrangementHorizontal
          }),
        'undoManager.isEnabled': true
      })

    myDiagram.nodeTemplate =
      $(go.Node, go.Panel.Auto,
        $(go.Shape, 'Rectangle',
          { fill: 'white' }),
        $(go.TextBlock, { margin: 5 },
          new go.Binding('text', 'key')))

    // There should be at most a single object of this category.
    // This Part will be modified by BandedTreeLayout.commitLayers to display visual "bands"
    // where each "layer" is a layer of the tree.
    // This template is parameterized at load time by the HORIZONTAL parameter.
    // You also have the option of showing rectangles for the layer bands or
    // of showing separator lines between the layers, but not both at the same time,
    // by commenting in/out the indicated code.
    myDiagram.nodeTemplateMap.add('Bands',
      $(go.Part, 'Position',
        new go.Binding('itemArray'),
        {
          isLayoutPositioned: false, // but still in document bounds
          locationSpot: new go.Spot(0, 0, HORIZONTAL ? 0 : 16, HORIZONTAL ? 16 : 0), // account for header height
          layerName: 'Background',
          pickable: false,
          selectable: false,
          itemTemplate:
            $(go.Panel, HORIZONTAL ? 'Vertical' : 'Horizontal',
              new go.Binding('position', 'bounds', function (b: any) { return b.position }),
              $(go.TextBlock,
                {
                  angle: HORIZONTAL ? 0 : 270,
                  textAlign: 'center',
                  wrap: go.TextBlock.None,
                  font: 'bold 11pt sans-serif',
                  background: $(go.Brush, 'Linear', { 0: 'aqua', 1: go.Brush.darken('aqua') })
                },
                new go.Binding('text'),
                // always bind "width" because the angle does the rotation
                new go.Binding('width', 'bounds', function (r: any) { return HORIZONTAL ? r.width : r.height })
              ),
              // option 1: rectangular bands
              $(go.Shape,
                { stroke: null, strokeWidth: 0 },
                new go.Binding('desiredSize', 'bounds', function (r: any) { return r.size }),
                new go.Binding('fill', 'itemIndex', function (i: any) { return i % 2 === 0 ? 'whitesmoke' : go.Brush.darken('whitesmoke') }).ofObject())
            )
        }
      ))

    myDiagram.linkTemplate =
      $(go.Link,
        $(go.Shape)) // simple black line, no arrowhead needed

    // define the tree node data
    const nodearray = jsonData

    myDiagram.model = new go.TreeModel(nodearray)

    const x = 0; const y = 0
    const printSize = new go.Size(300, 300)
    const svg = myDiagram.makeSvg({ scale: 1.0, position: new go.Point(x, y), size: printSize }) as SVGElement
    svgimg.appendChild(svg)
  }
  init()
}
