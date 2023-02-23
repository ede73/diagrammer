// @ts-check

import { GraphConnectable } from './graphconnectable.js'
import { GraphReference } from './graphreference.js'
import { GraphVertex } from './graphvertex.js'

// Common 'subclass' for GraphInner, GraphGroup, GraphCanvas
export class GraphContainer extends GraphConnectable {
  ALLOWED_DEFAULTS = Object.freeze(['edgecolor', 'groupcolor', 'vertexcolor', 'vertextextcolor', 'edgetextcolor'])

  /**
   * "Private" (uh..there's no reliable overarching privacy support in ES/node/browser space), indicate with _
   */
  _OBJECTS: GraphConnectable[] = []
  /**
   * This holds vertices that have no incoming edges (no edge has this vertex as right hand side)
   *
   * In theory, these nodes should be ROOT nodes in the tree!
   *
   * Some graphs are happy with it, some may be limited to single root node
   *
   * One could also imagine this being list of sub trees in a way
   * GraphContainer | GraphVertex
   */
  _ROOTVERTICES: GraphConnectable[] = []
  private equal: GraphConnectable[] = []

  constructor(name: string) {
    super(name)
  }

  /**
   * Save EQUAL vertex ranking
   * (or Connectable? Ever? Will dotty know to equalize groups?)
   */
  setEqual(value: GraphVertex[]) {
    this.equal = value
    return this
  }

  getEqual() {
    return this.equal
  }

  /**
   *  If true, allow all GraphReferences also, else skip all GraphReferences
   */
  getObjects(allowReferences: boolean = false) {
    return this._OBJECTS.filter(p => allowReferences || !(p instanceof GraphReference)) // OK
  }

  isEmpty(allowReferences: boolean = false) {
    return this.getObjects(allowReferences).length === 0
  }

  getFirstObject(allowReferences: boolean = false) {
    return this.getObjects(allowReferences)[0]
  }

  /**
   * Add object to this container
   */
  addObject(connectable: GraphConnectable) {
    this._OBJECTS.push(connectable)
    this._ROOTVERTICES.push(connectable)
    return connectable
  }
};
