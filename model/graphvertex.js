//@ts-check
/**
 * Represents a Vertex in a visualization
 *
 * @param name Name of the vertex
 * @param [shape] Optional shape for the vertex, if not give, will default to what ever default is being used at the moment
 * @constructor
 */
class GraphVertex extends GraphObject {
    constructor(name, shape) {
        super(undefined); // TODO:
        /** @type {string} */
        this.name = name;
        /** @type {string} */
        this.shape = shape;
        /** @type {string} */
        this.image = undefined;
        /** @type {string} */
        this.style = undefined;
        // UH... this is used in grammar parser to TEMPORARILY store edge object
        /** @type {string} */
        this.edgelabel = undefined;
    }

    /**
     * @param {string} value 
     * @returns {GraphVertex}
     */
    setShape(value) {
        if (value) {
            this.shape = value.toLowerCase();
        }
        return this;
    }

    getShape() {
        return this.shape;
    }

    /**
     * Temporary for RHS list array!!
     * @param {string} value 
     * @returns {GraphVertex}
     */
    setEdgeLabel(value) {
        this.edgelabel = value;
        return this;
    }

    getEdgeLabel() {
        const tmp = this.edgelabel;
        // TODO: Uhoh, makes no sense! Move away to generator if needed
        /*
        Resetting edge label breaks:
          a>"A2B"b,"A2C"c
          r>"R2C"c

          where edge a>b is named A2B, a>c A2c
          and r>c R2C
        */
        this.edgelabel = undefined;
        return tmp;
    }

    /**
     * @param {string} value 
     * @returns {GraphVertex}
     */
    setStyle(value) {
        if (value) {
            this.style = value.toLowerCase();
        }
        return this;
    }

    getStyle() {
        return this.style;
    }

    /**
     * @param {string} value 
     * @returns {GraphVertex}
     */
    setImage(value) {
        if (value) {
            this.image = value;
        }
        return this;
    }

    getImage() {
        return this.image;
    }

    toString() {
        let fmt = "";
        if (this.color)
            fmt += ",color: " + this.color;
        if (this.label)
            fmt += ",label: " + this.label;
        return "Vertex(name:" + this.getName() + fmt + ")";
    }
};