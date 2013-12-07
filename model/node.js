Node.prototype = new GraphObject();
Node.prototype.constructor = Node;

/**
 * Construct a new node
 *
 * @param name Name of the node
 * @param [shape] Optional shape for the node, if not give, will default to what ever default is being used at the moment
 * @constructor
 */
function Node(name, shape) {
    this.name = name;
    this.shape = shape;
    this.image=undefined;
    this.style=undefined;
    this.setShape = function (value) {
        if (value === undefined) return this;
        if (value) value = value.toLowerCase();
        return setAttr(this, 'shape', value);
    };
    //noinspection JSUnusedGlobalSymbols
    this.getShape = function () {
        return getAttr(this, 'shape');
    };
    // temporary for RHS list array!!
    this.setLinkLabel = function (value) {
        return setAttr(this, 'linklabel', value);
    };
    this.getLinkLabel = function () {
        return getAttr(this, 'linklabel');
    };
    this.setStyle = function (value) {
        if (value === undefined) return this;
        if (value) value = value.toLowerCase();
        return setAttr(this, 'style', value);
    };
    //noinspection JSUnusedGlobalSymbols
    this.getStyle = function () {
        return getAttr(this, 'style');
    };
    this.setImage = function (value) {
        if (value === undefined) return this;
        return setAttr(this, 'image', value);
    };
    //noinspection JSUnusedGlobalSymbols
    this.getImage = function () {
        return getAttr(this, 'image');
    };
    this.toString = function () {
        return "Node(" + this.getName() + getAttrFmt(this, 'color', ',color={0}') + getAttrFmt(this, 'label', ',label={0}') + ")";
    };
}