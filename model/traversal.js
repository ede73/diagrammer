// @ts-check

// used as type, by eslint doesn't get it
// eslint-disable-next-line no-unused-vars
import { GraphCanvas } from '../model/graphcanvas.js'
// used as type, by eslint doesn't get it
// eslint-disable-next-line no-unused-vars
import { GraphContainer } from '../model/graphcontainer.js'
// eslint-disable-next-line no-unused-vars
import { GraphEdge } from '../model/graphedge.js'
import { debug } from '../model/support.js'
// eslint-disable-next-line no-unused-vars
import { GraphConnectable } from './graphconnectable.js'
import { GraphReference } from './graphreference.js'

// =====================================
// exposed to generators also
// =====================================

/**
 * Usage: grammar/diagrammer.grammar, generators/digraph.js
 * @param {GraphConnectable} vertex
 */
export function hasOutwardEdge (graphCanvas, vertex) {
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
//  * @param {GraphCanvas} graphCanvas
//  * @param {GraphConnectable} vertex
//  * @param {GraphContainer} verticesContainer (Group?)
//  */
// function hasInwardEdge (graphCanvas, vertex, verticesContainer) {
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
//  * @param {GraphContainer} container
//  * @param {GraphConnectable} obj
//  */
// function containsObject (container, obj) {
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

/**
 * Iterate thru all edges in the graph, call callback for each
 *
 * If callback returns a value (!= undefined) break loop and return just that
 * Usage: generators
 *
 * @param {GraphCanvas} graphCanvas
 * @param {function(GraphEdge):void} callback
 * @return {any}
 */
export function traverseEdges (graphCanvas, callback) {
  debug(`${graphCanvas._ROOTVERTICES}`)
  for (const i in graphCanvas._EDGES) {
    if (!Object.prototype.hasOwnProperty.call(graphCanvas._EDGES, i)) continue
    const ret = callback(graphCanvas._EDGES[i])
    if (ret !== undefined) {
      return ret
    }
  }
}

/**
 * Iterate thru all containers objects (flat), for each object, call callback.
 * Should call back return value, loop is broken and what ever was returned is returned
 *
 * Usage: generators
 *
 * @param {GraphContainer} container Go thru all objects within this container
 * @param {function(GraphConnectable):void} callback Called for each object, IFF callback returns anything(!=undefined), this function will return that also
 * @return {any}
 */
export function traverseVertices (container, callback, includeReferred = false) {
  const nodes = container._getObjects(includeReferred)
  for (const i in nodes) {
    if (!Object.prototype.hasOwnProperty.call(nodes, i)) continue
    // this can only be GraphVertex|GraphGroup|GraphInner
    // didn't figure out how to keep typechecker happy now (TODO:)
    const obj = nodes[i]
    if (!includeReferred && (obj instanceof GraphReference)) {
      continue
    }
    const ret = callback(obj)
    if (ret !== undefined) {
      return ret
    }
  }
}
