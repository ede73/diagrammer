// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators } from '../model/graphcanvas.js'
import { GraphGroup } from '../model/graphgroup.js'
import { traverseEdges, traverseVertices } from '../model/model.js'
import { debug, output } from '../model/support.js'

// ADD TO INDEX.HTML AS: <option value="umlclass">UMLClass(GoJS)</option>

// Basically [+-#] [name:] [String] [=defaultValue]
export function umlclassParseMember (member) {
  const regex = /^(?<visibility>[+#-]|)(?<name>[^:]+(?=:)|)[:]{0,1}(?<type>[^=]+)[=]{0,1}(?<default>.+|)/
  return member.match(regex)
}

// Basically [+-#] [name] [(parameters)] [:[RETURNTYPE]]
export function umlclassParseMethod (method) {
  const regex = /^(?<visibility>[+#-]|)(?<name>[^(]+|)(?<parameters>[^)]+\)|)[:]{0,1}(?<return>.+|)/
  return method.match(regex)
}

/**
 * Test: node js/diagrammer.js tests/test_inputs/umlclass2.txt umlclass
 *
 * @param {GraphCanvas} graphcanvas
 */
export function umlclass (graphcanvas) {
  const groups = []
  const edges = []

  const nameAndLabel = ln => {
    // name;name():?? -> name():??
    // name;:?? -> name():??
    const label = (!ln.label) ? '' : ln.label
    if (label.startsWith(ln.name)) {
      return label
    }
    return `${ln.name}${label}`
  }

  const mangleName = name => {
    return name.replace(/_+$/, '').replace(/^_+/, '')
  }

  const getProperties = vertices => {
    // instead of array of names...{name:???,type=???,visibility=???,default=??}
    // Example:
    // NAME;LABEL
    // name;[+-#][name:]String[=defaultValue]
    return [...vertices].filter(node => !nameAndLabel(node).includes(')')).map(p => {
      const ret = {
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

  const getMethods = vertices => {
    // instead of array of names...{name:???,parameters:[{name:???,type:???}],visiblity:???}
    // +public,-private,#protected
    // Example:
    // name;label
    // where name and/or label includes "("
    // name()
    // name;[+-#][name(...):]RETURNTYPE
    return [...vertices].filter(node => nameAndLabel(node).includes('(')).map(m => {
      const ret = {
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
  traverseVertices(graphcanvas, o => {
    if (o instanceof GraphGroup) {
      const key = id++
      groupNameIdMap.set(o.name, key)
      groups.push({
        key,
        name: nameAndLabel(o),
        properties: getProperties(o.OBJECTS),
        methods: getMethods(o.OBJECTS)
      })
    }
  })
  debug(groupNameIdMap)

  traverseEdges(graphcanvas, l => {
    let relationship = 'generalization'
    if (l.edgeType !== '>') {
      relationship = 'aggregation'
    }
    edges.push({
      from: groupNameIdMap.get(l.left.name),
      to: groupNameIdMap.get(l.right.name),
      relationship
    })
  })
  output(graphcanvas, JSON.stringify([groups, edges]))
}
generators.set('umlclass', umlclass)
