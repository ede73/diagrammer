// @ts-check
import { debug } from '../model/debug.js'
import { DefaultSettingKey, GraphContainer } from '../model/graphcontainer.js'
import { GraphObject } from '../model/graphobject.js'
import { GraphConnectable } from './graphconnectable.js'
import { GraphGroup } from './graphgroup.js'
import { GraphInner } from './graphinner.js'
import { GraphReference } from './graphreference.js'
import { GraphVertex } from './graphvertex.js'

export enum GraphEdgeMeaningType {
  PLAIN_EDGE = 'plain_edge',
  EDGE_AND_NOTE = 'edge_and_note',
  PASSING_TIME = 'passing_time',
  HORIZONTAL_MARKER = 'horizontal_marker',
  BROADCAST = 'broadcast'
}
export enum GraphEdgeLineType {
  DOTTED = "dotted(.)",
  DASHED = "dashed(-)",
  NORMAL = "normal",
  DOUBLE = "double(=)",
  BROKEN = "broken(/)"
}

export enum GraphEdgeArrowType {
  NORMAL = 'normal(< or >)',
  DOUBLE = 'double(<< or >>)',
  FLAT = 'flat(|)',
  NONE = 'none()'
}

export enum GraphEdgeDirectionType {
  LEFT = 'left',
  RIGHT = 'right',
  BIDIRECTIONAL = 'bidirectional',
  UNIDIRECTIONAL = 'unidirectional'
}
/**
 * Represents an edge(link) between objects (vertices,groups,lists)
 */
export class GraphEdge extends GraphObject {
  // TODO: TypeScript doesn't allow quickly adding new members to objects, fix after TS conversion done(see plantuml_sequence/parsetree e.g.)
  printed?: boolean = undefined
  readonly edgeType: string
  readonly left: GraphConnectable
  readonly right: GraphConnectable
  lcompass?: string = undefined
  rcompass?: string = undefined

  /**
     * @param edgeType Type of the edge(grammar!)
     * @param lhs Left hand side of the edge
     * @param rhs Right hand side of the edge
     */
  constructor(edgeType: string, parent: GraphContainer, lhs: GraphConnectable, rhs: GraphConnectable) {
    super('', parent) // edges have no names, ever
    this.edgeType = edgeType.trim()
    if (!this.edgeType) {
      throw new Error('must had edgetype!')
    }
    // Exclude some ambiguous edge types
    if (['|', '|/|'].includes(this.edgeType)) {
      throw new Error(`Edgetype ${this.edgeType} is impossible`)
    }
    this.left = lhs
    this.right = rhs
    if (!(lhs instanceof GraphVertex) && !(lhs instanceof GraphGroup) &&
      !(lhs instanceof GraphInner) && !(lhs instanceof GraphReference)) {
      throw new Error(`LHS not a Vertex,Group nor a SubGraph(LHS=${lhs}) RHS=(${rhs})`)
    }
    if (!(rhs instanceof GraphVertex) && !(rhs instanceof GraphGroup) &&
      !(rhs instanceof GraphInner) && !(rhs instanceof GraphReference)) {
      throw new Error(`RHS not a Vertex,Group nor a SubGraph(LHS=${lhs}) RHS=(${rhs})`)
    }
    if (!parent) {
      throw new Error('GraphEdge REQUIRES a parent container')
    }
    this.fetchAndSetContainerDefaults([
      { attrName: 'edgecolor' as DefaultSettingKey, callback: color => this.color = color },
      { attrName: 'edgetextcolor' as DefaultSettingKey, callback: color => this.textcolor = color }
    ])
  }

