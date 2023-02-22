// @ts-check

// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators, GraphCanvas, visualizations } from '../model/graphcanvas.js'
import { GraphVertex } from '../model/graphvertex.js'
import { traverseEdges } from '../model/traversal.js'
import { GraphConnectable } from '../model/graphconnectable.js'
import { debug, output } from '../model/support.js'
import { findVertex, traverseTree, TreeVertex } from '../model/tree.js'

// ADD TO INDEX.HTML AS: <option value="dendrogram:radialdendrogram">Radial Dendrogram</option>
// ADD TO INDEX.HTML AS: <option value="dendrogram:reingoldtilford">Reingold-Tilford</option>
// ADD TO INDEX.HTML AS: <option value="dendrogram:circlepacked">Circle packed(TBD)</option>

/**
 * To test: node js/diagrammer.js verbose tests/test_inputs/dendrogram.txt dendrogram
*/
export function dendrogram(graphcanvas: GraphCanvas) {
  const lout = (...args: any[]) => {
    const [textOrIndent, maybeIndent] = args
    output(graphcanvas, textOrIndent, maybeIndent)
  }

  let tree: TreeVertex | undefined
  function addVertex(lhs: GraphConnectable, rhs: GraphConnectable) {
    if (!tree) {
      tree = new TreeVertex(lhs)
    }
    if (!(lhs instanceof GraphVertex)) return
    const cl = findVertex(tree, lhs)
    if (!cl) {
      throw new Error(`Left node (${lhs.name}) not found from tree`)
    }
    if (!findVertex(tree, rhs) && (rhs instanceof GraphVertex)) {
      debug(`Add ${rhs.name} as child of ${cl.data.name}`)
      cl.CHILDREN.push(new TreeVertex(rhs))
    }
  }

  /**
   * For a dendrogram we're not interested in vertices
   * just edges(for now!)
   */
  traverseEdges(graphcanvas, edge => {
    addVertex(edge.left, edge.right)
  })

  // just for the linter
  if (!tree) {
    throw new Error("No tree")
  }
  traverseTree(tree, (t, isLeaf, hasSibling) => {
    if (isLeaf) {
      let comma = ''
      if (hasSibling) { comma = ',' }
      lout(`{"name": "${t.data.name}", "size": 1}${comma}`)
    } else {
      lout('{', true)
      lout(`"name": "${t.data.name}",`)
    }
  }, (t) => {
    lout('"children": [', true)
  }, (t, hasNextSibling) => {
    lout(']', false)
    if (hasNextSibling) {
      lout('},', false)
    } else {
      lout('}', false)
    }
  })
}
generators.set('dendrogram', dendrogram)
visualizations.set('dendrogram', ['radialdendrogram', 'circlepacked', 'reingoldtilford'])
