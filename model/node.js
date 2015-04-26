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
        $tmp = getAttr(this, 'linklabel');
        setAttr(this, 'linklabel', undefined);
        return $tmp;
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
	var fmt = "";
	var tmp = getAttrFmt(this, 'color');
	if (tmp !== undefined && tmp!='')
	    fmt += ",color: " + tmp;
	tmp = getAttrFmt(this, 'label');
	if (tmp !== undefined && tmp!='')
	    fmt += ",label: " + tmp;
        return "Node(name:" + this.getName() +fmt+ ")";
    };
}
