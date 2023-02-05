/**
 * Create a new generic graph object
 * @param [label] Optional label
 * @constructor
 */
class GraphObject {
    constructor(label) {
        this.label = label;
    }
    setName(value) {
        if (value === undefined)
            return this;
        return setAttr(this, 'name', value);
    }
    getName() {
        return getAttr(this, 'name');
    }
    setColor(value) {
        if (value === undefined)
            return this;
        return setAttr(this, 'color', value);
    }
    getColor() {
        return getAttr(this, 'color');
    }
    setTextColor(value) {
        if (value === undefined)
            return this;
        return setAttr(this, 'textcolor', value);
    }
    //noinspection JSUnusedGlobalSymbols
    getTextColor() {
        return getAttr(this, 'textcolor');
    }
    setUrl(value) {
        if (value === undefined)
            return this;
        return setAttr(this, 'url', value);
    }
    //noinspection JSUnusedGlobalSymbols
    getUrl() {
        return getAttr(this, 'url');
    }
    setLabel(value) {
        if (!value)
            return this;
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
        return setAttr(this, 'label', value);
    }
    getLabel() {
        return getAttr(this, 'label');
    }
    toString() {
        return "GraphObject";
    }
};