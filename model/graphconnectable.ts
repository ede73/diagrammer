// @ts-check

import { GraphObject } from '../model/graphobject.js'

/**
 * Represents an entity that can be connected to/from/between by GraphEdge
 * (ie. Vertex, Group, InnerGroup)
 */
export class GraphConnectable extends GraphObject {
  // TODO: TypeScript doesn't allow quickly adding new members to objects, fix after TS conversion done(see plantuml_sequence/parsetree e.g.)
  id?: number = undefined
  // TODO: TypeScript doesn't allow quickly adding new members to objects, fix after TS conversion done(see plantuml_sequence/parsetree e.g.)
  active?: boolean = undefined
  /**
   * TODO: Internal flag for no edge objects. Looks like originally used only for Vertices and
   * also ONLY set for Vertices (even if reset for all Connectables).
   */
  _noedges?: boolean = undefined
  // UH... this is used in grammar parser to TEMPORARILY store edge object
  _edgelabel?: string = undefined

  constructor(name: string, parent?: any) {
    super(name, parent)
  }

  /**
   * Temporary for RHS list array!!
   */
  _setEdgeLabel(edgeLabel: string) {
    this._edgelabel = edgeLabel
    return this
  }

  _getEdgeLabel() {
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
