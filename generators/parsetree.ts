// @ts-check
// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators } from '../model/graphcanvas.js'
import { GraphVertex } from '../model/graphvertex.js'
import { type GraphConnectable } from '../model/graphconnectable.js'
import { debug } from '../model/debug.js'
import { Generator } from './generator.js'

// ADD TO INDEX.HTML AS: <option value="parsetree">ParseTree(GoJS)</option>

/**
 * Only one root supported!
 * To test: node js/generate.js tests/test_inputs/parsetree.txt parsetree
 */
export class ParseTree extends Generator {
  generate() {
    const nodeList = []
    function addEdgeedVertex(left: GraphConnectable, right: GraphConnectable) {
      if (!(left instanceof GraphVertex)) return
      if (!(right instanceof GraphVertex)) return
      const key = right.id
      const parent = left.id
      const text = (!right.label) ? right.name : right.label
      nodeList.push({ key, text, fill: '#f8f8f8', stroke: '#4d90fe', parent })
    }

    // debug(JSON.stringify(this.graphCanvas.EDGES));

    const root = this.graphCanvas._ROOTVERTICES
    if (root.length > 1) {
      throw new Error('Only one root node supported')
    }

    (() => {
      root[0].id = 1
      const text = (!root[0].label) ? root[0].name : root[0].label
      nodeList.push({ key: root[0].id, text, fill: '#f8f8f8', stroke: '#4d90fe' })
      let keyId = 2
      this.graphCanvas.getObjects().forEach(node => {
        if (!node.id) {
          node.id = keyId++
        }
      })
    })()

    this.graphCanvas.getEdges().forEach(edge => {
      debug('edge ' + edge.left.name + ' to ' + edge.right.name)
      addEdgeedVertex(edge.left, edge.right)
    })
    this.lout(JSON.stringify(nodeList, null, 3))
  }
} generators.set('parsetree', ParseTree)
