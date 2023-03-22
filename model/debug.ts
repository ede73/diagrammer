// @ts-check

let debugIndent: number = 0

export enum VERBOSITY {
  NONE = 0,
  VERBOSE = 1,
  DEBUG = 3
}

/**
 * DEBUG: Set to true to see debug messages
 */
let VERBOSE: VERBOSITY = VERBOSITY.NONE

/**
 * Toggle verbosity
 * TODO: just one level now (max)
 */
export function setVerbose(verbose: boolean) {
  VERBOSE = VERBOSITY.DEBUG
}

/**
 * Pass debug messages
 * @param indentOrDedent whether to indent or dedent
 */
export function debug(msg: (string | boolean), indentOrDedent?: boolean) {
  if (VERBOSE === VERBOSITY.NONE) {
    return
  }
  if (msg !== false && msg !== true) {
    let d = ''
    for (let i = 0; i < debugIndent; i++) d += '    '
    console.warn(`// ${d}${msg}`)
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
  if (indentOrDedent === true || msg === true) {
    debugIndent++
    // sorry linter, you are WRONG! You can't compare this as !indentOrDedent
    // indentOrDedent can be false or undefined and we do NOT want to activate on undefined
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
  } else if (indentOrDedent === false || msg === false) {
    debugIndent--
  }
}

// TODO: actually add verbosity levels or other output control (like skip printings args.. or perf/flow analysis)
// export function debugMethod(verbosity: VERBOSITY = VERBOSITY.NONE) {
// return function actualDecorator(originalMethod: any, context: ClassMethodDecoratorContext) {
export function debugMethod(originalMethod: any, context: ClassMethodDecoratorContext) {
  const methodName = String(context.name)
  function replacementMethod(this: any, ...args: any[]) {
    // if (VERBOSE >= verbosity) {
    debug(`...Entering (${methodName}), args:(${args.map(c => String(c)).join(', ')})`, true)
    // }
    const result = originalMethod.call(this, ...args)
    // if (VERBOSE >= verbosity) {
    debug(false)
    debug(`...Exited ${methodName}, return (${String(result)})`)
    // }
    return result
  }

  return replacementMethod
}
