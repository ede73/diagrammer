import { GraphObject } from '../model/graphobject.js';
import { GraphConnectable } from './graphconnectable.js';
import { GraphVertex } from './graphvertex.js';

// Common 'subclass' for GraphInner, GraphGroup, GraphCanvas
export class GraphContainer extends GraphConnectable {
    ALLOWED_DEFAULTS = Object.freeze(['edgecolor', 'groupcolor', 'vertexcolor', 'vertextextcolor', 'edgetextcolor']);

    /** @param {string} name */
    constructor(name) {
        super(undefined); // TODO:

        /**
         * GraphContainer | GraphVertex
         *  @type {GraphConnectable[]}
         */
        this.OBJECTS = [];
        /**
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
