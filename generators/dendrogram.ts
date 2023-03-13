// @ts-check

// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators, type GraphCanvas, visualizations } from '../model/graphcanvas.js'
import { type GraphObject } from '../model/graphobject.js'
import { GraphReference } from '../model/graphreference.js'
import { GraphVertex } from '../model/graphvertex.js'
import { output } from '../model/support.js'
import { makeConnectedTree, traverseTree } from '../model/tree.js'

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
}

/**
 * To test: node js/generate.js verbose tests/test_inputs/dendrogram.txt dendrogram
 */
export function dendrogram(graphcanvas: GraphCanvas) {
  const tree = makeConnectedTree(graphcanvas)

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
  traverseTree(tree[0], (t, isLeaf, hasSibling, nThNodeOnTheLevel) => {
    if (nThNodeOnTheLevel) {
      // this is at least 2nd node on the same level (we have list of nodes), so comma separate the previous one
      const [what, ever] = treeOutput[treeOutput.length - 1]
      treeOutput[treeOutput.length - 1] = [`${what as string},`, ever]
    }

    const getExtras = (node: GraphObject) => {
      if (t.data instanceof GraphVertex || t.data instanceof GraphReference) {
        let ret = ''
        if (t.data.getShape()) {
          ret += ` "nodeshape": "${t.data.getShape() ?? ''}"`
        }
        if (t.data.getColor()) {
          ret += ` "nodecolor": "${t.data.getColor() ?? ''}"`
        }
        if (t.data.getLabel()) {
          // TODO: quoting
          ret += ` "nodelabel": "${t.data.getLabel() ?? ''}"`
        }
        return ret ? `,${ret}` : ''
      }
      return ''
    }

    const extras = getExtras(t.data)
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
  treeOutput.forEach(p => { output(graphcanvas, ...p) })
}
generators.set('dendrogram', dendrogram)
visualizations.set('dendrogram', ['radialdendrogram', 'circlepacked', 'reingoldtilford'])
