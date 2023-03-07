// @ts-check

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
  if (VERBOSE && msg !== false && msg !== true) {
    let d = ''
    for (let i = 0; i < debugIndent; i++) d += '    '
    console.warn(`// ${d}${msg}`)
  }
  if (indentOrDedent === true || msg === true) {
    debugIndent++
  } else if (indentOrDedent === false || msg === false) {
    debugIndent--
  }
}
