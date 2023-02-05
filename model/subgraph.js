/**
 * Create a new container SubGraph
 * @param name Name of the container
 * @constructor
 */
class SubGraph extends Group{
    constructor(name) {
        super();
        this.name = name;
        this.OBJECTS = [];
        this.ROOTNODES = [];
        this.isSubGraph = true;
    }
    // temporary for RHS list array!!
    setLinkLabel(value) {
        return setAttr(this, 'linklabel', value);
    }
    getLinkLabel() {
        return getAttr(this, 'linklabel');
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
        return setAttr(this, 'entrance', entrance);
    }
    getEntrance() {
        return getAttr(this, 'entrance');
    }
    setExit(exit) {
        debug("subgraph:Set exit to " + exit);
        return setAttr(this, 'exit', exit);
    }
    getExit() {
        return getAttr(this, 'exit');
    }
    getDefault(key) {
        //debug("subgrah:Get SubGraph " + key);
        return getAttr(this, key);
    }
    toString() {
        var fmt = "";
        if (this.linklabel !== undefined && this.linklabel != '')
            fmt += ",linklabel:" + this.linklabel;
        if (this.entrance !== undefined)
            fmt += ",entrance:" + this.entrance;

        if (this.exit !== undefined)
            fmt += ",exit:" + this.exit;
        if (this.ROOTNODES !== undefined)
            fmt += ",rootnodes:" + this.ROOTNODES;
        return "SubGraph(name:" + this.name + fmt + ")";
    };
};
