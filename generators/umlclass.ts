// @ts-check

// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators, GraphCanvas } from '../model/graphcanvas.js'
import { GraphGroup } from '../model/graphgroup.js'
import { output } from '../model/support.js'
import { GraphConnectable } from '../model/graphconnectable.js'
import { debug } from '../model/debug.js'

// ADD TO INDEX.HTML AS: <option value="umlclass">UMLClass(GoJS)</option>

type RegexMatchedClassMembersT = {
  visibility: string,
  name: string,
  type: string,
  default: string
};

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
  const lout = (...args: any[]) => {
    const [textOrIndent, maybeIndent] = args
    output(graphcanvas, textOrIndent, maybeIndent)
  }

  type PropertyT = {
    visibility: string,
    name: string,
    type: string,
    default?: string,
  };
  type MethodT = {
    name: string;
    visibility: string;
    type?: string;
  };
  type GroupsT = {
    key: number, name: string, properties: PropertyT[], methods: MethodT[]
  };
  const groups: GroupsT[] = []
  const edges: { from: string, to: string, relationship: string }[] = []

  const nameAndLabel = (ln: GraphConnectable): string => {
    // name;name():?? -> name():??
    // name;:?? -> name():??
    const label = (!ln.label) ? '' : ln.label
    if (ln.name && label.startsWith(ln.name)) {
      return label
    }
    return `${ln.name}${label}`
  }

  const mangleName = (name: string) => {
    return name.replace(/_+$/, '').replace(/^_+/, '')
  }

  const getProperties = (vertices: GraphConnectable[]): PropertyT[] => {
    // instead of array of names...{name:???,type=???,visibility=???,default=??}
    // Example:
    // NAME;LABEL
    // name;[+-#][name:]String[=defaultValue]
    return [...vertices].filter(node => !nameAndLabel(node).includes(')')).map(p => {
      const ret: PropertyT = {
        name: '',
        visibility: '',
        type: ''
      }

      // By default, name=name
      ret.name = mangleName(p.name ?? '')

      // If there's a label attached, parse that
      if (p.label) {
        const all = umlclassParseMember(p.label)
        if (all?.groups) {
          const parsedMembers: RegexMatchedClassMembersT = all.groups as RegexMatchedClassMembersT
          switch (parsedMembers.visibility) {
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
          if (parsedMembers.name) {
            ret.name = parsedMembers.name // specific label name, NO MANGLING
          }
          if (parsedMembers.type) {
            ret.type = parsedMembers.type
          }
          if (parsedMembers.default) {
            ret.default = parsedMembers.default
          }
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
      const ret: MethodT = {
        name: '',
        visibility: ''
      }
      ret.name = mangleName(m.name ?? '')
      if (m.label) {
        const all = umlclassParseMethod(m.label)
        if (all?.groups) {
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
            ret.name = mangleName(m.name ?? '') + all.groups.parameters
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
      }
      return ret
    })
  }

  let id = 1
  const groupNameIdMap = new Map()
  graphcanvas.getObjects().forEach(node => {
    if (node instanceof GraphGroup) {
      const key = id++
      groupNameIdMap.set(node.name, key)
      groups.push({
        key,
        name: nameAndLabel(node),
        properties: getProperties(node.getObjects()),
        methods: getMethods(node.getObjects())
      })
    }
  })
  debug(`${groupNameIdMap}`)

  graphcanvas.getEdges().forEach(edge => {
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
