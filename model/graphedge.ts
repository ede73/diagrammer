// @ts-check
import { debug } from '../model/debug.js'
import { DefaultSettingKey, GraphContainer } from '../model/graphcontainer.js'
import { GraphObject } from '../model/graphobject.js'
import { GraphConnectable } from './graphconnectable.js'
import { GraphGroup } from './graphgroup.js'
import { GraphInner } from './graphinner.js'
import { GraphReference } from './graphreference.js'
import { GraphVertex } from './graphvertex.js'

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

  isDottedLine() {
    return this.edgeType.match(/(^(<<|<|[|])[.])|(^[.](>>|>|[|])$)|(^[.]$)/) !== null
  }

  isDashedLine() {
    return this.edgeType.match(/(^(<<|<|[|])[-])|(^[-](>>|>|[|])$)|(^-$)/) !== null
  }

  isDoubleLine() {
    return this.edgeType.match(/(^(<<|<|[|]){0,1}[=])|(^[=](>>|>|[|]){0,1}$)|(^=$)/) !== null
  }

  isBrokenLine() {
    return this.edgeType.match(/(^(<<|<|[|])[/])|(^[/](>>|>|[|])$)/) !== null
  }

  isDoubleArrow() {
    return this.edgeType.match(/(^<<[=./-]{0,1})|(^[=./-]{0,1}>>$)/) !== null
  }

  isFlatArrow() {
    return this.edgeType.match(/(^[|][=./-]{0,1})|(^[=./-]{0,1}[|]$)/) !== null
  }

  isNormalArrow() {
    return this.edgeType.match(/(^<[^<])|([^>]>$)|(^[<>]$)/) !== null
  }

  /**
   * @returns True if edge has arrows on both sides
   */
  isBidirectional() {
    return this.edgeType.match(/(^(<<|<|[|]).*(>>|>|[|])$)/) !== null
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
