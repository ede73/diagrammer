// @ts-check

import { GraphEdgeDirectionType, GraphEdgeLineType } from '../model/graphedge.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphEdge } from '../model/graphedge.js'
import { GraphVertex } from '../model/graphvertex.js'
import { Generator } from './generator.js'

/**
 * Mermaid Sequence Diagram Generator
 * https://mermaid.js.org/syntax/sequenceDiagram.html
 *
 * To test: node js/generate.js verbose tests/test_inputs/state_sequence.txt mermaid_sequence
 */
export class MermaidSequence extends Generator {
  generate() {
    this.lout('sequenceDiagram', true)

    const participants: Set<string> = new Set()

    // Collect all participants (vertices)
    this.graphCanvas.getObjects().forEach(obj => {
      if (obj instanceof GraphGroup) {
        obj.getObjects().forEach(z => {
          participants.add(z.getName())
        })
      } else if (obj instanceof GraphVertex) {
        participants.add(obj.getName())
      }
    })

    // Output all participants
    participants.forEach(participant => this.lout(`participant ${participant}`))

    // Collect and output all edges (messages)
    this.graphCanvas.getEdges().forEach(edge => {
      const lhs = edge.left.getName()
      const rhs = edge.right.getName()
      const label = edge.label?.trim() || ''
      const direction = this.getMermaidEdgeDirection(edge)

      // Only include the label if it's not empty
      if (label) {
        this.lout(`${lhs} ${direction} ${rhs}: ${label}`)
      } else {
        this.lout(`${lhs} ${direction} ${rhs}:`)
      }
    })
  }

  /**
   * Maps GraphEdge to Mermaid-compatible edge directions
   */
  private getMermaidEdgeDirection(edge: GraphEdge): string {
    const lineType = edge.lineType()
    const direction = edge.edgeMeaningType()

    if (lineType === GraphEdgeLineType.DOTTED) {
      return '-->'
    } else if (lineType === GraphEdgeLineType.DASHED) {
      return '==>'
    }

    const mermaidEdgeMapping: Record<string, string> = {
      [GraphEdgeDirectionType.BIDIRECTIONAL]: '<->',
      [GraphEdgeDirectionType.LEFT]: '-->',
      [GraphEdgeDirectionType.RIGHT]: '->',
    }

    return mermaidEdgeMapping[direction] || '->'
  }
}