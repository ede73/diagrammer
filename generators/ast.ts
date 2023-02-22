// @ts-check

import { generators, GraphCanvas } from '../model/graphcanvas.js'
import { output } from '../model/support.js'

// ADD TO INDEX.HTML AS: <option value="ast">Abstract Syntax Tree</option>

/**
 * TO test: node js/diagrammer.js verbose tests/test_inputs/ast.txt ast
*/
export function ast(graphcanvas: GraphCanvas) {
  const lout = (...args) => {
    const [textOrIndent, maybeIndent] = args
    output(graphcanvas, textOrIndent, maybeIndent)
  }
  const o = (msg, indent = undefined) => {
    lout(msg, indent)
  }

  const rvalue = (rvalue: any) => {
    if (typeof (rvalue) === 'number' || typeof (rvalue) === 'boolean') {
      return `${rvalue}`
    } else if (typeof (rvalue) === 'string') {
      return `"${rvalue.trim()}"`
    }
    return rvalue === undefined ? 'null' : `"${rvalue}"`
  }

  const dumpObject = (obj: any, level = 0) => {
    if (level > 50) {
      return `"/* Stopping recursion, already ${level}s deep and going ${obj}*/"`
    }
    // const t = typeof (obj)
    // const a = Array.isArray(obj)
    // const c = (obj && typeof (obj.constructor) !== 'undefined') ? obj.constructor.name : ''
    // o(`type=${t} array?=${a} cons=${c}`)
    if (typeof (obj) === 'function') {
      return ''
    }
    if (typeof (obj) !== 'object' && !Array.isArray(obj)) {
      return `${rvalue(obj)}`
    }

    if (Array.isArray(obj)) {
      // EDGES, OBJECTS, ROOTVERTICES are true ARRAYS (vs.named)
      const items = []
      obj.forEach((item) => {
        const collect = dumpObject(item, level)
        // const collect = dumpObject(obj[arrayKey], level + 1)
        // items.push(`"${arrayKey}": ${collect}`)
        items.push(`${collect}`)
      })
      return `[${items.sort().join(',')}]\n`
    } else {
      const items = []
      Object.keys(obj).forEach((propname) => {
        const value = obj[propname]
        // skip empties..
        if (value === null || value === undefined) return
        if (
          // TODO only apply to GraphEdges
          propname === 'left' ||
          propname === 'right' ||
          propname === 'container') {
          // special case for GraphEdges..don't traverse into these!
          items.push(`\n"${propname}": ${rvalue(value.getName())}`)
        } else if (propname === 'CURRENTCONTAINER') {
          // infinity awaits..just dump the name
          items.push(`\n"${propname}": "...${value}"`)
        } else if (propname === 'yy' ||
          propname === 'ALLOWED_DEFAULTS' ||
          typeof (value) === 'function') {
          // nothing, ignore
        } else {
          const collect = dumpObject(value, level + 1)
          items.push(`\n"${propname}": ${collect}`)
        }
      })
      return `{"${obj.constructor.name}" : {\n${items.sort().join(',')}\n}}\n`
    }
  }
  const dump = dumpObject(graphcanvas)
  try {
    const jsonbeauty = JSON.stringify(JSON.parse(`${dump}\n`), null, 3)
    o(jsonbeauty)
  } catch (ex) {
    o('//Something broke, not full json')
    o(dump)
  }
}
generators.set('ast', ast)
