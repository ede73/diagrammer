// @ts-check
// used in type declarations
// eslint-disable-next-line no-unused-vars
import { GraphEdge } from '../model/graphedge.js'
import { getAttribute, setAttr } from '../model/support.js'
// typing
// eslint-disable-next-line no-unused-vars
import { GraphConnectable } from './graphconnectable.js'
// typing
// eslint-disable-next-line no-unused-vars
import { GraphGroup } from './graphgroup.js'
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
    this._EDGES = []
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

    // parsing context
    /**
     * Current container stack.
     *
     * Everytime a group is created (in the context of parsing in process)
     * it is entered, last on in this array (top of the stack) is the current
     * One group is closed (in the context of parsing), it is popped (and it will never be entered again)
     * and we have next..and next until we're back at GraphCanvas
     * Can be GraphGroup or GraphInnerGroup
     * @type  {GraphContainer[]}
     */
    this.CURRENTCONTAINER = [this]
    /**
     * TODO: rename
     * Used when processing conditional constructs (if/elseif/else)
     * Currently ONLY used in conditional last else block where
     * NEXT vertex seen will be stores as "else"s _conditionalExitEdge!
     * @type {GraphGroup}
     */
    this._nextConnectableToExitEndIf = undefined
    /** @type {number} */
    this.CONTAINER_EXIT = 1
    /**
     * Automated indexing for created subgraphs (nameless)
     * @type {number}
     */
    this.SUBGRAPHS = 1
    /**
     * Automated indexing for created groups (they can be nameless)
     * @type {number}
     */
    this.GROUPIDS = 1
    /**
     * Store all declared variables (and their values)
     * @type {Object.<string, string>}
     */
    this.VARIABLES = {}
    /**
     * @type {GraphConnectable}
     */
    this.lastSeenVertex = undefined
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

  /**
   * TODO: DUAL DECLARATION
   *
   * Usage: grammar/diagrammer.grammar
   *
   * Get current container
   * @return {GraphContainer}
   */
  _getCurrentContainer () {
    return this.CURRENTCONTAINER[this.CURRENTCONTAINER.length - 1]
  }

  /**
   * Enter into a new container, set it as current container
   * TODO: move to GraphCanvas
   * Usage: grammar/diagrammer.grammar
   *
   * @param {GraphContainer} container Set this container as current container
   * @return {GraphContainer}
   */
  _enterContainer (container) {
    this.CURRENTCONTAINER.push(container)
    return container
  }

  /**
   * Exit the current container
   * Return the previous one
   * Previous one also set as current container
   *
   * TODO: Move to GraphCanvas
   * Usage: grammar/diagrammer.grammar
   *
   */
  _exitContainer () {
    if (this.CURRENTCONTAINER.length <= 1) { throw new Error('INTERNAL ERROR:Trying to exit ROOT container') }
    const currentContainer = this.CURRENTCONTAINER.pop()
    if (currentContainer instanceof GraphGroup) {
      currentContainer.exitvertex = this.CONTAINER_EXIT++
    }
    // TODO: digraph (or graphviz rather) visualizing empty subgraph breaks, it needs a node (invisible for instance)
    // digraph generator imlpements this by injecting empty invis node for all empty groups.
    // While this works, it does edit the graph, which is bad..
    return currentContainer
  }
};
