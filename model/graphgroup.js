// @ts-check
import {GraphObject} from '../model/graphobject.js';
import {GraphVertex} from '../model/graphvertex.js';
import {setAttr, getAttribute, debug} from '../model/support.js';

/**
 * Represents a container
 */
export class GraphGroup extends GraphObject {
    /** @param {string} name */
    constructor(name) {
        super(undefined); // TODO:
        /** @type {string} */
        this.name = name;
        /** @type {GraphObject[]} */
        this.OBJECTS = [];
        /** @type {GraphObject[]} */
        this.ROOTVERTICES = [];
        /** @type {GraphVertex[]} */
        this.equal = undefined;
        /** @type {string} */
        this.edgelabel = undefined;
        /** @type {string} */
        this.exitvertex = undefined;
        /** @type {string} */
        this.entryedge = undefined;
    }

    /**
     * Save EQUAL vertex ranking
     * @param {GraphVertex[]} value
     * @return {GraphGroup}
     */
    setEqual(value) {
        this.equal = value;
        return this;
    }

    /**
     * @return {GraphVertex[]}
     */
    getEqual() {
        return this.equal;
    }

    /**
     * Temporary for RHS list array!!
     * @param {string} value
     * @return {GraphGroup}
     */
    setEdgeLabel(value) {
        this.edgelabel = value;
        return this;
    }

    getEdgeLabel() {
        return this.edgelabel;
    }

    /**
     * Set default vertexcolor, groupcolor, edgecolor Always ask from the
     * currentContainer first
     * @param {string} key
     * @param {any} value
     * @return {GraphGroup}
     */
    setDefault(key, value) {
        debug("group:Set group " + key + " to " + value);
        // @ts-ignore
        return setAttr(this, key, value);
    }

    /**
     * @param {string} key
     */
    getDefault(key) {
        debug("group:Get group " + key);
        return getAttribute(this, key);
    }

    toString() {
        return "group:Group(" + this.name + ")";
    }
};