import { GraphObject } from "../model/graphobject.js";

/**
 * Represents an entity that can be connected to/from/between by GraphEdge
 * (ie. Vertex, Group, InnerGroup)
 */
export class GraphConnectable extends GraphObject {
    /**
     * @param {string} name 
     */
    constructor(name) {
        super(name); // TODO:
        /**
         * Internal flag for no edge objects.
         * @type {boolean}
         */
        this.noedges = undefined;
        // UH... this is used in grammar parser to TEMPORARILY store edge object
        /** @type {string} */
        this.edgelabel = undefined;
    }

    /**
     * Temporary for RHS list array!!
     * @param {string} edgeLabel 
     */
    setEdgeLabel(edgeLabel) {
        this.edgelabel = edgeLabel;
        return this;
    }

    getEdgeLabel() {
        const tmp = this.edgelabel;
        // TODO: Uhoh, makes no sense! Move away to generator if needed
        /*
        Resetting edge label breaks:
          a>"A2B"b,"A2C"c
          r>"R2C"c

          where edge a>b is named A2B, a>c A2c
          and r>c R2C
        */
        this.edgelabel = undefined;
        return tmp;
    }
};
