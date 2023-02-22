// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators, GraphCanvas } from '../model/graphcanvas.js'
import { traverseEdges, traverseVertices } from '../model/traversal.js'
import { output } from '../model/support.js'

// ADD TO INDEX.HTML AS: <option value="sankey">Sankey</option>

/**
 * To test: node js/diagrammer.js verbose tests/test_inputs/sankey.txt sankey
 */
export function sankey(graphcanvas: GraphCanvas) {
  const lout = (...args: any[]) => {
    const [textOrIndent, maybeIndent] = args
    output(graphcanvas, textOrIndent, maybeIndent)
  }

  function getNumber(str?: string) {
    if (!str) {
      return 0
    }
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

  lout('{', true)

  let comma = ''

  lout('"nodes":[', true)
  const vertexIndexes = new Map()
  let index = 0
  traverseVertices(graphcanvas, vertex => {
    const name = vertex.getName()
    vertexIndexes.set(name, index++)
    lout(`${comma}{"name":"${name}"}`)
    comma = ','
  })
  lout('],', false)

  lout('"links":[', true)
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
      lout(`${comma}{"source":${left},"target":${right},"value":${amount}}`)
    } else {
      lout(`${comma}{"source":${right},"target":${left},"value":${amount}}`)
    }
    comma = ','
  })
  lout(']', false)
  lout('}', false)
}
generators.set('sankey', sankey)
