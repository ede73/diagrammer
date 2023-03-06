// @ts-check

// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators, GraphCanvas } from '../model/graphcanvas.js'
import { GraphGroup } from '../model/graphgroup.js'
import { output } from '../model/support.js'
import { GraphConnectable } from '../model/graphconnectable.js'
import { debug } from '../model/debug.js'
import { GraphEdge, GraphEdgeArrowType, GraphEdgeDirectionType, GraphEdgeLineType } from '../model/graphedge.js'

// ADD TO INDEX.HTML AS: <option value="umlclass">UMLClass(GoJS)</option>

// - association = [aggretation | composition]
//    - association => implicit|ordered|changeable|addOnly|frozen|reflexive|directed|
//    - composition => Folder composes of files
//      Example: child>"n:1"parent
//    - aggregation => dependent object remains in the scope of a relationship even if the source object is destroyed
//      Example: Course.Professor
// - dependency => two or more elements depend on one another, change in one (may) requires change in others
//  bind|derive|friend|instanceOf|instantiate|refine|use|substitute|access|import|permit|extend|include|become|call|copy|parameter|send
// - generalization => class inheritance
//  Example: child>parent
// - realization => interface
export type RelationshipTypeT = "association" | "dependency" | "generalization" | "realization" | "composition" | "aggregation"

export type UMLClassDocumentT = [
  ClassDeclarationT[],
  RelationshipT[]
]

export type ParameterTypeT = {
  name: string,
  type?: string
}

export type MethodDeclarationT = {
  name: string,
  visibility: string,
  type: string,
  parameters?: ParameterTypeT[]
  scope?: string, // c (class-level aka. static) underlines
}

export type PropertyDeclarationT = {
  name: string,
  visibility: string,
  type: string,
  default?: string, // if specified, has as a default value
  scope?: string, // c (class-level aka. static) underlines
}

export type ClassDeclarationT = {
  key: number,
  name: string,
  properties: PropertyDeclarationT[],
  methods: MethodDeclarationT[]
};

export type RelationshipT = {
  from: number,
  to: number,
  relationship: RelationshipTypeT,
  label?: string,
  headLabel?: string,
  tailLabel?: string
}

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

  const groups: ClassDeclarationT[] = []
  const edges: RelationshipT[] = []

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

  const getProperties = (vertices: GraphConnectable[]): PropertyDeclarationT[] => {
    // instead of array of names...{name:???,type=???,visibility=???,default=??}
    // Example:
    // NAME;LABEL
    // name;[+-#][name:]String[=defaultValue]
    return [...vertices].filter(node => !nameAndLabel(node).includes(')')).map(property => {
      const ret: PropertyDeclarationT = {
        name: '',
        visibility: '',
        type: ''
      }

      // By default, name=name
      ret.name = mangleName(property.name ?? '')

      // If there's a label attached, parse that
      if (property.label) {
        const all = umlclassParseMember(property.label)
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
    return [...vertices].filter(node => nameAndLabel(node).includes('(')).map(method => {
      const ret: MethodDeclarationT = {
        name: '',
        visibility: '',
        type: ''
      }
      ret.name = mangleName(method.name ?? '')
      if (method.label) {
        const all = umlclassParseMethod(method.label)
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
            // parameters something like (name:type,...) - what ever was types
            // Wonder which is more likely to be optional, name or type?
            const parameterList = all.groups.parameters.replace(/[()]/g, '').split(',')
            console.log(parameterList)
            ret.parameters = parameterList.map(p => {
              const [name, type] = p.trim().split(':')
              return { name: name?.trim(), type: type?.trim() } as ParameterTypeT
            }).filter(p => p.name || p.type)
            ret.name = mangleName(method.name ?? '') //+ all.groups.parameters
          }
          if (all.groups.return) {
            ret.type = all.groups.return
          }
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
    const edgeRep: RelationshipT = {
      relationship: 'generalization',
      from: groupNameIdMap.get(edge.left.name),
      to: groupNameIdMap.get(edge.right.name),
      label: edge.getLabel(),
    }
    // bit simple check, but -> (or any dashed line type) limits to realization/dependecy, where realization class starts with I (interface)
    // NORMAL arrow (and not dashed line) limits to association/generalization
    // DOUBLE arrow (and not dashed line) limits to composition/aggregation, where composition has edge/tail labels
    // by default everything is a dependency
    const linksToInterface = (edge: GraphEdge) => edge.right.getName()?.at(0) === 'I' || edge.right.getLabel()?.at(0) === 'I'
    const hasTailAndHeadLabels = (edge: GraphEdge) => (edge.getLabel()?.split(/:/)?.length ?? 0) >= 3

    // the first edgetype that is true wins
    //[assocType in RelationshipTypeT]: boolean][]
    const umlEdgeTypes: [RelationshipTypeT, boolean][] = [
      ['association', [GraphEdgeDirectionType.UNIDIRECTIONAL, GraphEdgeDirectionType.BIDIRECTIONAL].includes(edge.direction())],
      ['dependency', edge.lineType() == GraphEdgeLineType.DASHED && !linksToInterface(edge)],
      ['realization', edge.lineType() == GraphEdgeLineType.DASHED && linksToInterface(edge)],
      ['generalization', edge.lineType() == GraphEdgeLineType.NORMAL && edge.rightArrowType() == GraphEdgeArrowType.NORMAL],
      ['composition', edge.rightArrowType() == GraphEdgeArrowType.DOUBLE && hasTailAndHeadLabels(edge)],
      ['aggregation', edge.rightArrowType() == GraphEdgeArrowType.DOUBLE && !hasTailAndHeadLabels(edge)],
    ]

    const assoc = umlEdgeTypes.filter(([relationship, matches]) => matches)

    if (assoc.length === 0) {
      console.error(`Couldn't determine association type on ${edge.left.getName()}${edge.edgeType}${edge.right.getName()}, guessing dependency`)
      edgeRep.relationship = 'dependency'
    } else {
      if (assoc.length > 1) {
        console.error(`Ambiguous association type on ${edge.left.getName()}${edge.edgeType}${edge.right.getName()}, picking first`)
        console.log(assoc)
      }
      edgeRep.relationship = assoc[0][0]
    }

    const label = edge.getLabel()
    if (label?.includes(':')) {
      const [child, parent, rest] = label.split(':')
      edgeRep.tailLabel = child
      edgeRep.headLabel = parent
      edgeRep.label = rest
    }
    edges.push(edgeRep)
  })
  const umlClass: UMLClassDocumentT = [groups, edges]
  lout(JSON.stringify(umlClass))
}
generators.set('umlclass', umlclass)
