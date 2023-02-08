debugIndent = 0;

/**
 * Simple debugger, uses console.log
 * @param {string} msg Message
 * @param {boolean} indentOrDedent whether to indent or dedent
 */
function debug(msg, indentOrDedent) {
    if (VERBOSE == true && msg !== false && msg !== true) {
        var d = "";
        for (var i = 0; i < debugIndent; i++) d += "    ";
        console.log(d + msg);
    }
    if (indentOrDedent === true || msg === true) {
        debugIndent++;
    } else if (indentOrDedent === false || msg === false) {
        debugIndent--;
    }
}

/**
 * Set attribute of an object
 *
 * @param {GraphObject} cl Object
 * @param {string} attr Attribute name
 * @param {any} value Value
 * @returns {GraphObject} Object itself(cl)
 */
function setAttr(cl, attr, value) {
    cl[attr] = value;
    return cl;
}

/**
 * Create string formatter. Format string according to format rules with positional arguments like xxx={0} yyy={1}
 * @returns {string}
 */
String.prototype.format = function () {
    var formatted = this;
    for (const arg in arguments) {
        formatted = formatted.replace("{" + arg + "}", arguments[arg]);
    }
    return formatted;
};

/**
 * Format a string with provided array of values
 * For example. "{2}{0}{1}".formatArray([2,3,1]) prints 123
 * 
 * @param {Array[any]} array 
 * @returns {string} Formatted string
 */
String.prototype.formatArray = function (array) {
    let formatted = this;
    for (let i = 0; i < array.length; i++) {
        formatted = formatted.replace("{" + i + "}", array[i]);
    }
    return formatted;
};

/**
 * Return attribute like prefix="ATTRHERE" with padding at both sides or "" if 0
 * or undefined
 * @param {GraphObject} cl Object to scan
 * @param {string} attr Name of the attribute index to return
 * @return {string} Return the attribute
 */
function getAttr(cl, attr) {
    if (!cl[attr] || cl[attr] == 0)
        return undefined;
    return cl[attr];
}

/**
 * Return formatted attribute value
 *
 * @param {GraphObject} cl Object to scan thru
 * @param {string} attr Name of the attribute to return
 * @param {string} fmt Format string to apply to returned variable (optional), example: fillcolor="{0}"
 * @param {Array[any]} [resultarray] If given, in addition for returning, will PUSH the result to this array
 * @returns {string} (possibly formatted) value of the attribute or "" if attribute not found
 */
function getAttrFmt(cl, attr, fmt, resultarray) {
    if (attr instanceof Array) {
        for (const i in attr) {
            if (!attr.hasOwnProperty(i)) continue;
            // debug("Get FMT attr "+attr[i]+" from "+cl);
            const tmp = getAttrFmt(cl, attr[i], fmt, resultarray);
            if (tmp !== "") {
                debug("Return " + tmp);
                return tmp;
            }
        }
        return "";
    }
    if (!cl[attr] || cl[attr] == 0)
        return "";
    const tmp = fmt.format(cl[attr]);
    if (resultarray)
        resultarray.push(tmp);
    return " " + tmp + " ";
}

var indentLevel = 0;

/**
 * Output given string, potentially indenting or dedenting
 * @param {*} yy 
 * @param {string} txt Text to output
 * @param {boolean} [indentOrDedent] whether to indent to dedent, OPTIONAL
 */
function output(yy, txt, indentOrDedent=undefined) {
    let prefix = "";
    if (txt !== true && txt !== false && yy !== true && yy !== false) {
        for (let i = 0; i < indentLevel; i++) {
            prefix += "    ";
        }
        yy.result(prefix + txt);
    }
    if (indentOrDedent === true || yy === true || txt === true) {
        indentLevel++;
    } else if (indentOrDedent === false || yy === false || txt === false) {
        indentLevel--;
    }
}

/**
 * Send the text to the output, or format the array
 * @param {*} yy 
 * @param {string} txt 
 * @param {Array[any]} [array] Optional array format
 */
function outputFmt(yy, txt, array) {
    if (!array)
        yy.result(txt);
    else
        yy.result(txt.formatArray(array));
}

function* iterateLinks(yy) {
    for (const i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i)) continue;
        /** @type {Link} */
        let foolTypeChecker = yy.LINKS[i];
        yield foolTypeChecker;
    }
}
