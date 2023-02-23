// @ts-check
import { GraphEdge } from '../../model/graphedge.js'
import { GraphCanvas } from '../../model/graphcanvas.js'
import { GraphVertex } from '../../model/graphvertex.js'

describe('GraphEdge tests', () => {
  const edgeTypes = {
    '>': [
      '!isDotted', '!isDashed', '!isBroken', '!isBidirectional', '!isUndirected', '!isLeftPointingEdge', 'isRightPointingEdge'
    ],
    '->': [
      '!isDotted', 'isDashed', '!isBroken', '!isBidirectional', '!isUndirected', '!isLeftPointingEdge', 'isRightPointingEdge'
    ],
    '.>': [
      'isDotted', '!isDashed', '!isBroken', '!isBidirectional', '!isUndirected', '!isLeftPointingEdge', 'isRightPointingEdge'
    ],
    '/>': [
      '!isDotted', '!isDashed', 'isBroken', '!isBidirectional', '!isUndirected', '!isLeftPointingEdge', 'isRightPointingEdge'
    ],
    '<': [
      '!isDotted', '!isDashed', '!isBroken', '!isBidirectional', '!isUndirected', 'isLeftPointingEdge', '!isRightPointingEdge'
    ],
    '<-': [
      '!isDotted', 'isDashed', '!isBroken', '!isBidirectional', '!isUndirected', 'isLeftPointingEdge', '!isRightPointingEdge'
    ],
    '<.': [
      'isDotted', '!isDashed', '!isBroken', '!isBidirectional', '!isUndirected', 'isLeftPointingEdge', '!isRightPointingEdge'
    ],
    '</': [
      '!isDotted', '!isDashed', 'isBroken', '!isBidirectional', '!isUndirected', 'isLeftPointingEdge', '!isRightPointingEdge'
    ],
    '<>': [
      '!isDotted', '!isDashed', '!isBroken', 'isBidirectional', '!isUndirected', 'isLeftPointingEdge', 'isRightPointingEdge'
    ],
    '<->': [
      '!isDotted', 'isDashed', '!isBroken', 'isBidirectional', '!isUndirected', 'isLeftPointingEdge', 'isRightPointingEdge'
    ],
    '<.>': [
      'isDotted', '!isDashed', '!isBroken', 'isBidirectional', '!isUndirected', 'isLeftPointingEdge', 'isRightPointingEdge'
    ],
    '-': [
      '!isDotted', 'isDashed', '!isBroken', '!isBidirectional', 'isUndirected', '!isLeftPointingEdge', '!isRightPointingEdge'
    ],
    '.': [
      'isDotted', '!isDashed', '!isBroken', '!isBidirectional', 'isUndirected', '!isLeftPointingEdge', '!isRightPointingEdge'
    ]
  }
  Object.entries(edgeTypes).forEach(([edgeType, verifications]) => {
    const c = new GraphCanvas()
    const lhs = new GraphVertex('lhs', c)
    const rhs = new GraphVertex('rhs', c)
    const edge = new GraphEdge(edgeType, c, lhs, rhs)
    expect(edge.edgeType).toMatch(edgeType)
    verifications.forEach(verification => {
      it(`Test that for edgetype (${edgeType}) ${verification}() is true`, async () => {
        const inverse = verification.startsWith('!')
        if (inverse) {
          verification = verification.substring(1)
        }
        // Bug in jest? Requires String?
        expect(String(edge[verification]())).toMatch(String(true && !inverse))
      })
    })
  })
})
