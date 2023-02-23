// @ts-check
import { GraphCanvas } from '../model/graphcanvas.js'
import { GraphObject } from '../model/graphobject.js'

let debugIndent: number = 0
/**
 * DEBUG: Set to true to see debug messages
 */
let VERBOSE: boolean

/**
 * Toggle verbosity
 */
export function setVerbose(verbose: boolean) {
  VERBOSE = verbose
}

/**
 * Pass debug messages
 * @param indentOrDedent whether to indent or dedent
 */
export function debug(msg: (string | boolean), indentOrDedent?: (boolean)) {
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
 * TODO: See getAttr, make prop map
 * @param cl GraphObject (or any of its subclasses)
 * @param attr Attribute name
 * @param value Value
 * @returns Object itself(cl)
 */
export function setAttr(cl: GraphObject, attr: string, value: any) {
  Object.defineProperty(cl, attr, {
    value,
    // mimic pure JS obj[attr]=value (these both needed)
    writable: true,
    enumerable: true
  })
  //cl[attr] = value
  return cl
}

declare global {
  interface String {
    //format(): string;
    formatArray(array: any[]): string
  }
}

/**
 * Create a string formatter.
 * Format string according to format rules with positional arguments like xxx={0} zzz={1}
 */
// String.prototype.format = function () {
//   let formatted = this
//   for (const arg in arguments) {
//     formatted = formatted.replace(`{${arg}}`, arguments[arg])
//   }
//   return formatted
// }

/**
 * Format a string with provided array of values
 * For example. "{2}{0}{1}".formatArray([2,3,1]) prints 123
 */
String.prototype.formatArray = function (array: any[]) {
  let formatted = this
  for (let i = 0; i < array.length; i++) {
    formatted = formatted.replace(`{${i}}`, array[i])
  }
  return formatted
}

/**
 * Return attribute like prefix="ATTRHERE" with padding at both sides or "" if 0
 * or undefined
 * 
 * TODO: This is ugly, difficult to maintain, confusing in TypeScript. Make this a property map
 * 
 * @param cl GraphObject(or any of its subclasses) to scan
 * @param attr Name of the attribute index to return
 * @return Return the attribute
 */
export function getAttribute(cl: GraphObject, attr: string) {
  const obtained = Object.getOwnPropertyDescriptor(cl, attr);
  if (!obtained || !obtained.value || obtained.value === 0) { return undefined }
  return obtained?.value
}

/**
 * Return formatted attribute value
 *
 * @param cl Object to scan thru
 * @param attr Name of the attribute to return
 * @param fmt Format string to apply to returned variable (optional), example: fillcolor="{0}"
 * @param If given, in addition for returning, will PUSH the result to this array
 * @returns (possibly formatted) value of the attribute or "" if attribute not found
 */
export function getAttributeAndFormat(cl: GraphObject, attr: (string | any[]), fmt: string, resultarray?: string[]): string {
  if (attr instanceof Array) {
    for (const i of attr) {
      const tmp = getAttributeAndFormat(cl, i, fmt, resultarray)
      if (tmp) {
        debug(`Return ${tmp}`)
        return tmp
      }
    }
    return ''
  }

  const obtained = Object.getOwnPropertyDescriptor(cl, attr);
  // Not gonna fly coz cl can be subclass of GraphObject and we're fetching ITS properies
  // const attrType = attr as keyof typeof GraphObject;
  if (!obtained || !obtained.value || obtained.value === 0) {
    return ''
  }
  const valStr: string = obtained.value

  const tmp = fmt.replace('{0}', valStr)
  if (resultarray) { resultarray.push(tmp) }
  return tmp
}

/**
 * Apply getAttributeAndFormat for each attrMap listed attribute name(key) and formatting (value) for object obj
 * Exclude empties
 * Append all extras to the output array
 * Comma join the output array and return it as [...]
 * If output results in NOTHING, return empty string
 *
 * @param obj
 * @param attrMap key is attribute to fetch (if present), and value is format
 * @param extras Anything here will be appended to the result map
 * @return Return all successfully fetched and formatted properties joined with extras as a comma separared parameter list SORTED and enclosed in [] or '' if no attributes resulted
 */
export function multiAttrFmt(obj: GraphObject, attrMap: { [key: string]: string }, extras: string[] = []) {
  const attrMapFormatted = []
  for (const [key, value] of Object.entries(attrMap)) {
    const formattedValue = getAttributeAndFormat(obj, key, value)
    if (formattedValue && formattedValue.trim()) {
      attrMapFormatted.push(formattedValue)
    }
  }
  extras = attrMapFormatted.concat(extras.filter((p) => p.trim())).sort()
  return extras.length > 0 ? `[ ${extras.join(', ')} ]` : ''
}

let indentLevel = 0

/**
 * Output given string, potentially indenting or dedenting
 * Function accepts (graphcanvas, txt, indentOrDedent) (txt, indentOrDedent) or (indentOrDedent)
 * @param graphcanvas (or boolean as for indentOrDedent without outputting anything, or just a string)
 * @param txt Text to output
 * @param [indentOrDedent] whether to indent to dedent, OPTIONAL. true will LATENTLY increase the indent, flase will do that BEFORE the output is processed
 */
export function output(graphcanvas: (boolean | GraphCanvas),
  txt?: (string | boolean),
  indentOrDedent?: boolean) {
  let prefix = ''
  if (indentOrDedent === false || graphcanvas === false || txt === false) {
    if (indentLevel === 0) {
      throw new Error('Dedenting beyond 0, check your intendation')
    }
    indentLevel--
  }
  if (txt !== true && txt !== false && graphcanvas instanceof GraphCanvas) {
    for (let i = 0; i < indentLevel; i++) {
      prefix += '    '
    }
    if (graphcanvas.result) {
      graphcanvas.result(`${prefix}${txt}`)
    }
  }
  if (indentOrDedent === true || graphcanvas === true || txt === true) {
    indentLevel++
  }
}

/**
 * Send the text to the output, or format the array
 * @param graphcanvas
 * @param  txt
 * @param [array] Optional array format
 */
export function outputFormattedText(graphcanvas: GraphCanvas, txt: string, array?: any[]) {
  if (graphcanvas.result) {
    if (!array) {
      graphcanvas.result(txt)
    } else {
      graphcanvas.result(txt.formatArray(array))
    }
  }
}

/**
 * Iterate edges
 */
export function* iterateEdges(graphcanvas: GraphCanvas) {
  for (const edge of graphcanvas.getEdges()) {
    yield edge
  }
}
