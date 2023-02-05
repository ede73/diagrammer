/**
 * Create a new generic graph object
 * @param [label] Optional label
 * @constructor
 */
class GraphObject {
    constructor(label) {
        this.label = label;
        this.name = undefined;
        this.color = undefined;
        this.textcolor = undefined;
        this.url = undefined;
    }
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
    setTextColor(value) {
        this.textcolor = value;
        return this;
    }
    //noinspection JSUnusedGlobalSymbols
    getTextColor() {
        return this.textcolor;
    }
    setUrl(value) {
        this.url = value;
        return this;
    }
    //noinspection JSUnusedGlobalSymbols
    getUrl() {
        return this.url;
    }
    setLabel(value) {
        if (value) {
            value = value.trim().replace(/"/gi, "");
            //debug("graphobject:TEST value(" + value + ") for color");
            //Take out COLOR if preset
            var m = value.match(/^(#[A-Fa-f0-9]{6,6})(.*)$/);
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