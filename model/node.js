/**
 * Construct a new node
 *
 * @param name Name of the node
 * @param [shape] Optional shape for the node, if not give, will default to what ever default is being used at the moment
 * @constructor
 */
class Node extends GraphObject {
    constructor(name, shape) {
        super();
        this.name = name;
        this.shape = shape;
        this.image = undefined;
        this.style = undefined;
    }
    setShape(value) {
        if (value === undefined) return this;
        if (value) value = value.toLowerCase();
        return setAttr(this, 'shape', value);
    }
    //noinspection JSUnusedGlobalSymbols
    getShape() {
        return getAttr(this, 'shape');
    }
    // temporary for RHS list array!!
    setLinkLabel(value) {
        return setAttr(this, 'linklabel', value);
    }
    getLinkLabel() {
        var tmp = getAttr(this, 'linklabel'); //xx
        setAttr(this, 'linklabel', undefined);
        return tmp;
    }
    setStyle(value) {
        if (value === undefined) return this;
        if (value) value = value.toLowerCase();
        return setAttr(this, 'style', value);
    }
    //noinspection JSUnusedGlobalSymbols
    getStyle() {
        return getAttr(this, 'style');
    }
    setImage(value) {
        if (value === undefined) return this;
        return setAttr(this, 'image', value);
    }
    //noinspection JSUnusedGlobalSymbols
    getImage() {
        return getAttr(this, 'image');
    }
    toString() {
        var fmt = "";
        var tmp = getAttrFmt(this, 'color', '');
        if (tmp !== undefined && tmp != '')
            fmt += ",color: " + tmp;
        tmp = getAttrFmt(this, 'label', '');
        if (tmp !== undefined && tmp != '')
            fmt += ",label: " + tmp;
        return "Node(name:" + this.getName() + fmt + ")";
    }
};