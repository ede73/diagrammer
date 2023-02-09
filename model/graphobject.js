// @ts-check 
/**
 * GraphObject: Anything that is represented in a graph (diagram/visualization)
 */
export class GraphObject {
    /** @param {string} label */
    constructor(label) {
        /** @type {string} */
        this.label = label;
        /** @type {string} */
        this.name = undefined;
        /** @type {string} */
        this.color = undefined;
        /** @type {string} */
        this.textcolor = undefined;
        /** @type {string} */
        this.url = undefined;
        /**
         * Internal flag for no edge objects. Applies to all but Edges
         * (We'd need another abstraction between GraphObject and Inner/Vertex/Group (and Edges))
         * @type {boolean}
         */
        this.noedges = undefined;
    }

    /**
     * Set name
     * @param {string} value 
     * @returns {GraphObject}
     */
    setName(value) {
        // TODO: Something odd in the parser
        if (value) {
            this.name = value;
        }
        return this;
    }

    getName() {
        return this.name;
    }

    /**
     * Set color
     * @param {string} value 
     * @returns {GraphObject}
     */
    setColor(value) {
        // TODO: Something odd in the parser
        if (value) {
            this.color = value;
        }
        return this;
    }

    getColor() {
        return this.color;
    }

    /**
     * Set text color
     * @param {string} value 
     * @returns {GraphObject}
     */
    setTextColor(value) {
        this.textcolor = value;
        return this;
    }

    getTextColor() {
        return this.textcolor;
    }

    /**
     * Set URL
     * @param {string} value 
     * @returns {GraphObject}
     */
    setUrl(value) {
        this.url = value;
        return this;
    }

    getUrl() {
        return this.url;
    }

    /**
     * Set label
     * @param {string} value 
     * @returns {GraphObject}
     */
    setLabel(value) {
        if (value) {
            value = value.trim().replace(/"/gi, "");
            //debug("graphobject:TEST value(" + value + ") for color");
            //Take out COLOR if preset
            let m = value.match(/^(#[A-Fa-f0-9]{6,6})(.*)$/);
            // debug(m);
            if (m !== null && m.length == 3) {
                this.setTextColor(m[1]);
                value = m[2].trim();
            }
            m = value.match(/\[([^\]]+)\](.*)$/);
            if (m !== null && m.length >= 3) {
                this.setUrl(m[1]);
                value = m[2].trim();
            }
        }
        this.label = value;
        return this;
    }

    getLabel() {
        return this.label;
    }

    toString() {
        return "GraphObject";
    }
};
