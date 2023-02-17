import { generators } from '../model/graphcanvas.js'
import { output } from '../model/support.js'

// ADD TO INDEX.HTML AS: <option value="ast">Abstract Syntax Tree</option>

/**
 * TO test: node js/diagrammer.js verbose tests/test_inputs/ast.txt ast
 * @param {GraphCanvas} graphcanvas
*/
export function ast (graphcanvas) {
  // debug(graphcanvas)

  const o = (msg, indent = undefined) => {
    output(graphcanvas, msg, indent)
  }

  const rvalue = (rvalue) => {
    if (typeof (rvalue) === 'number' || typeof (rvalue) === 'boolean') {
      return `${rvalue}`
    }
    return rvalue === undefined ? 'null' : `"${rvalue}"`
  }

  const dumpObject = (obj, level = 0) => {
    // if (level > 3) {
    //   return
    // }
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
      return `[${items.join(',')}]\n`
    } else {
      const items = []
      Object.keys(obj).forEach((propname) => {
        const value = obj[propname]
        if (
          // TODO only apply to GraphEdges
          propname === 'left' ||
          propname === 'right' ||
          propname === 'container') {
          // special case for GraphEdges..don't traverse into these!
          items.push(`\n"${propname}": ${rvalue(value.getName())}`)
        } else if (propname === 'yy' ||
          propname === 'ALLOWED_DEFAULTS' ||
          typeof (value) === 'function') {
          // nothing, ignore
        } else {
          const collect = dumpObject(value, level + 1)
          items.push(`\n"${propname}": ${collect}`)
        }
      })
      return `{"${obj.constructor.name}" : {\n${items.join(',')}\n}}\n`
    }
  }

  o(JSON.stringify(JSON.parse(`${dumpObject(graphcanvas)}\n`), null, 3))
}
generators.set('ast', ast)
