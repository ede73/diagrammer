// @ts-check

// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators, GraphCanvas } from '../model/graphcanvas.js'
import { GraphGroup } from '../model/graphgroup.js'
import { traverseEdges, traverseVertices } from '../model/traversal.js'
import { output } from '../model/support.js'

// ADD TO INDEX.HTML AS: <option value="layerbands">LayerBands(GoJS)</option>

/**
 * To test: node js/diagrammer.js verbose tests/test_inputs/layerbands.txt layerbands
*/
export function layerbands(graphcanvas: GraphCanvas) {
  const lout = (...args) => {
    const [textOrIndent, maybeIndent] = args
    output(graphcanvas, textOrIndent, maybeIndent)
  }

  const groups = {
    key: '_BANDS',
    category: 'Bands',
    itemArray: []
  }
  const linkedVertices: any[] = [
    groups
  ]

  traverseVertices(graphcanvas, obj => {
    if (obj instanceof GraphGroup) {
      groups.itemArray.push({ text: obj.name })
    }
  })

  traverseEdges(graphcanvas, edge => {
    if (!edge.left) {
      // probably our root
      // linkedVertexs.push({key: l.right.name});
    } else {
      linkedVertices.push({ key: edge.right.name, parent: edge.left.name })
    }
  })
  lout(JSON.stringify(linkedVertices))
}
generators.set('layerbands', layerbands)
