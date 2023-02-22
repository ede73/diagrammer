// @ts-check

// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators, GraphCanvas } from '../model/graphcanvas.js'
import { GraphGroup } from '../model/graphgroup.js'
import { traverseEdges, traverseVertices } from '../model/traversal.js'
import { debug, output } from '../model/support.js'
import { GraphConnectable } from '../model/graphconnectable.js'

// ADD TO INDEX.HTML AS: <option value="umlclass">UMLClass(GoJS)</option>

// Basically [+-#] [name:] [String] [=defaultValue]
export function umlclassParseMember(member: string) {
  const regex = /^(?<visibility>[+#-]|)(?<name>[^:]+(?=:)|)[:]{0,1}(?<type>[^=]+)[=]{0,1}(?<default>.+|)/
  return member.match(regex)
}

// Basically [+-#] [name] [(parameters)] [:[RETURNTYPE]]
export function umlclassParseMethod(method: string) {
  const regex = /^(?<visibility>[+#-]|)(?<name>[^(]+|)(?<parameters>[^)]+\)|)[:]{0,1}(?<return>.+|)/
  return method.match(regex)
}

/**
 * Test: node js/diagrammer.js tests/test_inputs/umlclass2.txt umlclass
 */
export function umlclass(graphcanvas: GraphCanvas) {
  const lout = (...args) => {
    const [textOrIndent, maybeIndent] = args
    output(graphcanvas, textOrIndent, maybeIndent)
  }

  const groups = []
  const edges = []

  const nameAndLabel = (ln: GraphConnectable) => {
    // name;name():?? -> name():??
    // name;:?? -> name():??
    const label = (!ln.label) ? '' : ln.label
    if (label.startsWith(ln.name)) {
      return label
    }
    return `${ln.name}${label}`
  }

  const mangleName = (name: string) => {
    return name.replace(/_+$/, '').replace(/^_+/, '')
  }

  const getProperties = (vertices: GraphConnectable[]) => {
    // instead of array of names...{name:???,type=???,visibility=???,default=??}
    // Example:
    // NAME;LABEL
    // name;[+-#][name:]String[=defaultValue]
    return [...vertices].filter(node => !nameAndLabel(node).includes(')')).map(p => {
      const ret = {
        name: '',
        visibility: '',
        default: '',
        type: ''
      }
      // By default, name=name
      ret.name = mangleName(p.name)

      // If there's a label attached, parse that
      if (p.label) {
        const all = umlclassParseMember(p.label)
        switch (all.groups.visibility) {
          case '+':
            ret.visibility = 'public'
            break
          case '-':
            ret.visibility = 'private'
            break
          case '#':
            ret.visibility = 'protected'
            break
        }
        if (all.groups.name) {
          ret.name = all.groups.name // specific label name, NO MANGLING
        }
        if (all.groups.type) {
          ret.type = all.groups.type
        }
        if (all.groups.default) {
          ret.default = all.groups.default
        }
      }
      return ret
    })
  }

  const getMethods = (vertices: GraphConnectable[]) => {
    // instead of array of names...{name:???,parameters:[{name:???,type:???}],visiblity:???}
    // +public,-private,#protected
    // Example:
    // name;label
    // where name and/or label includes "("
    // name()
    // name;[+-#][name(...):]RETURNTYPE
    return [...vertices].filter(node => nameAndLabel(node).includes('(')).map(m => {
      const ret = {
        name: '',
        visibility: '',
        type: ''
      }
      ret.name = mangleName(m.name)
      if (m.label) {
        const all = umlclassParseMethod(m.label)
        switch (all.groups.visibility) {
          case '+':
            ret.visibility = 'public'
            break
          case '-':
            ret.visibility = 'private'
            break
          case '#':
            ret.visibility = 'protected'
            break
        }
        if (all.groups.parameters) {
          ret.name = mangleName(m.name) + all.groups.parameters
        }
        if (all.groups.return) {
          ret.type = all.groups.return
        }
        // TODO:
        // ret["parameters"] = [{name:???,type:???}];
        // if (all[3]) {
        // ret['type'] = all[3];
        // }
        // if (all[4]) {
        // ret['default'] = all[4];
        // }
      }
      return ret
    })
  }

  let id = 1
  const groupNameIdMap = new Map()
  traverseVertices(graphcanvas, node => {
    if (node instanceof GraphGroup) {
      const key = id++
      groupNameIdMap.set(node.name, key)
      groups.push({
        key,
        name: nameAndLabel(node),
        properties: getProperties(node._getObjects()),
        methods: getMethods(node._getObjects())
      })
    }
  })
  debug(`${groupNameIdMap}`)

  traverseEdges(graphcanvas, edge => {
    let relationship = 'generalization'
    if (edge.edgeType !== '>') {
      relationship = 'aggregation'
    }
    edges.push({
      from: groupNameIdMap.get(edge.left.name),
      to: groupNameIdMap.get(edge.right.name),
      relationship
    })
  })
  lout(JSON.stringify([groups, edges]))
}
generators.set('umlclass', umlclass)
