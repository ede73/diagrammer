// @ts-check

/**
 * Represents a container
 */
class Group extends GraphObject {
    /** @param {string} name */
    constructor(name) {
        super(undefined); // TODO:
        /** @type {string} */
        this.name = name;
        /** @type {GraphObject[]} */
        this.OBJECTS = [];
        /** @type {GraphObject[]} */
        this.ROOTNODES = [];
        /** @type {Node[]} */
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
     * @param {Node[]} value
     * @return {Group}
     */
    setEqual(value) {
        this.equal = value;
        return this;
    }

    /**
     * @return {Node[]}
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
        // @ts-ignore
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