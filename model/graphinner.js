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
    this.exit = undefined

    /** @type {(GraphConnectable|GraphConnectable[])} */
    this.entrance = undefined
  }

  /**
   * @param {(GraphConnectable|GraphConnectable[])} entrance
   * @return {*}
   */
  setEntrance (entrance) {
    debug(`subgraph:Set entrance to ${entrance}`)
    this.entrance = entrance
    return this
  }

  getEntrance () {
    return this.entrance
  }

  /**
   * @param {GraphConnectable} exit
   * @return {GraphInner}
   */
  setExit (exit) {
    debug(`subgraph:Set exit to ${exit}`)
    this.exit = exit
    return this
  }

  /**
   * @return {*}
   */
  getExit () {
    return this.exit
  }

  /**
   * Edge labels only on Group and Vertex
   */
  // @ts-ignore
  setEdgeLabel (value) {
    throw new Error('EdgeLabel N/A')
    // keeping type checker happy
    // eslint-disable-next-line no-unreachable
    return this
  }

  // @ts-ignore
  getEdgeLabel () {
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
    if (this.edgelabel) { fmt += `,edgelabel:${this.edgelabel}` }
    if (this.entrance) { fmt += `,entrance:${this.entrance}` }

    if (this.exit) { fmt += `,exit:${this.exit}` }
    if (this._ROOTVERTICES) { fmt += `,rootvertices:${this._ROOTVERTICES}` }
    return `SubGraph(name:${this.name}${fmt})`
  };
};
