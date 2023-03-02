// @ts-check
import { GraphEdge, GraphEdgeArrowType, GraphEdgeDirectionType, GraphEdgeLineType } from '../../model/graphedge.js'
import { GraphCanvas } from '../../model/graphcanvas.js'
import { GraphVertex } from '../../model/graphvertex.js'

describe('GraphEdge tests', () => {
  const rightArrows = [
    ['>', 'isNormalArrow', GraphEdgeArrowType.NORMAL],
    ['>>', 'isDoubleArrow', GraphEdgeArrowType.DOUBLE],
    ['|', 'isFlatArrow', GraphEdgeArrowType.FLAT]
  ]
  const leftArrows = [
    ['<', 'isNormalArrow', GraphEdgeArrowType.NORMAL],
    ['<<', 'isDoubleArrow', GraphEdgeArrowType.DOUBLE],
    ['|', 'isFlatArrow', GraphEdgeArrowType.FLAT]
  ]

  const lineTypes = [
    ['.', 'isDottedLine', GraphEdgeLineType.DOTTED],
    ['-', 'isDashedLine', GraphEdgeLineType.DASHED],
    ['=', 'isDoubleLine', GraphEdgeLineType.DOUBLE],
    ['/', 'isBrokenLine', GraphEdgeLineType.BROKEN],
    ['', 'isNormalLine', GraphEdgeLineType.NORMAL]]

  const lineVerifications = ['isDottedLine', 'isDoubleLine', 'isDashedLine', 'isBrokenLine', 'isNormalLine']
  const arrowVerifications = ['isFlatArrow', 'isDoubleArrow', 'isNormalArrow']
  const directionVerifications = ['isBidirectional', 'isUndirected', 'isLeftPointingEdge', 'isRightPointingEdge']
  const directionTypes = [['left', GraphEdgeDirectionType.LEFT], ['right', GraphEdgeDirectionType.RIGHT], ['bidirectional', GraphEdgeDirectionType.BIDIRECTIONAL], ['undirected', GraphEdgeDirectionType.UNIDIRECTIONAL]]

  /**
   *
   * @param {string} match
   * @param {string[]} candidates
   * @returns {string[]}
   */
  function makeMatchPattern (match, candidates) {
    return candidates.map(/** @type {string} */p => p === match ? p : `!${p}`)
  }

  // So we have arrow head types, line types
  // and common understanding that an edge can be undirected or directed. Directed can be left, right, or bidirectional
  for (const [/** @type {String} */line, /** @type {String} */linef, /** @type {GraphEdgeLineType} */linet] of lineTypes) {
    for (const [/** @type {String} */left, /** @type {String} */leftf, /** @type {GraphEdgeArrowType} */arrowtl] of leftArrows) {
      for (const [/** @type {String} */right, /** @type {String} */rightf, /** @type {GraphEdgeArrowType} */arrowtr] of rightArrows) {
        for (const [/** @type {String} */direction, /** @type {GraphEdgeDirectionType} */directiont] of directionTypes) {
          // TODO: interesting, it COULD be possible to have |-> or <<-> bidirectional node types, but
          // I don't support that CURRENTLY, so skipping
          /** @type {string} */
          let edgeType = ''
          /** @type {string[]} */
          let verifications = []
          switch (direction) {
            case 'left': {
              edgeType = `${left}${line}`
              const v = makeMatchPattern(linef, lineVerifications)
              const n = makeMatchPattern(leftf, arrowVerifications)
              const d = makeMatchPattern('isLeftPointingEdge', directionVerifications)
              verifications = [...v, ...n, ...d]
            }
              break
            case 'right': {
              edgeType = `${line}${right}`
              const v = makeMatchPattern(linef, lineVerifications)
              const n = makeMatchPattern(rightf, arrowVerifications)
              const d = makeMatchPattern('isRightPointingEdge', directionVerifications)
              verifications = [...v, ...n, ...d]
            }
              break
            case 'bidirectional': {
              // cannot have bidirected broken line
              if (line === '/') continue
              if ((left === '<' && right !== '>') ||
                (left === '<<' && right !== '>>') ||
                (left === '|' && right !== '|')) continue
              edgeType = `${left}${line}${right}`
              const v = makeMatchPattern(linef, lineVerifications)
              // TODO: this is ONLY true if arrow types match, support different types!
              const n = makeMatchPattern(rightf, arrowVerifications)
              const d = makeMatchPattern('isBidirectional', directionVerifications)
              verifications = [...v, ...n, ...d]
            }
              break
            case 'undirected': {
              // cannot have undirected broken line
              if (line === '/') continue
              // Also special case of no line specified, it cannot be undirected
              if (line === '') continue
              edgeType = `${line}`
              const v = makeMatchPattern(linef, lineVerifications)
              const n = makeMatchPattern('nevermatch', arrowVerifications)
              const d = makeMatchPattern('isUndirected', directionVerifications)
              verifications = [...v, ...n, ...d]
            }
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
          verifications.forEach(verification => {
            it(`Test that for edgetype=(${edgeType}) this ${verification}() is true(${linet},${arrowtl},${arrowtr},${directiont})`, async () => {
              const inverse = verification.startsWith('!')
              if (inverse) {
                verification = verification.substring(1)
              }
              // Bug in jest? Requires String?
              expect(String(edge[verification]())).toMatch(String(true && !inverse))
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
          })
        }
      }
    }
  }
})
