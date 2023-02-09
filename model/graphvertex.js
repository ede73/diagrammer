//@ts-check
import { GraphConnectable } from './graphconnectable.js';

/**
 * Represents a Vertex in a visualization
 *
 * @param name Name of the vertex
 * @param [shape] Optional shape for the vertex, if not give, will default to what ever default is being used at the moment
 * @constructor
 */
export class GraphVertex extends GraphConnectable {
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
