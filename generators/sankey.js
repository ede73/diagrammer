// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators } from '../model/graphcanvas.js'
import { traverseEdges, traverseVertices } from '../model/model.js'
import { output } from '../model/support.js'

// ADD TO INDEX.HTML AS: <option value="sankey">Sankey</option>

/**
 * To test: node js/diagrammer.js verbose tests/test_inputs/sankey.txt sankey
 * @param {GraphCanvas} graphcanvas
 */
export function sankey (graphcanvas) {
  /**
   * @param {string} str
   * @returns {number}
   */
  function getNumber (str) {
    const nums = str.trim().match('^[0-9]+')
    if (nums) {
      return Number(nums[0])
    }
    return 0
  }

  // /**
  //  * @param {GraphVertex} vertex
  //  * @param {number} size
  //  */
  // function addSize (vertex, size) {
  //   if (vertex.size) {
  //     vertex.size += size
  //   } else {
  //     vertex.size = size
  //   }
  // }

  output(graphcanvas, '{', true)

  let comma = ''

  output(graphcanvas, '"nodes":[', true)
  const vertexIndexes = new Map()
  let index = 0
  traverseVertices(graphcanvas, vertex => {
    const name = vertex.getName()
    vertexIndexes.set(name, index++)
    output(graphcanvas, `${comma}{"name":"${name}"}`)
    comma = ','
  })
  output(graphcanvas, '],', false)

  output(graphcanvas, '"links":[', true)
  comma = ''
  /**
   * For a dendrogram we're not interested in vertices
   * just edges(for now!)
   */
  traverseEdges(graphcanvas, edge => {
    const amount = getNumber(edge.getLabel())
    const left = vertexIndexes.get(edge.left.name)
    const right = vertexIndexes.get(edge.right.name)
    if (edge.isRightPointingEdge()) {
      output(graphcanvas, `${comma}{"source":${left},"target":${right},"value":${amount}}`)
    } else {
      output(graphcanvas, `${comma}{"source":${right},"target":${left},"value":${amount}}`)
    }
    comma = ','
  })
  output(graphcanvas, ']', false)
  output(graphcanvas, '}', false)
}
generators.set('sankey', sankey)
