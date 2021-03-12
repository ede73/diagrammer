/**
 * Create a new generic graph object
 * @param [label] Optional label
 * @constructor
 */
function GraphObject(label) {
    this.setName = function (value) {
        if (value === undefined) return this;
        return setAttr(this, 'name', value);
    };
    this.getName = function () {
        return getAttr(this, 'name');
    };
    this.setColor = function (value) {
        if (value === undefined) return this;
        return setAttr(this, 'color', value);
    };
    this.getColor = function () {
        return getAttr(this, 'color');
    };
    this.setTextColor = function (value) {
        if (value === undefined) return this;
        return setAttr(this, 'textcolor', value);
    };
    //noinspection JSUnusedGlobalSymbols
    this.getTextColor = function () {
        return getAttr(this, 'textcolor');
    };
    this.setUrl = function (value) {
        if (value === undefined) return this;
        return setAttr(this, 'url', value);
    };
    //noinspection JSUnusedGlobalSymbols
    this.getUrl = function () {
        return getAttr(this, 'url');
    };
    this.label = label;
    this.setLabel = function (value) {
        if (!value) return this;
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
    };
    this.getLabel = function () {
        return getAttr(this, 'label');
    };
    this.toString = function () {
        return "GraphObject";
    };
}
