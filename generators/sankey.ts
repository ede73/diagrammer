// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators, GraphCanvas } from '../model/graphcanvas.js'
import { GraphEdge } from '../model/graphedge.js'
import { traverseEdges, traverseVertices } from '../model/traversal.js'
import { output } from '../model/support.js'
import { GraphConnectable } from '../model/graphconnectable.js'

// ADD TO INDEX.HTML AS: <option value="sankey">Sankey</option>

/**
 * To test: node js/diagrammer.js verbose tests/test_inputs/sankey.txt sankey
 */
export function sankey(graphcanvas: GraphCanvas) {
  const lout = (...args: any[]) => {
    const [textOrIndent, maybeIndent] = args
    output(graphcanvas, textOrIndent, maybeIndent)
  }

  function getValueAndPercentage(edge: GraphEdge): [value: number, hasValue: boolean, isPercentage: boolean] {
    const label = edge.getLabel()
    if (label) {
      const nums = label.trim().match(/^([0-9]+)(?:[::space::]*)([%]|)/)
      if (nums) {
        return [Number(nums[1]), true, nums[2] === '%']
      }
    }
    return [Number.NaN, false, false]
  }

  function isPureValue(edge: GraphEdge) {
    const [value, hasValue, isPercentage] = getValueAndPercentage(edge)
    return hasValue && !isPercentage
  }

  function isPercent(edge: GraphEdge) {
    const [value, hasValue, isPercentage] = getValueAndPercentage(edge)
    return hasValue && isPercentage
  }

  function getPrecedingNode(edge: GraphEdge) {
    return edge.isRightPointingEdge() ? edge.left : edge.right
  }

  /*
   * Return ALL edges immediately left of given node (ie. all edges right pointing to this node)
   * Recursive sum of all lefts of lefts of... will be the value of the 'node'
   * And once that is known, outoing percentage can be calculated
   * 
   * No cyclic protection here...
   */
  function returnEdgesLeadingTo(thisNode: GraphConnectable) {
    const edgesLeadingToGivenNode: GraphEdge[] = []
    traverseEdges(graphcanvas, e => {
      if ((e.isRightPointingEdge() && e.right === thisNode)
        || (e.isLeftPointingEdge() && e.left === thisNode)) {
        edgesLeadingToGivenNode.push(e)
      }
    })
    return edgesLeadingToGivenNode
  }

  function dumpEdge(edge: GraphEdge) {
    if (edge.isRightPointingEdge()) {
      return `(${edge.left.getName()} ${edge.edgeType} ${edge.right.getName()} with label(${edge.getLabel() ?? ''})`
    } else {
      return `(${edge.right.getName()} r(${edge.edgeType}) ${edge.left.getName()} with label(${edge.getLabel() ?? ''})`
    }
  }

  /*
   * Return the edge value, for example in a>b;10 or a>"10"b case it is 10, but
   * to help user design the sankey graph, allow % values also, so for a graph
   * a>"100"b,"200"c,"1000"d d>"60%"y,"40%"z z>"10%"f
   * Link z>f is resolves to 10% * 40% * 1000 (ie. 0.1 * 0.4 * 1000) = 40
   */
  function getEdgeValue(edge: GraphEdge): number {

    // TODO: Alas currently this will not work, as edge is disjoint association
    // between GraphConnectable and GraphEdges, we cannot traverse to Edge from Connectable
    // const lvalue = getEdgeValue(edge.left)
    // We can try to find an edge the has right link pointing to the same node.
    // This also may be ambiguous if it is cyclic, or multiple edges point to the same node
    // Also for sake of argument, left head means left of right pointing edge, if edge was left pointing, we'd reverse!
    // a>b>c
    const valueForThisEdge = (edge: GraphEdge): number => {
      const [value, hasValue, isPercentage] = getValueAndPercentage(edge)
      if (!hasValue) {
        return Number.NaN
      }
      if (!isPercentage && hasValue) {
        return value
      }
      // ok, value is precentage of previous node's value (value which may need recursive search to resolve)
      const preceedingNode = getPrecedingNode(edge)
      const ipn = returnEdgesLeadingTo(preceedingNode)
      const values = ipn.map(n => {
        return (value * valueForThisEdge(n)) / 100
      })
      return values.reduce((pv, cv) => pv + cv, 0);
    }
    return valueForThisEdge(edge)
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
    const label = vertex.getLabel()
    vertexIndexes.set(name, index++)
    lout(`${comma}{"name":"${label ? label : name}"}`)
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
    const amount = getEdgeValue(edge)
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
