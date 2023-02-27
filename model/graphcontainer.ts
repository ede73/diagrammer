// @ts-check

import { GraphConnectable } from './graphconnectable.js'
import { GraphReference } from './graphreference.js'
import { GraphVertex } from './graphvertex.js'
import { GraphObject } from './graphobject.js'
import { GraphEdge } from './graphedge.js'

export type ALLOWED_DEFAULTS = {
  edgecolor?: string,
  groupcolor?: string,
  vertexcolor?: string,
  vertextextcolor?: string,
  edgetextcolor?: string
}

export type DefaultSettingKey = keyof ALLOWED_DEFAULTS;

// Common 'subclass' for GraphInner, GraphGroup, GraphCanvas
export class GraphContainer extends GraphConnectable {
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
  defaults: ALLOWED_DEFAULTS = {}
  private equal: GraphConnectable[] = []
  protected _OBJECTS: GraphObject[] = []

  constructor(name: string, parent?: GraphContainer) {
    super(name, parent)
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
  getObjects(allowReferences: boolean = false): GraphConnectable[] {
    return this._OBJECTS.filter(p => (p instanceof GraphConnectable && (allowReferences || !(p instanceof GraphReference)))) as GraphConnectable[]// OK
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
    if (connectable instanceof GraphContainer) {
      return connectable
    }
    this._ROOTVERTICES.push(connectable)
    return connectable
  }

  /**
   * Set default vertexcolor, groupcolor, edgecolor Always ask from the
   * currentContainer first
   */
  setDefault(key: keyof ALLOWED_DEFAULTS, value: string) {
    //debug(`****Set defaylt attribute ${key}=${value} for container ${this.getName()}`)
    this.defaults[key] = value
  }

  getDefault(key: keyof ALLOWED_DEFAULTS) {
    if (this.defaults[key]) {
      return this.defaults[key]
    }
  }
};
