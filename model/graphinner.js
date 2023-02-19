// @ts-check
import { GraphGroup } from '../model/graphgroup.js'
import { debug } from '../model/support.js'
// used in type declarations
// eslint-disable-next-line no-unused-vars
import { GraphConnectable } from './graphconnectable.js'

/**
 * An inner graph, where outside is linked to all the Vertices in side, like
 * outerVertex > ( LinkedToInnerVertex AndThese>Inner>VerticesAlso)
 * @param name Name of the container
 * @constructor
 */
export class GraphInner extends GraphGroup {
  /** @param {string} name */
  constructor (name) {
    super(name)

    /** @type {boolean} */
    this.isInnerGraph = true

    /** @type {GraphConnectable} */
    this._exit = undefined

    /** @type {(GraphConnectable|GraphConnectable[])} */
    this._entrance = undefined
  }

  /**
   * @param {(GraphConnectable|GraphConnectable[])} entrance
   * @return {*}
   */
  _setEntrance (entrance) {
    debug(`subgraph:Set entrance to ${entrance}`)
    this._entrance = entrance
    return this
  }

  _getEntrance () {
    return this._entrance
  }

  /**
   * @param {GraphConnectable} exit
   * @return {GraphInner}
   */
  _setExit (exit) {
    debug(`subgraph:Set exit to ${exit}`)
    this._exit = exit
    return this
  }

  /**
   * @return {GraphConnectable}
   */
  _getExit () {
    return this._exit
  }

  /**
   * Edge labels only on Group and Vertex
   */
  // @ts-ignore
  _setEdgeLabel (value) {
    throw new Error('EdgeLabel N/A')
    // keeping type checker happy
    // eslint-disable-next-line no-unreachable
    return this
  }

  // @ts-ignore
  _getEdgeLabel () {
    throw new Error('EdgeLabel N/A')
    // keeping type checker happy
    // eslint-disable-next-line no-unreachable
    return ''
  }

  /**
   * Equals only on Group and Vertex
   */
  // @ts-ignore
  setEqual (value) {
    throw new Error('Equals N/A')
    // eslint-disable-next-line no-unreachable
    return this
  }

  // @ts-ignore
  getEqual () {
    throw new Error('Equals N/A')
    // eslint-disable-next-line no-unreachable
    return []
  }

  toString () {
    let fmt = ''
    if (this._edgelabel) { fmt += `,edgelabel:${this._edgelabel}` }
    if (this._entrance) { fmt += `,entrance:${this._entrance}` }

    if (this._exit) { fmt += `,exit:${this._exit}` }
    if (this._ROOTVERTICES) { fmt += `,rootvertices:${this._ROOTVERTICES}` }
    return `SubGraph(name:${this.name}${fmt})`
  };
};
