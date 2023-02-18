// @ts-check
// Used for typechecking
// eslint-disable-next-line no-unused-vars
import { GraphCanvas } from '../model/graphcanvas.js'
// eslint-disable-next-line no-unused-vars
import { GraphEdge } from '../model/graphedge.js'
// eslint-disable-next-line no-unused-vars
import { GraphObject } from '../model/graphobject.js'

/** @type {number} */
let debugIndent = 0
/**
 * DEBUG: Set to true to see debug messages
 *  @type {boolean}
 */
let VERBOSE

/**
 * Pass debug messages
 * @param {(string|boolean)} msg Message
 * @param {(boolean|any)} indentOrDedent whether to indent or dedent
 */
export function debug (msg, indentOrDedent = undefined) {
  if (VERBOSE === true && msg !== false && msg !== true) {
    let d = ''
    for (let i = 0; i < debugIndent; i++) d += '    '
    console.log(d + msg + '//')
  }
  if (indentOrDedent === true || msg === true) {
    debugIndent++
  } else if (indentOrDedent === false || msg === false) {
    debugIndent--
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
export function setAttr (cl, attr, value) {
  cl[attr] = value
  return cl
}

/**
 * Create a string formatter.
 * Format string according to format rules with positional arguments like xxx={0} yyy={1}
 * @returns {string}
 */
// @ts-ignore
// eslint-disable-next-line no-extend-native
String.prototype.format = function () {
  let formatted = this
  for (const arg in arguments) {
    formatted = formatted.replace(`{${arg}}`, arguments[arg])
  }
  // @ts-ignore
  return formatted
}

/**
 * Format a string with provided array of values
 * For example. "{2}{0}{1}".formatArray([2,3,1]) prints 123
 *
 * @param {Array} array
 * @returns {string} Formatted string
 */
// @ts-ignore
// eslint-disable-next-line no-extend-native
String.prototype.formatArray = function (array) {
  let formatted = this
  for (let i = 0; i < array.length; i++) {
    formatted = formatted.replace(`{${i}}`, array[i])
  }
  // @ts-ignore
  return formatted
}

/**
 * Return attribute like prefix="ATTRHERE" with padding at both sides or "" if 0
 * or undefined
 * @param {GraphObject} cl Object to scan
 * @param {string} attr Name of the attribute index to return
 * @return {string} Return the attribute
 */
export function getAttribute (cl, attr) {
  if (!cl[attr] || cl[attr] === 0) { return undefined }
  return cl[attr]
}

/**
 * Return formatted attribute value
 *
 * @param {GraphObject} cl Object to scan thru
 * @param {(string|Array)} attr Name of the attribute to return
 * @param {string} fmt Format string to apply to returned variable (optional), example: fillcolor="{0}"
 * @param {Array} [resultarray] If given, in addition for returning, will PUSH the result to this array
 * @returns {string} (possibly formatted) value of the attribute or "" if attribute not found
 */
export function getAttributeAndFormat (cl, attr, fmt, resultarray) {
  if (attr instanceof Array) {
    for (const i in attr) {
      if (!Object.prototype.hasOwnProperty.call(attr, i)) continue
      const tmp = getAttributeAndFormat(cl, attr[i], fmt, resultarray)
      if (tmp !== '') {
        debug(`Return ${tmp}`)
        return tmp
      }
    }
    return ''
  }
  if (!cl[attr] || cl[attr] === 0) {
    return ''
  }
  // @ts-ignore
  const tmp = fmt.format(cl[attr])
  if (resultarray) { resultarray.push(tmp) }
  return ` ${tmp} `
}

let indentLevel = 0

/**
 * Output given string, potentially indenting or dedenting
 * @param {(boolean|GraphCanvas)} graphcanvas
 * @param {(string|boolean)} txt Text to output
 * @param {boolean} [indentOrDedent] whether to indent to dedent, OPTIONAL. true will LATENTLY increase the indent, flase will do that BEFORE the output is processed
 */
export function output (graphcanvas, txt, indentOrDedent = undefined) {
  let prefix = ''
  if (indentOrDedent === false || graphcanvas === false || txt === false) {
    if (indentLevel === 0) {
      throw new Error('Dedenting beyond 0, check your intendation')
    }
    indentLevel--
  }
  if (txt !== true && txt !== false && graphcanvas !== true && graphcanvas !== false) {
    for (let i = 0; i < indentLevel; i++) {
      prefix += '    '
    }
    graphcanvas.result(prefix + txt)
  }
  if (indentOrDedent === true || graphcanvas === true || txt === true) {
    indentLevel++
  }
}

/**
 * Send the text to the output, or format the array
 * @param {GraphCanvas} graphcanvas
 * @param {string} txt
 * @param {Array} [array] Optional array format
 */
export function outputFormattedText (graphcanvas, txt, array) {
  if (!array) {
    graphcanvas.result(txt)
  } else {
    // @ts-ignore
    graphcanvas.result(txt.formatArray(array))
  }
}

/**
 * Iterate edges
 * @param {GraphCanvas} graphcanvas
 */
export function * iterateEdges (graphcanvas) {
  for (const i in graphcanvas.EDGES) {
    if (!Object.prototype.hasOwnProperty.call(graphcanvas.EDGES, i)) continue
    /** @type {GraphEdge} */
    const foolTypeChecker = graphcanvas.EDGES[i]
    yield foolTypeChecker
  }
}
