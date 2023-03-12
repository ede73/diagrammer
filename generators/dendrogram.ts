// @ts-check

// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators, type GraphCanvas, visualizations } from '../model/graphcanvas.js'
import { output } from '../model/support.js'
import { makeConnectedTree, traverseTree } from '../model/tree.js'

// ADD TO INDEX.HTML AS: <option value="dendrogram:radialdendrogram">Radial Dendrogram</option>
// ADD TO INDEX.HTML AS: <option value="dendrogram:reingoldtilford">Reingold-Tilford</option>
// ADD TO INDEX.HTML AS: <option value="dendrogram:circlepacked">Circle packed(TBD)</option>

export interface DendrogramDocument {
  name: string
  children: Array<ThisType<this>>
  size?: number
}

/**
 * To test: node js/generate.js verbose tests/test_inputs/dendrogram.txt dendrogram
 */
export function dendrogram(graphcanvas: GraphCanvas) {
  const lout = (...args: any[]) => {
    const [textOrIndent, maybeIndent] = args
    output(graphcanvas, textOrIndent, maybeIndent)
  }

  const tree = makeConnectedTree(graphcanvas)

  // just for the linter
  if (!tree) {
    throw new Error('No tree')
  }
  if (tree.length !== 1) {
    tree.forEach(element => {
      console.warn(element.toString())
    })
    throw new Error('Sorry, dendrogram must have exactly one root, no more, no less ')
  }

  traverseTree(tree[0], (t, isLeaf, hasSibling) => {
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
