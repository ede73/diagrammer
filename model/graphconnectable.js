import { GraphObject } from '../model/graphobject.js'

/**
 * Represents an entity that can be connected to/from/between by GraphEdge
 * (ie. Vertex, Group, InnerGroup)
 */
export class GraphConnectable extends GraphObject {
  /**
   * @param {string} name
   */
  constructor (name) {
    super(name)
    /**
     * TODO: Internal flag for no edge objects. Looks like originally used only for Vertices and
     * also ONLY set for Vertices (even if reset for all Connectables).
     * @type {boolean}
     */
    this._noedges = undefined
    // UH... this is used in grammar parser to TEMPORARILY store edge object
    /** @type {string} */
    this._edgelabel = undefined
  }

  /**
   * Temporary for RHS list array!!
   * @param {string} edgeLabel
   */
  _setEdgeLabel (edgeLabel) {
    this._edgelabel = edgeLabel
    return this
  }

  _getEdgeLabel () {
    const tmp = this._edgelabel
    // TODO: Uhoh, makes no sense! Move away to generator if needed
    /*
        Resetting edge label breaks:
          a>"A2B"b,"A2C"c
          r>"R2C"c

          where edge a>b is named A2B, a>c A2c
          and r>c R2C
        */
    this._edgelabel = undefined
    return tmp
  }
};
