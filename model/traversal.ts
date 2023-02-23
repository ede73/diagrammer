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

type TraversalMayReturnEarly<T> = {
  returned?: T
}

/**
 * Iterate thru all edges in the graph, call callback for each
 *
 * If callback returns a value (!= undefined) break loop and return just that
 * Usage: generators
 */
export function traverseEdges<T>(graphCanvas: GraphCanvas, callback: (edge: GraphEdge) => T | undefined): TraversalMayReturnEarly<T> {
  debug(`${graphCanvas._ROOTVERTICES}`)
  for (const edge of graphCanvas._EDGES) {
    const ret = callback(edge)
    if (ret !== undefined) {
      return { returned: ret }
    }
  }
  return { returned: undefined }
}

/**
 * Iterate thru all containers objects (flat), for each object, call callback.
 * Should call back return value, loop is broken and what ever was returned is returned
 *
 * Usage: generators
 *
 * @param container Go thru all objects within this container
 * @param callback Called for each object, IFF callback returns anything(!=undefined), this function will return that also
 */
export function traverseVertices<T>(container: GraphContainer,
  callback: (node: GraphConnectable) => T | undefined,
  includeReferred: boolean = false): TraversalMayReturnEarly<T> {
  for (const obj of container._getObjects(includeReferred)) {
    // this can only be GraphVertex|GraphGroup|GraphInner
    // didn't figure out how to keep typechecker happy now (TODO:)
    if (!includeReferred && (obj instanceof GraphReference)) {
      continue
    }
    const ret = callback(obj)
    if (ret !== undefined) {
      return { returned: ret }
    }
  }
  return { returned: undefined }
}
