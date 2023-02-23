// @ts-check

import { GraphCanvas } from '../model/graphcanvas.js'
import { GraphContainer } from '../model/graphcontainer.js'
import { GraphEdge } from '../model/graphedge.js'
import { debug } from '../model/support.js'
import { GraphConnectable } from './graphconnectable.js'
import { GraphReference } from './graphreference.js'

// =====================================
// exposed to generators also
// =====================================

/**
 * Usage: grammar/diagrammer.grammar, generators/digraph.js
 */
export function hasOutwardEdge(graphCanvas: GraphCanvas, vertex: GraphConnectable) {
  // TODO: Replace with traverseEdges&GraphCanvas
  for (const i in graphCanvas._EDGES) {
    if (!Object.prototype.hasOwnProperty.call(graphCanvas._EDGES, i)) continue
    const edge = graphCanvas._EDGES[i]
    if (edge.left.name === vertex.name) {
      return true
    }
  }
  return false
}

// /**
//  * return true if vertex has inward edge OUTSIDE container it is in
//  */
// function hasInwardEdge (graphCanvas:GraphCanvas, vertex:GraphConnectable, verticesContainer:GraphContainer) {
//   for (const i in graphcanvas._EDGES) {
//     if (!Object.prototype.hasOwnProperty.call(graphcanvas._EDGES, i)) continue
//     const edge = graphcanvas._EDGES[i]
//     if (verticesContainer &&
//             edge.container.name === verticesContainer.name) {
//       continue
//     }
//     if (edge.right.name === vertex.name) {
//       return true
//     }
//   }
//   return false
// }

// /**
//  * test if container has the object
//  */
// function containsObject (container:GraphContainer, obj:GraphConnectable) {
//   for (const i in container.OBJECTS) {
//     if (!Object.prototype.hasOwnProperty.call(container.OBJECTS, i)) continue
//     const c = container.OBJECTS[i]
//     if (c === obj) {
//       return true
//     }
//     if (c instanceof GraphGroup) {
//       if (containsObject(c, obj)) {
//         return true
//       }
//     }
//   }
//   return false
// }
