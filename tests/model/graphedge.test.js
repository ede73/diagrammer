import { GraphEdge } from '../../model/graphedge.js'

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
    const edge = new GraphEdge(edgeType)
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
