/**
 * Create a new container group
 * @param name Name of the container
 * @constructor
 */
class Group extends GraphObject {
    /** @param {string} name */
    constructor(name) {
        super();
        /** @type {string} */
        this.name = name;
        /** @type {Array[GraphObject]} */
        this.OBJECTS = [];
        /** @type {Array[GraphObject]} */
        this.ROOTNODES = [];
        /** @type {Array[string]} */
        this.equal = undefined;
        /** @type {string} */
        this.linklabel = undefined;
        /** @type {string} */
        this.exitnode = undefined;
        /** @type {string} */
        this.entrylink = undefined;
    }

    /**
     * Save EQUAL node ranking
     * @param {string} value
     * @return {Group}
     */
    setEqual(value) {
        this.equal = value;
        return this;
    }

    /**
     * @return {Array[string]}
     */
    getEqual() {
        return this.equal;
    }

    /**
     * Temporary for RHS list array!!
     * @param {string} value
     * @return {Group}
     */
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
     * @param {string} key
     * @param {any} value
     * @return {Group}
     */
    setDefault(key, value) {
        debug("group:Set group " + key + " to " + value);
        return setAttr(this, key, value);
    }

    /**
     * @param {string} key
     */
    getDefault(key) {
        debug("group:Get group " + key);
        return getAttr(this, key);
    }

    toString() {
        return "group:Group(" + this.name + ")";
    }
};