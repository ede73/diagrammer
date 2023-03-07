// @ts-check
import { GraphEdge, GraphEdgeArrowType, GraphEdgeDirectionType, GraphEdgeLineType } from '../../model/graphedge.js'
import { GraphCanvas } from '../../model/graphcanvas.js'
import { GraphVertex } from '../../model/graphvertex.js'
import { describe, expect, it } from '@jest/globals'

describe('GraphEdge tests', () => {
  const rightArrows = [
    ['>', GraphEdgeArrowType.NORMAL],
    ['>>', GraphEdgeArrowType.DOUBLE],
    ['|', GraphEdgeArrowType.FLAT]
  ]
  const leftArrows = [
    ['<', GraphEdgeArrowType.NORMAL],
    ['<<', GraphEdgeArrowType.DOUBLE],
    ['|', GraphEdgeArrowType.FLAT]
  ]

  const lineTypes = [
    ['.', GraphEdgeLineType.DOTTED],
    ['-', GraphEdgeLineType.DASHED],
    ['=', GraphEdgeLineType.DOUBLE],
    ['/', GraphEdgeLineType.BROKEN],
    ['', GraphEdgeLineType.NORMAL]]

  const directionTypes = [
    ['left', GraphEdgeDirectionType.LEFT],
    ['right', GraphEdgeDirectionType.RIGHT],
    ['bidirectional', GraphEdgeDirectionType.BIDIRECTIONAL],
    ['undirected', GraphEdgeDirectionType.UNIDIRECTIONAL]]

  // So we have arrow head types, line types
  // and common understanding that an edge can be undirected or directed. Directed can be left, right, or bidirectional
  for (const [line, linet] of lineTypes) {
    for (const [left, arrowtl] of leftArrows) {
      for (const [right, arrowtr] of rightArrows) {
        for (const [direction, directiont] of directionTypes) {
          // TODO: interesting, it COULD be possible to have |-> or <<-> bidirectional node types, but
          // I don't support that CURRENTLY, so skipping
          let edgeType = ''
          switch (direction) {
            case 'left':
              edgeType = `${left}${line}`
              break
            case 'right':
              edgeType = `${line}${right}`
              break
            case 'bidirectional':
              // cannot have bidirected broken line
              if (linet === GraphEdgeLineType.BROKEN) continue
              if (arrowtl !== arrowtr) continue
              edgeType = `${left}${line}${right}`
              break
            case 'undirected':
              // cannot have undirected broken line
              if (linet === GraphEdgeLineType.BROKEN) continue
              // Also special case of no line specified, it cannot be undirected
              if (linet === GraphEdgeLineType.NORMAL) continue
              edgeType = `${line}`
              break
            default:
              throw new Error(`Unsupported combination line=${line} left=${left} right=${right} direction=${direction}`)
          }

          // skip over some impossible edgetypes
          if (['|', '|/|'].includes(edgeType)) continue

          const c = new GraphCanvas()
          const lhs = new GraphVertex('lhs', c)
          const rhs = new GraphVertex('rhs', c)
          const edge = new GraphEdge(edgeType, c, lhs, rhs)
          expect(edge.edgeType).toMatch(edgeType)
          it(`Test that for edgetype=(${edgeType})  linetype=${linet} left arrow type=${arrowtl} right=${arrowtr} direction=${directiont})`, async () => {
            expect(edge.lineType()).toBe(linet)
            expect(edge.direction()).toBe(directiont)
            if (edge.direction() === GraphEdgeDirectionType.RIGHT) {
              expect(edge.leftArrowType()).toBe(GraphEdgeArrowType.NONE)
              expect(edge.rightArrowType()).toBe(arrowtr)
            }
            if (edge.direction() === GraphEdgeDirectionType.LEFT) {
              expect(edge.leftArrowType()).toBe(arrowtl)
              expect(edge.rightArrowType()).toBe(GraphEdgeArrowType.NONE)
            }
            if (edge.direction() === GraphEdgeDirectionType.BIDIRECTIONAL) {
              expect(edge.leftArrowType()).toBe(arrowtl)
              expect(edge.rightArrowType()).toBe(arrowtr)
            }
            if (edge.direction() === GraphEdgeDirectionType.UNIDIRECTIONAL) {
              expect(edge.leftArrowType()).toBe(GraphEdgeArrowType.NONE)
              expect(edge.rightArrowType()).toBe(GraphEdgeArrowType.NONE)
            }
          })
        }
      }
    }
  }
})
