/**
 * Create a new container group
 * @param name Name of the container
 * @constructor
 */
class Group extends GraphObject {
    constructor(name) {
        super();
        this.name = name;
        this.OBJECTS = [];
        this.ROOTNODES = [];
        this.equal = undefined;
        this.linklabel = undefined;
    }
    // Save EQUAL node ranking
    setEqual(value) {
        this.equal = value;
        return this;
    }
    getEqual() {
        return this.equal;
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
        debug("group:Set group " + key + " to " + value);
        return setAttr(this, key, value);
    }
    getDefault(key) {
        debug("group:Get group " + key);
        return getAttr(this, key);
    }
    toString() {
        return "group:Group(" + this.name + ")";
    }
};