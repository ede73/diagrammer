// @ts-check
import { debug } from '../model/support.js'
import { GraphConnectable } from './graphconnectable.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphVertex } from './graphvertex.js'

/**
 * An inner graph, where outside is linked to all the Vertices in side, like
 * outerVertex > ( LinkedToInnerVertex AndThese>Inner>VerticesAlso)
 */
export class GraphInner extends GraphGroup {

  _exit?: GraphConnectable = undefined
  _entrance?: (GraphConnectable | GraphConnectable[]) = undefined

  constructor(name: string) {
    super(name)
    this.isInnerGraph = true
  }

  _setEntrance(entrance: (GraphConnectable | GraphConnectable[])) {
    debug(`subgraph:Set entrance to ${entrance}`)
    this._entrance = entrance
    return this
  }

  _getEntrance() {
    return this._entrance
  }

  _setExit(exit: GraphConnectable) {
    debug(`subgraph:Set exit to ${exit}`)
    this._exit = exit
    return this
  }

  _getExit() {
    return this._exit
  }

  /**
   * Edge labels only on Group and Vertex
   */
  _setEdgeLabel(value: string) {
    throw new Error('EdgeLabel N/A')
    return this
  }

  _getEdgeLabel() {
    throw new Error('EdgeLabel N/A')
    return ''
  }

  /**
   * Equals only on Group and Vertex
   */
  setEqual(value: GraphVertex[]) {
    throw new Error('Equals N/A')
    return this
  }

  getEqual() {
    throw new Error('Equals N/A')
    return []
  }

  toString() {
    let fmt = ''
    if (this._edgelabel) { fmt += `,edgelabel:${this._edgelabel}` }
    if (this._entrance) { fmt += `,entrance:${this._entrance}` }

    if (this._exit) { fmt += `,exit:${this._exit}` }
    if (this._ROOTVERTICES) { fmt += `,rootvertices:${this._ROOTVERTICES}` }
    return `SubGraph(name:${this.name}${fmt})`
  };
};
