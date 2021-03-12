Group.prototype = new GraphObject();
Group.prototype.constructor = Group;

/**
 * Create a new container group
 * @param name Name of the container
 * @constructor
 */
function Group(name) {
    this.name = name;
    this.OBJECTS = [];
    this.ROOTNODES = [];
    // Save EQUAL node ranking
    this.setEqual = function (value) {
        return setAttr(this, 'equal', value);
    };
    this.getEqual = function () {
        return getAttr(this, 'equal');
    };
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
        debug("group:Set group " + key + " to " + value);
        return setAttr(this, key, value);
    };
    this.getDefault = function (key) {
        debug("group:Get group " + key);
        return getAttr(this, key);
    };
    this.toString = function () {
        return "group:Group(" + this.name + ")";
    };
}
