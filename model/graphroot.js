/**
 * Create a new graph root
 * @constructor
 */
class GraphRoot extends GraphObject {
    constructor() {
        super()
        this.OBJECTS = [];
        this.ROOTNODES = [];
        this.generator = undefined;
        this.visualizer = undefined;
        this.shape = undefined;
        this.direction = undefined;
        this.start = undefined;
        this.equal = undefined;
    }
    setGenerator(value) {
        this.generator = value.toLowerCase();
        return this;
    }
    getGenerator() {
        return this.generator;
    }
    setVisualizer(value) {
        this.visualizer = value.toLowerCase();
        return this;
    }
    /* TODO: make meta.getVisualizer() */
    getVisualizer() {
        return this.visualizer;
    }
    setCurrentShape(value) {
        // value?.toLowerCase() not yet in node 12.29 (default in ubuntu)
        if (value)
            value = value.toLowerCase();
        this.shape = value;
        return this;
    }
    getCurrentShape() {
        return this.shape;
    }
    setDirection(value) {
        this.direction = value;
        return this;
    }
    /* TODO: make meta.getDirection() */
    getDirection() {
        return this.direction;
    }
    setStart(value) {
        this.start = value;
        return this;
    }
    /* TODO: make meta.getStart() */
    getStart() {
        return this.start;
    }
    // Save EQUAL node ranking
    setEqual(value) {
        this.equal = value;
        return this;
    }
    /* TODO: make meta.getEqual() */
    getEqual() {
        return this.equal;
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