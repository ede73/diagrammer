// @ts-check

import { GraphEdge } from '../model/graphedge.js'
import { GraphObject } from '../model/graphobject.js'
import { GraphVertex } from '../model/graphvertex.js'
import { Generator } from './generator.js'

/**
 * TO test: node js/generate.js verbose tests/test_inputs/ast.txt ast
*/
export class AST extends Generator {
  generate() {
    const rvalue = (rvalue: any) => {
      if (typeof (rvalue) === 'number' || typeof (rvalue) === 'boolean') {
        return `${String(rvalue)}`
      } else if (typeof (rvalue) === 'string') {
        return `"${rvalue.trim()}"`
      }
      return rvalue === undefined ? 'null' : `"${String(rvalue)}"`
    }

    const getIndent = (debugIndent: number) => {
      let d = ''
      for (let i = 0; i < debugIndent; i++) d += '    '
      return d
    }

    const join = (level: number, items: string[], separator: string) => {
      let result = ''
      const indent = getIndent(level)
      for (const str of items) {
        result += indent + str + separator
      }
      return result
    }

    const specialHandling = (obj: any, level: number): string | undefined => {
      if (level > 50) {
        return `"/* Stopping recursion, already ${level}s deep and going ${String(obj)}*/"`
      }
      if (typeof (obj) === 'function') {
        return ''
      }
      if (typeof (obj) !== 'object' && !Array.isArray(obj)) {
        return `${rvalue(obj)}`
      }
      if (obj instanceof GraphEdge) {
        return `{ "GraphEdge": { "edgeType": "${obj.edgeType}", "left": "${obj.left.getName()}", "right": "${obj.right.getName()}" }}`
      } else if (obj instanceof GraphVertex) {
        return `{ "GraphVertex": { "name": "${obj.getName()}" }}`
      }
    }

    const dumpArray = (obj: any, level: number): string => {
      // EDGES, OBJECTS, ROOTVERTICES are true ARRAYS (vs.named)
      const items: string[] = []
      obj.forEach((item: any) => {
        items.push(dumpObject(item, level + 1))
      })
      switch (items.length) {
        case 0:
          return '[]'
        case 1:
          return `[${items[0]}]`
        default: {
          const indent = getIndent(level - 1)
          return `[\n${join(level, items, ',\n')}${indent}]`
        }
      }
    }

    const dumpObject = (obj: any, level = 0): string => {
      const sindent = getIndent(level - 1)

      const spec = specialHandling(obj, level)
      if (spec) {
        return spec
      }

      if (Array.isArray(obj)) {
        return dumpArray(obj, level)
      }

      const items: string[] = []
      level++
      if (obj instanceof GraphObject) {
        items.push(`"__PSEUDOTYPE": "${obj.constructor.name}"`)
      }
      Object.entries(obj).forEach(([propname, value]) => {
        // skip empties..
        if (value === null || value === undefined ||
          ['yy', 'parent', 'ALLOWED_DEFAULTS', 'canvas'].includes(propname) ||
          typeof (value) === 'function') return
        if (propname === 'parent') {
          items.push(`"parent": "${value ? (value as GraphObject).getName() : 'CANVAS'}"`)
        } else if (propname === 'CURRENTCONTAINER') {
          items.push(`"${propname}": "...${String(value)}"`)
        } else {
          const collect = dumpObject(value, level + 1)
          items.push(`"${propname}": ${collect}`)
        }
      })
      level--
      if (items.length === 0) {
        return '{}'
      } else if (items.length === 1) {
        return `{ ${items[0]} }`
      }
      return `{${items.length > 0 ? '\n' : ''}${join(level + 1, items, ',\n')}\n${sindent}}`
    }
    const dump = dumpObject(this.graphCanvas)
    this.lout(dump)
  }
}
