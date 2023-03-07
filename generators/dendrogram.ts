// @ts-check

// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators, type GraphCanvas, visualizations } from '../model/graphcanvas.js'
import { GraphVertex } from '../model/graphvertex.js'
import { type GraphConnectable } from '../model/graphconnectable.js'
import { output } from '../model/support.js'
import { findVertex, traverseTree, TreeVertex } from '../model/tree.js'
import { debug } from '../model/debug.js'

// ADD TO INDEX.HTML AS: <option value="dendrogram:radialdendrogram">Radial Dendrogram</option>
// ADD TO INDEX.HTML AS: <option value="dendrogram:reingoldtilford">Reingold-Tilford</option>
// ADD TO INDEX.HTML AS: <option value="dendrogram:circlepacked">Circle packed(TBD)</option>

export interface DendrogramDocument {
  name: string
  children: Array<ThisType<this>>
  size?: number
}

/**
 * To test: node js/diagrammer.js verbose tests/test_inputs/dendrogram.txt dendrogram
 * TODO: The class hierarchy is disconnected. Just using getObjects() doesn't allow proper graph traversal
 *
 * There's nothing wrong with the model - all are recorded (check ast/ast_record) but especially for dendrogram
 *
 * It is possible to construct a graph say a>b>c>d c>(k,v) d>(l,o) (or similar) that dendrogram cannot reach all nodes
 *
 * It processes edges first, first LHS becomes tree root (dendrogram can have 1 root only) and all
 * reminder nodes are added subsequently.
 *
 * Some of the nodes are just GraphReferences (if seen few times), problem #1 - mitigated partially
 * Then it seems like GraphInners werent includes (they're GraphGroups, but dendro generation missed this) - mitigated
 * How ever the order the link traversal sees the nodes, the LHS GraphVertex may be MISSED in traversal
 *
 * Now, taking GraphCanvas, its objects, we only see a,b,c,d..root notes, not the inners
 * One would have to traverse deeper.
 *
 * Anway, doable, but defeates the purposes hacking around this inefficiency in the generator.
 *
 * GraphCanvas (or traversal/support) should provide this. Perhaps also instead of naive object
 * storage, we could have a proper linked tree there.
 *
 * Long rant, but gotta get fixed, else radial dendrogram visualization is iffy
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
      throw new Error(`Left node (${lhs.name ?? ''}) not found from tree`)
    }
    if (!findVertex(tree, rhs) && (rhs instanceof GraphVertex)) {
      debug(`Add ${rhs.name ?? ''} as child of ${cl.data.name as string}`)
      cl.CHILDREN.push(new TreeVertex(rhs))
    }
  }

  /**
   * For a dendrogram we're not interested in vertices
   * just edges(for now!)
   */
  graphcanvas.getEdges().forEach(edge => {
    addVertex(edge.left, edge.right)
  })

  // just for the linter
  if (!tree) {
    throw new Error('No tree')
  }
  traverseTree(tree, (t, isLeaf, hasSibling) => {
    if (isLeaf) {
      let comma = ''
      if (hasSibling) { comma = ',' }
      lout(`{"name": "${t.data.name as string}", "size": 1}${comma}`)
    } else {
      lout('{', true)
      lout(`"name": "${t.data.name as string}",`)
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
