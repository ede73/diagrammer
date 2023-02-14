import { GraphConnectable } from './graphconnectable.js';
import { GraphVertex } from './graphvertex.js';

// Common 'subclass' for GraphInner, GraphGroup, GraphCanvas
export class GraphContainer extends GraphConnectable {
    ALLOWED_DEFAULTS = Object.freeze(['edgecolor', 'groupcolor', 'vertexcolor', 'vertextextcolor', 'edgetextcolor']);

    /** @param {string} name */
    constructor(name) {
        super(name); // TODO:

        /**
         * GraphContainer | GraphVertex
         *  @type {GraphConnectable[]}
         */
        this.OBJECTS = [];
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
        this.ROOTVERTICES = [];
        /** @type {GraphConnectable[]} */
        this.equal = [];
    }

    /**
     * Save EQUAL vertex ranking
     * (or Connectable? Ever? Will dotty know to equalize groups?)
     * @param {GraphVertex[]} value
     */
    setEqual(value) {
        this.equal = value;
        return this;
    }

    getEqual() {
        return this.equal;
    }
};
