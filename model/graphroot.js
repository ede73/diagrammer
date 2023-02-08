// @ts-check 
/**
 * Create a new graph root.
 * 
 * Even if the TREE has multiple root vertices (or basically multiple trees)
 * the graph will only EVER have one GraphRoot
 * 
 */
class GraphRoot extends GraphObject {
    constructor() {
        super(undefined); // TODO:
        /** @type {GraphObject[]} */
        this.OBJECTS = [];
        /** @type {GraphObject[]} */
        this.ROOTVERTICES = [];
        // TODO: MOVING TO GraphMeta
        /** @type {string} */
        this.generator = undefined;
        // TODO: MOVING TO GraphMeta
        /** @type {string} */
        this.visualizer = undefined;
        /** @type {string} */
        this.shape = undefined;
        // TODO: MOVING TO GraphMeta
        /** @type {string} */
        this.direction = undefined;
        // TODO: MOVING TO GraphMeta
        /** @type {string} */
        this.start = undefined;
        /** @type {string[]} */
        this.equal = [];
    }

    // TODO: MOVING TO GraphMeta
    /**
     * @param {string} value
     * @return {GraphRoot}
     */
    setGenerator(value) {
        this.generator = value.toLowerCase();
        return this;
    }

    // TODO: MOVING TO GraphMeta
    getGenerator() {
        return this.generator;
    }

    // TODO: MOVING TO GraphMeta
    /**
     * @param {string} value
     * @return {GraphRoot}
     */
    setVisualizer(value) {
        this.visualizer = value.toLowerCase();
        return this;
    }

    // TODO: MOVING TO GraphMeta
    /* TODO: make meta.getVisualizer() */
    getVisualizer() {
        return this.visualizer;
    }

    /**
     * @param {string} value
     * @return {GraphRoot}
     */
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

    // TODO: MOVING TO GraphMeta
    /**
     * @param {string} value
     * @return {GraphRoot}
     */
    setDirection(value) {
        this.direction = value;
        return this;
    }

    // TODO: MOVING TO GraphMeta
    /* TODO: make meta.getDirection() */
    getDirection() {
        return this.direction;
    }

    // TODO: MOVING TO GraphMeta
    /**
     * @param {string} value
     * @return {GraphRoot}
     */
    setStart(value) {
        this.start = value;
        return this;
    }

    // TODO: MOVING TO GraphMeta
    /* TODO: make meta.getStart() */
    getStart() {
        return this.start;
    }

    // Save EQUAL vertex ranking
    /**
     * @param {string[]} value
     * @return {GraphRoot}
     */
    setEqual(value) {
        this.equal = value;
        return this;
    }

    /* TODO: make meta.getEqual() */
    /**
     * @return {string[]}
     */
    getEqual() {
        return this.equal;
    }

    /**
     * Set default vertexcolor, groupcolor, edgecolor Always ask from the
     * currentContainer first
     * @param {string} key
     * @param {any} value
     * @return {GraphRoot}
     */
    setDefault(key, value) {
        //debug("graphroot:Set ROOT " + key + " to " + value);
        // @ts-ignore
        return setAttr(this, key, value);
    }

    /**
     *  @param {string} key
     */
    getDefault(key) {
        // debug("graphroot:Get ROOT "+key);
        return getAttr(this, key);
    }

    toString() {
        return "GraphRoot";
    }
};
