//@ts-check
/**
 * Create a new container SubGraph
 * @param name Name of the container
 * @constructor
 */
class SubGraph extends Group {
    /** @param {string} name */
    constructor(name) {
        super(undefined); // TODO:
        /** @type {string} */
        this.name = name;
        /** @type {GraphObject[]} */
        this.OBJECTS = [];
        /** @type {GraphObject[]} */
        this.ROOTVERTICES = [];
        /** @type {boolean} */
        this.isSubGraph = true;
        /** @type {string} */
        this.entrance = undefined;
        /** @type {string} */
        this.exit = undefined;
    }

    /**
     * temporary for RHS list array!!
     * @param {string} value
     * @return {SubGraph}
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
     * @param {string} exit Exit vertex name
     * @return {SubGraph}
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
