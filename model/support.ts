// @ts-check
import { GraphCanvas } from './graphcanvas.js'
import { type GraphObject } from './graphobject.js'
import { debug } from './debug.js'

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
  // cl[attr] = value
  return cl
}

declare global {
  interface String {
    // eslint-disable-next-line @typescript-eslint/method-signature-style
    formatArray(array: any[]): string
  }
}

/**
 * Format a string with provided array of values
 * For example. "{2}{0}{1}".formatArray([2,3,1]) prints 123
 */
// @ts-expect-error eslint-disable-next-line no-extend-native
String.prototype.formatArray = function (array: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
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
  const obtained = Object.getOwnPropertyDescriptor(cl, attr)
  if (!obtained?.value || obtained.value === 0) { return undefined }
  return obtained?.value
}

/**
 * Return formatted attribute value
 *
 * @param cl Object to scan thru
 * @param attributeNameOrNames Name of the attribute(s) to return, FIRST matching attribute will satisfy
 * @param fmt Format string to apply to returned variable (optional), example: fillcolor="{0}"
 * @param If given, in addition for returning, will PUSH the result to this array
 * @returns (possibly formatted) value of the attribute or "" if attribute not found
 */
export function getAttributeAndFormat(
  cl: GraphObject,
  attributeNameOrNames: (string | string[]),
  fmt: string, resultarray?: string[]): string {
  if (attributeNameOrNames instanceof Array) {
    for (const attrName of attributeNameOrNames) {
      const tmp = getAttributeAndFormat(cl, attrName, fmt, resultarray)
      if (tmp) {
        debug(`Return ${tmp} for ${attrName}`)
        return tmp
      }
    }
    return ''
  }

  // TODO:
  const obtained = Object.getOwnPropertyDescriptor(cl, attributeNameOrNames)
  // Not gonna fly coz cl can be subclass of GraphObject and we're fetching ITS properies
  // const attrType = attr as keyof typeof GraphObject;
  if (!obtained?.value || obtained.value === 0) {
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
export function multiAttrFmt(obj: GraphObject, attrMap: Record<string, string>, extras: string[] = []) {
  const attrMapFormatted = []
  for (const [key, value] of Object.entries(attrMap)) {
    const formattedValue = getAttributeAndFormat(obj, key, value)
    if (formattedValue?.trim()) {
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
      graphcanvas.result(`${prefix}${txt as string}`)
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
