import { GraphObject } from '../model/graphobject.js';
import { GraphVertex } from './graphvertex.js';

// Common 'subclass' for GraphInner, GraphGroup, GraphCanvas
export class GraphContainer extends GraphObject {
    /** @param {string} name */
    constructor(name) {
        super(undefined); // TODO:

        /**
         * GraphContainer | GraphVertex
         *  @type {(GraphVertex|GraphContainer)[]}
         */
        this.OBJECTS = [];
        /**
         * GraphContainer | GraphVertex
         * @type {(GraphVertex|GraphContainer)[]}
         */
        this.ROOTVERTICES = [];
    }
};
