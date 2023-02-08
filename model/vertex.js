//@ts-check
/**
 * Represents a Vertex in a visualization
 *
 * @param name Name of the vertex
 * @param [shape] Optional shape for the vertex, if not give, will default to what ever default is being used at the moment
 * @constructor
 */
class Vertex extends GraphObject {
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
        // UH... this is used in grammar parser to TEMPORARILY store link object
        /** @type {string} */
        this.linklabel = undefined;
    }

    /**
     * @param {string} value 
     * @returns {Vertex}
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
     * @returns {Vertex}
     */
    setLinkLabel(value) {
        this.linklabel = value;
        return this;
    }

    getLinkLabel() {
        const tmp = this.linklabel;
        // TODO: Uhoh, makes no sense! Move away to generator if needed
        /*
        Resetting link label breaks:
          a>"A2B"b,"A2C"c
          r>"R2C"c

          where link a>b is named A2B, a>c A2c
          and r>c R2C
        */
        this.linklabel = undefined;
        return tmp;
    }

    /**
     * @param {string} value 
     * @returns {Vertex}
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
     * @returns {Vertex}
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