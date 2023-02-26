// @ts-check

import { GraphCanvas } from '../model/graphcanvas.js'
import { GraphConnectable } from './graphconnectable.js'

// =====================================
// exposed to generators also
// =====================================

/**
 * Usage: grammar/diagrammer.grammar, generators/digraph.js
 */
export function hasOutwardEdge(graphCanvas: GraphCanvas, vertex: GraphConnectable) {
  for (const edge of graphCanvas.getEdges()) {
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
//   for (const edge of graphcanvas.getEdges()) {
//     if (verticesContainer && edge.container.name === verticesContainer.name) {
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
//   for (const c of container.getObjects()) {
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
