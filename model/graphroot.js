/**
 * Create a new graph root
 * @constructor
 */
class GraphRoot extends GraphObject {
    constructor() {
        super()
        this.OBJECTS = [];
        this.ROOTNODES = [];
    }
    setGenerator(value) {
        if (value)
            value = value.toLowerCase();
        return setAttr(this, 'generator', value);
    }
    getGenerator() {
        return getAttr(this, 'generator');
    }
    setVisualizer(value) {
        if (value)
            value = value.toLowerCase();
        return setAttr(this, 'visualizer', value);
    }
    /* TODO: make meta.getVisualizer() */
    getVisualizer() {
        return getAttr(this, 'visualizer');
    }
    setCurrentShape(value) {
        if (value)
            value = value.toLowerCase();
        return setAttr(this, 'shape', value);
    }
    getCurrentShape() {
        return getAttr(this, 'shape');
    }
    setDirection(value) {
        return setAttr(this, 'direction', value);
    }
    /* TODO: make meta.getDirection() */
    getDirection() {
        return getAttr(this, 'direction');
    }
    setStart(value) {
        return setAttr(this, 'start', value);
    }
    /* TODO: make meta.getStart() */
    getStart() {
        return getAttr(this, 'start');
    }
    // Save EQUAL node ranking
    setEqual(value) {
        return setAttr(this, 'equal', value);
    }
    /* TODO: make meta.getEqual() */
    getEqual() {
        return getAttr(this, 'equal');
    }
    /**
     * Set default nodecolor, groupcolor, linkcolor Always ask from the
     * currentContainer first
     */
    setDefault(key, value) {
        //debug("graphroot:Set ROOT " + key + " to " + value);
        return setAttr(this, key, value);
    }
    getDefault(key) {
        // debug("graphroot:Get ROOT "+key);
        return getAttr(this, key);
    }
    toString() {
        return "GraphRoot";
    }
};