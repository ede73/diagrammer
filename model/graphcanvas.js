// @ts-check
// used in type declarations
// eslint-disable-next-line no-unused-vars
import { GraphEdge } from '../model/graphedge.js'
import { getAttribute, setAttr } from '../model/support.js'
import { GraphContainer } from './graphcontainer.js'

export const generators = new Map()
export const visualizations = new Map()

/**
 * Represents the graph canvas.
 *
 * Some graphs may have a root code, but the whole graph canves is free to have as many as required
 *
 * Single root graph:
 * a>b>c>d
 *
 * A graph with four roots
 * a b c d
 *
 * Even if the TREE has multiple root vertices (or basically multiple trees)
 * the graph will only EVER have one GraphCanvas
 *
 * TODO: Shouldn't inherit from GraphConnectable!
 */
export class GraphCanvas extends GraphContainer {
  /**
   * @type {function(string,string):void}
   */
  parseError = undefined

  /**
   * Output the generated result
   * @type {function(string):void}
   */
  result = undefined

  constructor () {
    super(undefined) // Canvas has no name
    /** @type {GraphEdge[]} */
    this.EDGES = []
    /** @type {string} */
    this.generator = undefined
    /** @type {string} */
    this.visualizer = undefined
    /** @type {string} */
    this.shape = undefined
    /** @type {string} */
    this.direction = undefined
    /** @type {string} */
    this.start = undefined
  }

  /**
   * @param {string} value
   * @return {GraphCanvas}
   */
  setGenerator (value) {
    this.generator = value.toLowerCase()
    return this
  }

  getGenerator () {
    return this.generator
  }

  /**
   * @param {string} value
   * @return {GraphCanvas}
   */
  setVisualizer (value) {
    this.visualizer = value.toLowerCase()
    return this
  }

  getVisualizer () {
    return this.visualizer
  }

  /**
   * @param {string} value
   * @return {GraphCanvas}
   */
  setCurrentShape (value) {
    // value?.toLowerCase() not yet in node 12.29 (default in ubuntu)
    if (value) { value = value.toLowerCase() }
    this.shape = value
    return this
  }

  getCurrentShape () {
    return this.shape
  }

  /**
   * @param {string} value
   */
  setDirection (value) {
    this.direction = value
    return this
  }

  getDirection () {
    return this.direction
  }

  /**
   * @param {string} value
   */
  setStart (value) {
    this.start = value
    return this
  }

  getStart () {
    return this.start
  }

  /**
   * Set default vertexcolor, groupcolor, edgecolor Always ask from the
   * currentContainer first
   * @param {string} key
   * @param {any} value
   */
  setDefault (key, value) {
    if (this.ALLOWED_DEFAULTS.indexOf(key.toLowerCase()) === -1) {
      throw new Error(`Trying to set unknown default ${key}`)
    }
    // @ts-ignore
    return setAttr(this, key, value)
  }

  /**
   *  @param {string} key
   */
  getDefault (key) {
    return getAttribute(this, key)
  }

  toString () {
    return 'GraphCanvas'
  }
};
