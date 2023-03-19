// @ts-check

// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { GraphGroup } from '../model/graphgroup.js'
import { Generator } from './generator.js'

/**
 * To test: node js/generate.js verbose tests/test_inputs/layerbands.txt layerbands
*/
export class LayerBands extends Generator {
  generate() {
    const groups: { key: string, category: string, itemArray: Array<{ text: string }> } = {
      key: '_BANDS',
      category: 'Bands',
      itemArray: []
    }
    const linkedVertices: any[] = [
      groups
    ]

    this.graphCanvas.getObjects().forEach(obj => {
      if (obj instanceof GraphGroup) {
        groups.itemArray.push({ text: obj.name ?? '' })
      }
    })

    this.graphCanvas.getEdges().forEach(edge => {
      if (!edge.left) {
        // probably our root
        // linkedVertexs.push({key: l.right.name});
      } else {
        linkedVertices.push({ key: edge.right.name, parent: edge.left.name })
      }
    })
    this.lout(JSON.stringify(linkedVertices))
  }
}
