/**
 * Create a new container SubGraph
 * @param name Name of the container
 * @constructor
 */
class SubGraph extends Group {
    constructor(name) {
        super();
        this.name = name;
        this.OBJECTS = [];
        this.ROOTNODES = [];
        this.isSubGraph = true;
        this.entrance = undefined;
        this.exit = undefined;
    }
    // temporary for RHS list array!!
    setLinkLabel(value) {
        this.linklabel = value;
        return this;
    }
    getLinkLabel() {
        return this.linklabel;
    }
    /**
     * Set default nodecolor, groupcolor, linkcolor Always ask from the
     * currentContainer first
     */
    setDefault(key, value) {
        //debug("Set SubGraph " + key + " to " + value);
        return setAttr(this, key, value);
    }
    setEntrance(entrance) {
        debug("subgraph:Set entrance to " + entrance);
        this.entrance = entrance;
        return this;
    }
    getEntrance() {
        return this.entrance;
    }
    setExit(exit) {
        debug("subgraph:Set exit to " + exit);
        this.exit = exit;
        return this;
    }
    getExit() {
        return this.exit;
    }
    getDefault(key) {
        //debug("subgrah:Get SubGraph " + key);
        return getAttr(this, key);
    }
    toString() {
        var fmt = "";
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
