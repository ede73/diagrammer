import { GraphConnectable } from './graphconnectable.js'
// used in type declarations
// eslint-disable-next-line no-unused-vars
import { GraphVertex } from './graphvertex.js'

// Common 'subclass' for GraphInner, GraphGroup, GraphCanvas
export class GraphContainer extends GraphConnectable {
  ALLOWED_DEFAULTS = Object.freeze(['edgecolor', 'groupcolor', 'vertexcolor', 'vertextextcolor', 'edgetextcolor'])

  /** @param {string} name */
  constructor (name) {
    super(name)

    /**
     * "Private" (uh..there's no reliable overarching privacy support in ES/node/browser space), indicate with _
     *  @type {GraphConnectable[]}
     */
    this._OBJECTS = []
    /**
     * This holds vertices that have no incoming edges (no edge has this vertex as right hand side)
     *
     * In theory, these nodes should be ROOT nodes in the tree!
     *
     * Some graphs are happy with it, some may be limited to single root node
     *
     * One could also imagine this being list of sub trees in a way
     * GraphContainer | GraphVertex
     * @type {GraphConnectable[]}
     */
    this._ROOTVERTICES = []
    /** @type {GraphConnectable[]} */
    this.equal = []
  }

  /**
   * Save EQUAL vertex ranking
   * (or Connectable? Ever? Will dotty know to equalize groups?)
   * @param {GraphVertex[]} value
   */
  setEqual (value) {
    this.equal = value
    return this
  }

  getEqual () {
    return this.equal
  }

  isEmpty () {
    return this._OBJECTS.length === 0
  }

  getFirstObject () {
    return this._OBJECTS[0]
  }
};
