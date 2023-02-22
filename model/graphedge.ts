// @ts-check
import { GraphObject } from '../model/graphobject.js'
import { GraphConnectable } from './graphconnectable.js'

/**
 * Represents an edge(link) between objects (vertices,groups,lists)
 */
export class GraphEdge extends GraphObject {
  edgeType: string
  left: GraphConnectable
  right: GraphConnectable
  lcompass: string = undefined
  rcompass: string = undefined
  edgetextcolor: string = undefined
  edgecolor: string = undefined
  container: GraphConnectable = undefined

  /**
     * @param edgeType Type of the edge(grammar!)
     * @param lhs Left hand side of the edge
     * @param rhs Right hand side of the edge
     * @constuctor
     */
  constructor(edgeType: string, lhs: GraphConnectable, rhs: GraphConnectable) {
    super(undefined) // edges have no names, ever
    this.edgeType = edgeType.trim()
    this.left = lhs
    this.right = rhs
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
    if (this.lcompass) { fmt += `,lcompass: ${this.lcompass}` }
    if (this.rcompass) { fmt += `,rcompass: ${this.rcompass}` }
    if (this.edgecolor) { fmt += `,color: " ${this.edgecolor}` }
    if (this.edgetextcolor) { fmt += `,textcolor: ${this.edgetextcolor}` }
    return `Edge(type:${this.edgeType} as L:${this.left.toString()}, R:${this.right.toString()},label=${this.getLabel()}${fmt})`
  }
};
