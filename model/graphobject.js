// @ts-check 
/**
 * GraphObject: Anything that is represented in a graph (diagram/visualization)
 */
export class GraphObject {
    /**
     * Name of the object. Exception being edges, they don't have names
     * 
     * @param {string} name
     */
    constructor(name) {
        /**
         * Every object in a graph have a name
         * That's how it can get linked.
         * "name" for display purposes may be a label instead
         * @type {string}
         */
        this.name = name;
        /**
         * If provided, this will be used as visual name
         * @type {string}
         */
        this.label = undefined;
        /**
         * Main color for this object
         * @type {string}
         */
        this.color = undefined;
        /**
         * Color for any text rendered for this object
         * @type {string}
         */
        this.textcolor = undefined;
        /**
         * External link (only works for dynamic visualizations like SVG)
         * @type {string}
         */
        this.url = undefined;
    }

    /**
     * Set the name for the object
     * @param {string} name 
     */
    setName(name) {
        // TODO: Something odd in the parser
        if (name) {
            this.name = name;
        }
        return this;
    }

    getName() {
        return this.name;
    }

    /**
     * Set color
     * @param {string} color 
     */
    setColor(color) {
        // TODO: Something odd in the parser
        if (color) {
            this.color = color;
        }
        return this;
    }

    getColor() {
        return this.color;
    }

    /**
     * Set text color
     * @param {string} textColor 
     */
    setTextColor(textColor) {
        this.textcolor = textColor;
        return this;
    }

    getTextColor() {
        return this.textcolor;
    }

    /**
     * Set URL
     * @param {string} url 
     */
    setUrl(url) {
        this.url = url;
        return this;
    }

    getUrl() {
        return this.url;
    }

    /**
     * Set label. Label is a complex object that will be parsed and parts of it
     * extracted to textColor and potentially URL
     * @param {string} label 
     */
    setLabel(label) {
        if (label) {
            label = label.trim().replace(/"/gi, "");
            //Take out COLOR if preset
            let m = label.match(/^(#[A-Fa-f0-9]{6,6})(.*)$/);
            // debug(m);
            if (m !== null && m.length == 3) {
                this.setTextColor(m[1]);
                label = m[2].trim();
            }
            m = label.match(/\[([^\]]+)\](.*)$/);
            if (m !== null && m.length >= 3) {
                this.setUrl(m[1]);
                label = m[2].trim();
            }
        }
        this.label = label;
        return this;
    }

    getLabel() {
        return this.label;
    }

    toString() {
        return "GraphObject";
    }
};
