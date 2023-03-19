// @ts-check

// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators, visualizations } from '../model/graphcanvas.js'
import { type GraphEdge } from '../model/graphedge.js'
import { type GraphObject } from '../model/graphobject.js'
import { GraphReference } from '../model/graphreference.js'
import { GraphVertex } from '../model/graphvertex.js'
import { output } from '../model/support.js'
import { makeConnectedTree, traverseTree, type TreeVertex } from '../model/tree.js'
import { Generator } from './generator.js'

// ADD TO INDEX.HTML AS: <option value="dendrogram:radialdendrogram">Radial Dendrogram</option>
// ADD TO INDEX.HTML AS: <option value="dendrogram:reingoldtilford">Reingold-Tilford</option>
// ADD TO INDEX.HTML AS: <option value="dendrogram:circlepacked">Circle packed(TBD)</option>

export interface DendrogramDocument {
  name: string
  children: Array<ThisType<this>>
  size?: number
  nodecolor?: string
  nodeshape?: string
  nodelabel?: string
  edgecolor?: string
  radial?: number
}

/**
 * To test: node js/generate.js verbose tests/test_inputs/dendrogram.txt dendrogram
 */
export class Dendrogram extends Generator {
  generate() {
    const tree = makeConnectedTree(this.graphCanvas)

    // just for the linter
    if (!tree) {
      throw new Error('No tree')
    }

    // TODO: use start vertex (is specified)?
    // TODO: use first vertex in the canvas as root
    if (tree.length !== 1) {
      tree.forEach(element => {
        console.warn(element.toString())
      })
      throw new Error('Sorry, dendrogram must have exactly one root, no more, no less ')
    }

    const treeOutput: any[] = []
    traverseTree(tree[0], (t, isLeaf, hasSibling, nThNodeOnTheLevel, edge?) => {
      if (nThNodeOnTheLevel) {
        // this is at least 2nd node on the same level (we have list of nodes), so comma separate the previous one
        const [what, ever] = treeOutput[treeOutput.length - 1]
        treeOutput[treeOutput.length - 1] = [`${what as string},`, ever]
      }

      const getExtras = (t: TreeVertex, edge?: GraphEdge) => {
        const ret: string[] = []
        const node: GraphObject = t.data
        if (edge?.getColor()) {
          ret.push(` "edgecolor": "${edge.getColor() ?? ''}"`)
        }
        if (node instanceof GraphVertex || node instanceof GraphReference) {
          if (node.getShape()) {
            ret.push(` "nodeshape": "${node.getShape() ?? ''}"`)
          }
          if (node.getColor()) {
            ret.push(` "nodecolor": "${node.getColor() ?? ''}"`)
          }
          if (node.getLabel()) {
            // TODO: quoting
            ret.push(` "nodelabel": "${node.getLabel() ?? ''}"`)
          }
        }
        if (ret.length > 0) {
          return `, ${ret.join(', ')}`
        }
        return ''
      }

      const extras = getExtras(t, edge)
      if (isLeaf) {
        treeOutput.push([`{"name": "${t.data.name}", "size": 1${extras}}`])
      } else {
        treeOutput.push(['{', true])
        treeOutput.push([`"name": "${t.data.name}"${extras},`])
      }
    }, (t) => {
      treeOutput.push(['"children": [', true])
    }, (t, hasNextSibling) => {
      treeOutput.push([']', false])
      treeOutput.push(['}', false])
    })
    treeOutput.forEach(p => { output(this.graphCanvas, ...p) })
  }
}
generators.set('dendrogram', Dendrogram)
visualizations.set('dendrogram', ['radialdendrogram', 'circlepacked', 'reingoldtilford'])
