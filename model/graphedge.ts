// @ts-check
import { debug } from 'console'
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
  edgeType: string
  left: GraphConnectable
  right: GraphConnectable
  lcompass?: string = undefined
  rcompass?: string = undefined
  container?: GraphConnectable = undefined

  /**
     * @param edgeType Type of the edge(grammar!)
     * @param lhs Left hand side of the edge
     * @param rhs Right hand side of the edge
     */
  constructor(edgeType: string, parent: GraphContainer, lhs: GraphConnectable, rhs: GraphConnectable) {
    super('', parent) // edges have no names, ever
    this.edgeType = edgeType.trim()
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

  isDotted() {
    return this.edgeType.indexOf('.') !== -1
  }

  isDashed() {
    return this.edgeType.indexOf('-') !== -1
  }

  isBroken() {
    return this.edgeType.indexOf('/') !== -1
  }

  /**
   * @returns True if edge has arrows on both sides
   */
  isBidirectional() {
    return this.isLeftPointingEdge() && this.isRightPointingEdge()
  }

  /**
   * @returns true if this edge is undirected (no arrows)
   */
  isUndirected() {
    return !this.isLeftPointingEdge() && !this.isRightPointingEdge()
  }

  /**
   * @returns true if edge points left. Notice! Edge can still be birectional!
   */
  isLeftPointingEdge() {
    return this.edgeType.indexOf('<') !== -1
  }

  /**
   * @returns true if edge points right. Notice! Edge can still be birectional!
   */
  isRightPointingEdge() {
    return this.edgeType.indexOf('>') !== -1
  }

  toString() {
    let fmt = ''
    if (this.lcompass) { fmt += `, lcompass: ${this.lcompass}` }
    if (this.rcompass) { fmt += `, rcompass: ${this.rcompass}` }
    if (this.color) { fmt += `, color: ${this.color}` }
    if (this.textcolor) { fmt += `, textcolor: ${this.textcolor}` }
    return `GraphEdge (type:${this.edgeType} as L:${this.left.toString()}, R:${this.right.toString()}, label=${this.getLabel()}${fmt}X)`
  }
};
