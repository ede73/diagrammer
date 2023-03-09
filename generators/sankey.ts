// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators, type GraphCanvas } from '../model/graphcanvas.js'
import { type GraphEdge, GraphEdgeDirectionType } from '../model/graphedge.js'
import { output } from '../model/support.js'
import { type GraphConnectable } from '../model/graphconnectable.js'

// ADD TO INDEX.HTML AS: <option value="sankey">Sankey</option>

export interface SankeyNodeT {
  name: string
}
export interface SankeyLinkT {
  source: number
  target: number
  value: number
}
export interface SankeyDocumentT {
  nodes: SankeyNodeT[]
  links: SankeyLinkT[]
}

/**
 * To test: node js/generate.js verbose tests/test_inputs/sankey.txt sankey
 */
export function sankey(graphcanvas: GraphCanvas) {
  const sankeyDoc: SankeyDocumentT = {
    nodes: [],
    links: []
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

  function getPrecedingNode(edge: GraphEdge) {
    return edge.direction() === GraphEdgeDirectionType.RIGHT ? edge.left : edge.right
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
    graphcanvas.getEdges().forEach(e => {
      if ((e.direction() === GraphEdgeDirectionType.RIGHT && e.right === thisNode) ||
        (e.direction() === GraphEdgeDirectionType.LEFT && e.left === thisNode)) {
        edgesLeadingToGivenNode.push(e)
      }
    })
    return edgesLeadingToGivenNode
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
      return values.reduce((pv, cv) => pv + cv, 0)
    }
    return valueForThisEdge(edge)
  }

  const vertexIndexes = new Map()
  let index = 0
  graphcanvas.getObjects().forEach(vertex => {
    const name = vertex.getName()
    const label = vertex.getLabel()
    vertexIndexes.set(name, index++)
    const node: SankeyNodeT = { name: `${(label || name) ?? ''}` }
    sankeyDoc.nodes.push(node)
  })

  /**
   * For a dendrogram we're not interested in vertices
   * just edges(for now!)
   */
  graphcanvas.getEdges().forEach(edge => {
    const amount = getEdgeValue(edge)
    const left = vertexIndexes.get(edge.left.name)
    const right = vertexIndexes.get(edge.right.name)
    const link: SankeyLinkT = (edge.direction() === GraphEdgeDirectionType.RIGHT)
      ? { source: left, target: right, value: amount }
      : { source: right, target: left, value: amount }
    sankeyDoc.links.push(link)
  })
  output(graphcanvas, JSON.stringify(sankeyDoc))
}
generators.set('sankey', sankey)
