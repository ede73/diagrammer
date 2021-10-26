//SubGraph.prototype = new GraphObject();
SubGraph.prototype = new Group();
SubGraph.prototype.constructor = SubGraph;

/**
 * Create a new container SubGraph
 * @param name Name of the container
 * @constructor
 */
function SubGraph(name) {
    this.name = name;
    this.OBJECTS = [];
    this.ROOTNODES = [];
    this.isSubGraph = true;
    // temporary for RHS list array!!
    this.setLinkLabel = function (value) {
        return setAttr(this, 'linklabel', value);
    };
    this.getLinkLabel = function () {
        return getAttr(this, 'linklabel');
    };
    /**
     * Set default nodecolor, groupcolor, linkcolor Always ask from the
     * currentContainer first
     */
    this.setDefault = function (key, value) {
        //debug("Set SubGraph " + key + " to " + value);
        return setAttr(this, key, value);
    };
    this.setEntrance = function (entrance) {
        debug("subgraph:Set entrance to " + entrance);
        return setAttr(this, 'entrance', entrance);
    };
    this.getEntrance = function () {
        return getAttr(this, 'entrance');
    };
    this.setExit = function (exit) {
        debug("subgraph:Set exit to " + exit);
        return setAttr(this, 'exit', exit);
    };
    this.getExit = function () {
        return getAttr(this, 'exit');
    };
    this.getDefault = function (key) {
        //debug("subgrah:Get SubGraph " + key);
        return getAttr(this, key);
    };
    this.toString = function () {
        var fmt = "";
        if (this.linklabel !== undefined && this.linklabel != '') fmt += ",linklabel:" + this.linklabel;
        if (this.entrance !== undefined) fmt += ",entrance:" + this.entrance;

        if (this.exit !== undefined) fmt += ",exit:" + this.exit;
        if (this.ROOTNODES !== undefined) fmt += ",rootnodes:" + this.ROOTNODES;
        return "SubGraph(name:" + this.name + fmt + ")";
    };
}