  edgeMeaningType(): GraphEdgeMeaningType {
    // These special 'hints' cant be specified in the language model (this language model)
    // Typically edge connector indicates the use of EDGE ie. connecting two vertices
    // But for sake of usability, we can do better
    // Node connected to self with . ie.:
    //     VERTEX . VERTEX ; means this is actually a passing time marker
    //     usually makes only sense in sequence graphs, other graphs still draw this (since is vertex to self connector and show label)
    // Node connected to self with - ie.:
    //     VERTEX - VERTEX ; means this is actually big horizontal line
    //     usually makes only sense in sequence graphs, other graphs still draw this (since is vertex to self connector and show label)
    if (this.left === this.right &&
      this.lineType() === GraphEdgeLineType.NORMAL &&
      (this.leftArrowType() === GraphEdgeArrowType.NORMAL &&
        this.rightArrowType() === GraphEdgeArrowType.NORMAL)) {
      return GraphEdgeMeaningType.BROADCAST // special case, hint
    } else if (this.left === this.right &&
      this.lineType() === GraphEdgeLineType.DASHED &&
      this.direction() === GraphEdgeDirectionType.UNIDIRECTIONAL) {
      return GraphEdgeMeaningType.HORIZONTAL_MARKER // special case, hint
    } else if (this.left === this.right &&
      this.lineType() === GraphEdgeLineType.DOTTED &&
      this.direction() === GraphEdgeDirectionType.UNIDIRECTIONAL) {
      return GraphEdgeMeaningType.PASSING_TIME // special case, hint
    } else if (this.label?.includes('::')) {
      // this is indicated IF edge label as ::
      return GraphEdgeMeaningType.EDGE_AND_NOTE // special case, hint
    }

    return GraphEdgeMeaningType.PLAIN_EDGE // normal, nominal case
  }

  lineType(): GraphEdgeLineType {
    if (this.isNormalLine()) {
      return GraphEdgeLineType.NORMAL
    } else if (this.isDottedLine()) {
      return GraphEdgeLineType.DOTTED
    } else if (this.isDoubleLine()) {
      return GraphEdgeLineType.DOUBLE
    } else if (this.isDashedLine()) {
      return GraphEdgeLineType.DASHED
    } else if (this.isBrokenLine()) {
      return GraphEdgeLineType.BROKEN
    }
    throw new Error(`Unknown linetype in edgetype ${this.edgeType}`)
  }

  leftArrowType(): GraphEdgeArrowType {
    // TODO: replace with proper test
    if (this.isRightPointingEdge() || this.isUndirected()) return GraphEdgeArrowType.NONE
    if (this.isNormalArrow()) {
      return GraphEdgeArrowType.NORMAL
    } else if (this.isDoubleArrow()) {
      return GraphEdgeArrowType.DOUBLE
    } else if (this.isFlatArrow()) {
      return GraphEdgeArrowType.FLAT
    }
    return GraphEdgeArrowType.NONE
  }

  rightArrowType(): GraphEdgeArrowType {
    // TODO: replace with proper test
    if (this.isLeftPointingEdge() || this.isUndirected()) return GraphEdgeArrowType.NONE
    if (this.isNormalArrow()) {
      return GraphEdgeArrowType.NORMAL
    } else if (this.isDoubleArrow()) {
      return GraphEdgeArrowType.DOUBLE
    } else if (this.isFlatArrow()) {
      return GraphEdgeArrowType.FLAT
    }
    return GraphEdgeArrowType.NONE
  }

  direction(): GraphEdgeDirectionType {
    if (this.isLeftPointingEdge()) {
      return GraphEdgeDirectionType.LEFT
    } else if (this.isRightPointingEdge()) {
      return GraphEdgeDirectionType.RIGHT
    } else if (this.isUndirected()) {
      return GraphEdgeDirectionType.UNIDIRECTIONAL
    } else if (this.isBidirectional()) {
      return GraphEdgeDirectionType.BIDIRECTIONAL
    }
    throw new Error(`Unknown directional edgetype ${this.edgeType}`)
  }

  private getLeftArrow() {
    const leftCandidate = this.edgeType.match(/^(<<|<|[|]|[.=/-])/)
    if (leftCandidate) {
      const left = leftCandidate[1]
      const arrows = new Map(Object.entries({
        '<': GraphEdgeArrowType.NORMAL,
        '|': GraphEdgeArrowType.FLAT,
        '<<': GraphEdgeArrowType.DOUBLE,
      }))
      return arrows.get(left) ?? GraphEdgeArrowType.NONE
    }
    return GraphEdgeArrowType.NONE
  }
  private getRightArrow() {
    const rightCandidate = this.edgeType.match(/([.=/-]|[|]|>>|>)$/)
    if (rightCandidate) {
      const right = rightCandidate[1]
      const arrows = new Map(Object.entries({
        '>': GraphEdgeArrowType.NORMAL,
        '|': GraphEdgeArrowType.FLAT,
        '>>': GraphEdgeArrowType.DOUBLE,
      }))
      return arrows.get(right) ?? GraphEdgeArrowType.NONE
    }
    return GraphEdgeArrowType.NONE
  }
  private getLineType() {
    const lineCandidate = this.edgeType.match(/^.*([.=/-])/)
    if (lineCandidate) {
      const line = lineCandidate[1]
      const arrows = new Map(Object.entries({
        '-': GraphEdgeLineType.DASHED,
        '.': GraphEdgeLineType.DOTTED,
        '=': GraphEdgeLineType.DOUBLE,
        '/': GraphEdgeLineType.BROKEN,
        '': GraphEdgeLineType.NORMAL
      }))
      return arrows.get(line)
    }
    return GraphEdgeLineType.NORMAL
  }

