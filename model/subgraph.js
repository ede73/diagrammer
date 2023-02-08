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
        this.ROOTNODES = [];
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
    setLinkLabel(value) {
        this.linklabel = value;
        return this;
    }

    /**
     * @return {string}
     */
    getLinkLabel() {
        return this.linklabel;
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
     * @param {string} exit Exit node name
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
        if (this.linklabel)
            fmt += ",linklabel:" + this.linklabel;
        if (this.entrance)
            fmt += ",entrance:" + this.entrance;

        if (this.exit)
            fmt += ",exit:" + this.exit;
        if (this.ROOTNODES)
            fmt += ",rootnodes:" + this.ROOTNODES;
        return "SubGraph(name:" + this.name + fmt + ")";
    };
};
