/**
 * Simple debugger, uses console.log
 */
function debug(msg) {
    if (VERBOSE == true)
        console.log(msg);
}
/**
 * Set attribute of an object
 *
 * @param cl Object
 * @param attr Attribute name
 * @param value Value
 * @returns Object itself(cl)
 */
function setAttr(cl, attr, value) {
    cl[attr] = value;
    return cl;
}

/**
 * Create string formatter. Format string according to format rules with positional arguments like xxx={0} yyy={1}
 * @returns {String}
 */
String.prototype.format = function () {
    var formatted = this;
    for (var arg in arguments) {
        formatted = formatted.replace("{" + arg + "}", arguments[arg]);
    }
    return formatted;
};
/**
 * Return attribute like prefix="ATTRHERE" with padding at both sides or "" if 0
 * or undefined
 * @param cl Object to scan
 * @param attr Name of the attribute index to return
 */
function getAttr(cl, attr) {
    if (cl[attr] === undefined || cl[attr] == 0)
        return undefined;
    return cl[attr];
}

/**
 * Return formatted attribute value
 *
 * @param cl Object to scan thru
 * @param attr Name of the attribute to return
 * @param fmt Format string to apply to returned variable (optional), example: fillcolor="{0}"
 * @param [resultarray] If given, in addition for returning, will PUSH the result to this array
 * @returns (possibly formatted) value of the attribute or "" if attribute not found
 */
function getAttrFmt(cl, attr, fmt, resultarray) {
    var tmp;
    if (attr instanceof Array) {
        for (var i in attr) {
            if (!attr.hasOwnProperty(i))continue;
            // debug("Get FMT attr "+attr[i]+" from "+cl);
            tmp = getAttrFmt(cl, attr[i], fmt, resultarray);
            if (tmp !== "") {
                debug("Return " + tmp);
                return tmp;
            }
        }
        return "";
    }
    if (cl[attr] == undefined || cl[attr] == 0)
        return "";
    tmp = fmt.format(cl[attr]);
    if (resultarray)
        resultarray.push(tmp);
    return " " + tmp + " ";
}