  isNormalLine() {
    return this.getLineType() === GraphEdgeLineType.NORMAL
    //   return this.edgeType.match(/(^(<<|<|[|])$)|(^(>>|>|[|])$)|(^(<<|<|[|])(>>|>|[|])$)/) !== null
  }

  isDottedLine() {
    return this.getLineType() === GraphEdgeLineType.DOTTED
    //return this.edgeType.match(/(^(<<|<|[|])[.])|(^[.](>>|>|[|])$)|(^[.]$)/) !== null
  }

  isDashedLine() {
    return this.getLineType() === GraphEdgeLineType.DASHED
    //return this.edgeType.match(/(^(<<|<|[|])[-])|(^[-](>>|>|[|])$)|(^-$)/) !== null
  }

  isDoubleLine() {
    return this.getLineType() === GraphEdgeLineType.DOUBLE
    //return this.edgeType.match(/(^(<<|<|[|]){0,1}[=])|(^[=](>>|>|[|]){0,1}$)|(^=$)/) !== null
  }

  isBrokenLine() {
    return this.getLineType() === GraphEdgeLineType.BROKEN
    //return this.edgeType.match(/(^(<<|<|[|])[/])|(^[/](>>|>|[|])$)/) !== null
  }

  isDoubleArrow() {
    return this.getLeftArrow() == GraphEdgeArrowType.DOUBLE || this.getRightArrow() == GraphEdgeArrowType.DOUBLE
    //return this.edgeType.match(/(^<<[=./-]{0,1})|(^[=./-]{0,1}>>$)/) !== null
  }

  isFlatArrow() {
    return this.getLeftArrow() == GraphEdgeArrowType.FLAT || this.getRightArrow() == GraphEdgeArrowType.FLAT
    //return this.edgeType.match(/(^[|][=./-]{0,1})|(^[=./-]{0,1}[|]$)/) !== null
  }

  isNormalArrow() {
    return this.getLeftArrow() == GraphEdgeArrowType.NORMAL || this.getRightArrow() == GraphEdgeArrowType.NORMAL
    //return this.edgeType.match(/(^<[^<])|([^>]>$)|(^[<>]$)/) !== null
  }

  /**
   * @returns True if edge has arrows on both sides
   */
  isBidirectional() {
    const l = this.getLeftArrow()
    const r = this.getRightArrow()

    // ambiguous
    return l !== GraphEdgeArrowType.NONE && r !== GraphEdgeArrowType.NONE
    //return this.edgeType.match(/(^(<<|<|[|]).*(>>|>|[|])$)/) !== null
  }

  /**
   * @returns true if this edge is undirected (no arrows)
   */
  isUndirected() {
    return this.edgeType.match(/^[=./-]$/) !== null
  }

  /**
   * @returns true if edge points left and only left (cannot be bidirectional)
   */
  isLeftPointingEdge(): boolean {
    // One oddity here, |-| could be bidirectional, but we cannot determine if it is pointing left or right
    if (this.edgeType.match(/^[|][=./-][|]$/) !== null) {
      return false
    }
    return this.edgeType.match(/^(<<|<|[|])(|[=./-]{1})$/) !== null
  }

  /**
   * @returns true if edge points right and only right (cannot be bidirectional)
   */
  isRightPointingEdge(): boolean {
    return this.edgeType.match(/^(|[=./-]{1})(>>|>|[|])$/) !== null
  }

  toString() {
    let fmt = ''
    if (this.lcompass) { fmt += `, lcompass: ${this.lcompass}` }
    if (this.rcompass) { fmt += `, rcompass: ${this.rcompass}` }
    if (this.color) { fmt += `, color: ${this.color}` }
    if (this.textcolor) { fmt += `, textcolor: ${this.textcolor}` }
    return `GraphEdge (type:${this.edgeType} as L:${this.left.toString()}, R:${this.right.toString()}, parent=${this.parent?.getName()}, label=${this.getLabel()}${fmt}X)`
  }
};
