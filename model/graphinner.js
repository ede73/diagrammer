//@ts-check
import { GraphObject } from '../model/graphobject.js';
import { GraphGroup } from '../model/graphgroup.js';
import { debug } from '../model/support.js';

/**
 * An inner graph, where outside is linked to all the Vertices in side, like
 * outerVertex > ( LinkedToInnerVertex AndThese>Inner>VerticesAlso)
 * @param name Name of the container
 * @constructor
 */
export class GraphInner extends GraphGroup {
    /** @param {string} name */
    constructor(name) {
        super(undefined); // TODO:
        /** @type {string} */
        this.name = name;
        /** @type {GraphObject[]} */
        this.OBJECTS = [];
        /**
         * Never an GraphEdge though
         * @type {GraphObject[]}
         */
        this.ROOTVERTICES = [];
        /** @type {boolean} */
        this.isInnerGraph = true;
        /** @type {GraphObject} */ // TODO: Definitely not a string
        this.entrance = undefined;
        /** @type {GraphObject} */
        this.exit = undefined;
    }

    /**
     * temporary for RHS list array!!
     * @param {string} value
     * @return {GraphInner}
     */
    setEdgeLabel(value) {
        this.edgelabel = value;
        return this;
    }

    /**
     * @return {string}
     */
    getEdgeLabel() {
        return this.edgelabel;
    }

    /**
     * @param {GraphObject} entrance
     * @return {*}
     */
    setEntrance(entrance) {
        debug("subgraph:Set entrance to " + entrance);
        this.entrance = entrance;
        return this;
    }

    /**
     * @return {*}
     */
    getEntrance() {
        return this.entrance;
    }

    /**
     * @param {GraphObject} exit Exit vertex name
     * @return {GraphInner}
     */
    setExit(exit) {
        debug("subgraph:Set exit to " + exit);
        this.exit = exit;
        return this;
    }

    /**
     * @return {*}
     */
    getExit() {
        return this.exit;
    }

    toString() {
        let fmt = "";
        if (this.edgelabel)
            fmt += ",edgelabel:" + this.edgelabel;
        if (this.entrance)
            fmt += ",entrance:" + this.entrance;

        if (this.exit)
            fmt += ",exit:" + this.exit;
        if (this.ROOTVERTICES)
            fmt += ",rootvertices:" + this.ROOTVERTICES;
        return "SubGraph(name:" + this.name + fmt + ")";
    };
};
