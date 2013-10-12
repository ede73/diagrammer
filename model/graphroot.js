GraphRoot.prototype = new GraphObject();
GraphRoot.prototype.constructor = GraphRoot;

/**
 * Create a new graph root
 * @constructor
 */
function GraphRoot() {
    this.OBJECTS = [];
    this.setGenerator = function (value) {
        if (value) value = value.toLowerCase();
        return setAttr(this, 'generator', value);
    };
    this.getGenerator = function () {
        return getAttr(this, 'generator');
    };
    this.setVisualizer = function (value) {
        if (value) value = value.toLowerCase();
        return setAttr(this, 'visualizer', value);
    };
    this.getVisualizer = function () {
        return getAttr(this, 'visualizer');
    };
    this.setCurrentShape = function (value) {
        if (value) value = value.toLowerCase();
        return setAttr(this, 'shape', value);
    };
    this.getCurrentShape = function () {
        return getAttr(this, 'shape');
    };
    this.setDirection = function (value) {
        return setAttr(this, 'direction', value);
    };
    this.getDirection = function () {
        return getAttr(this, 'direction');
    };
    this.setStart = function (value) {
        return setAttr(this, 'start', value);
    };
    this.getStart = function () {
        return getAttr(this, 'start');
    };
    // Save EQUAL node ranking
    this.setEqual = function (value) {
        return setAttr(this, 'equal', value);
    };
    this.getEqual = function () {
        return getAttr(this, 'equal');
    };
    /**
     * Set default nodecolor, groupcolor, linkcolor Always ask from the
     * currentContainer first
     */
    this.setDefault = function (key, value) {
        debug("Set ROOT " + key + " to " + value);
        return setAttr(this, key, value);
    };
    this.getDefault = function (key) {
        // debug("Get ROOT "+key);
        return getAttr(this, key);
    };
    this.toString = function () {
        return "GraphRoot";
    };
}
