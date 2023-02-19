// @ts-check
// =====================================
// ONLY used in grammar/diagrammer.grammar
// =====================================
import { GraphCanvas } from '../model/graphcanvas.js'
import { GraphContainer } from '../model/graphcontainer.js'
import { GraphEdge } from '../model/graphedge.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphInner } from '../model/graphinner.js'
import { GraphVertex } from '../model/graphvertex.js'
import { debug, getAttribute } from '../model/support.js'
import { GraphConnectable } from './graphconnectable.js'

/**
 *
 * Called from grammar to inject a new (COLOR) variable
 * Only colors supported currently, though there's really no limitation
 *
 * If this is assignment, rewrite the variable, else assign new
 * Always return the current value
 *
 * Usage: grammar/diagrammer.grammar
 *
 * @param yy Lexer yy
 * @param {string} variable ${XXX:yyy} assignment or ${XXX} query
 * @return {string} Value of the variable
 */
export function processVariable (yy, variable) {
  // ASSIGN VARIABLE
  // $(NAME:CONTENT...)
  // or
  // refer variable
  // $(NAME)
  const vari = variable.slice(2, -1)
  if (vari.indexOf(':') !== -1) {
    // Assignment
    const tmp = vari.split(':')
    debug(`GOT assignment ${tmp[0]}=${tmp[1]}`)
    _getVariables(yy)[tmp[0]] = tmp[1]
    return tmp[1]
  } else {
    // referral
    if (!_getVariables(yy)[vari]) {
      throw new Error(`Variable ${vari} not defined`)
    }
    return _getVariables(yy)[vari]
  }
}

/**
 * Create an array, push LHS,RHS vertices there and return the array as long as
 * processing the list vertices added to array..
 *
 * Usage: grammar/diagrammer.grammar
 *
 * @param yy Lexer yy
 * @param {(GraphConnectable|GraphConnectable[])} lhs left hand side of the list
 * @param {GraphConnectable} rhs right hand side of the list
 * @param {string} rhsEdgeLabel optional RHS label
 * @return {(GraphConnectable|GraphConnectable[])}
 */
export function getList (yy, lhs, rhs, rhsEdgeLabel) {
  if (lhs instanceof GraphVertex) {
    debug(`getList(vertex:${lhs},rhs:[${rhs}])`, true)
    /** @type {(GraphConnectable|GraphConnectable[])} */
    const lst = []
    lst.push(lhs)
    // TODO assuming RHS is Vertex
    const rhsFound = getVertex(yy, rhs)
    if (rhsFound instanceof GraphGroup || rhsFound instanceof GraphVertex) {
      rhsFound._setEdgeLabel(rhsEdgeLabel)
    }
    // @ts-ignore
    lst.push(rhsFound)
    debug(`return vertex:${lst}`, false)
    return lst
  } else if (lhs instanceof GraphGroup) {
    debug(`getList(group:[${lhs}],rhs:${rhs})`, true)
    const lst = []
    lst.push(lhs)
    // TODO assuming RHS is Group
    lst.push(getGroup(yy, rhs)._setEdgeLabel(rhsEdgeLabel))
    debug(`return group:${lst}`, false)
    return lst
  }
  if (!(lhs instanceof Array)) {
    throw new Error('getList requires LHS to be Vertex, Group or Array')
  }
  debug(`getList(lhs:[${lhs}],rhs:${rhs}`, true)
  // LHS not a vertex..
  const rhsFound = getVertex(yy, rhs)
  if (rhsFound instanceof GraphGroup || rhsFound instanceof GraphVertex) {
    rhsFound._setEdgeLabel(rhsEdgeLabel)
  }
  // @ts-ignore
  lhs.push(rhsFound)
  debug(`return [${lhs}]`, false)
  return lhs
}

/**
 * See readVertexOrGroup in grammar
 *
 * Return matching Vertex,Array,Group
 *
 * If no match, create a new vertex
 *
 * STYLE will always be updated on last occurance (ie. dashed a1
 * dotted a1>b1 - only for vertices!
 *
 * vertex a1 will be dotted instead of being dashed
 *
 * Usage: grammar/diagrammer.grammar
 *
 * @param yy Lexer yy
 * @param {(string|GraphConnectable)} objOrName Reference, Vertex/(never observed Array)/Group
 * @param {string} [style] OPTIONAL if style given, update (only if name refers to vertex)
 * @return {GraphConnectable} Comment claims to return Array, but quick run didn't reveal Array ever returned..
 */
export function getVertex (yy, objOrName, style) {
  debug(`getVertex (name:${objOrName},style:${style})`, true)

  function findVertex (yy, /** @type {(string|GraphConnectable)} */obj, style) {
    if (obj instanceof GraphVertex) {
      if (style) obj.setStyle(style)
      return obj
    }
    // TODO: remove
    if (obj instanceof Array || Array.isArray(obj)) {
      // TODO: Get rid of this block, makes no sense...?? ANymore??
      throw new Error('Should never happen')
      // eslint-disable-next-line no-unreachable
      return obj
    }

    const search = (function s (/** @type {GraphContainer} */container, name) {
      if (container.getName() === name) return container
      return traverseVertices(container, o => {
        if (o instanceof GraphVertex && o.getName() === name) {
          if (style) o.setStyle(style)
          return o
        }
        if (o instanceof GraphGroup) {
          const found = s(o, name)
          if (found) return found
        }
      })
    }(getGraphCanvas(yy), obj))
    if (search) {
      // if vertex was found, return it, ELSE it will be added to current container
      // While this works perfectly for pretty much ALL graph/visualizing engines (ie. vertex is instantiated/declared where it is seen)
      // Some engines (nwdiag) DO want to see the vertex in the group as well
      // a-b { b} draws a different graph in nwdiag if b is also in the group, like a--b network 1 {} vs, a--b network 1 {b}
      // And to be precise this is violation of the language as well! We DO have the vertex IN the group, even if it was declared at the top
      // TODO: Fix this, without breaking all other generators, introduce Reference wrapper (GraphReference(GraphVertex))
      // This allows filtering it out in all traversal code, but allows nwdiag see the REFERENCE
      return search
    }
    // if obj was GraphConnectable?
    if (obj instanceof GraphConnectable) {
      throw new Error('Expecting string')
    }
    debug(`Create new vertex name=${obj}`, true)
    const vertex = new GraphVertex(obj, getGraphCanvas(yy).getCurrentShape())
    if (style) vertex.setStyle(style)
    vertex._noedges = true

    _getDefaultAttribute(yy, 'vertexcolor', function (color) {
      vertex.setColor(color)
    })
    _getDefaultAttribute(yy, 'vertextextcolor', function (color) {
      vertex.setTextColor(color)
    })
    debug(false)
    return _pushObject(yy, vertex)
  }

  const vertex = findVertex(yy, objOrName, style)
  debug(`  in getVertex gotVertex ${vertex}`)
  // TODO: MOVING TO GraphCanvas
  yy.lastSeenVertex = vertex
  if (yy.collectNextVertex) {
    debug('Collect next vertex')
    // TODO: make vertex? Do we know that it is vertex(yet?)
    // TODO: MOVING TO GraphCanvas
    yy.collectNextVertex.exitedge = vertex
    // TODO: MOVING TO GraphCanvas
    yy.collectNextVertex = undefined
  }
  debug(false)
  return vertex
}

/**
 * TODO: DUAL DECLARATION
 *
 * Usage: grammar/diagrammer.grammar
 *
 * Get current container
 * @param yy Lexer
 * @return {GraphContainer}
 */
export function getCurrentContainer (yy) {
  // no need for value, but runs init if missing
  getGraphCanvas(yy)
  return yy.CURRENTCONTAINER[yy.CURRENTCONTAINER.length - 1]
}

/**
 * Enter into a new container, set it as current container
 *
 * Usage: grammar/diagrammer.grammar
 *
 * @param yy lexer
 * @param {GraphContainer} container Set this container as current container
 * @return {GraphContainer}
 */
export function enterContainer (yy, container) {
  yy.CURRENTCONTAINER.push(container)
  return container
}

/**
 * Exit the current container
 * Return the previous one
 * Previous one also set as current container
 *
 * Usage: grammar/diagrammer.grammar
 *
 * @param yy lexer
 */
export function exitContainer (yy) {
  if (yy.CURRENTCONTAINER.length <= 1) { throw new Error('INTERNAL ERROR:Trying to exit ROOT container') }
  const currentContainer = yy.CURRENTCONTAINER.pop()
  currentContainer.exitvertex = yy.CONTAINER_EXIT++
  // TODO: digraph (or graphviz rather) visualizing empty subgraph breaks, it needs a node (invisible for instance)
  // digraph generator imlpements this by injecting empty invis node for all empty groups.
  // While this works, it does edit the graph, which is bad..
  return currentContainer
}

/**
 * Enter to a new parented sub graph
 * like in a>(b>c,d,e)>h
 *
 * Edit grammar so it edges a>b and c,d,e to h
 * Ie exit vertex(s) and entrance vertex(s) linked properly
 *
 * Usage: grammar/diagrammer.grammar
 */
export function enterSubGraph (yy) {
  return enterContainer(yy, _getSubGraph(yy))
}

/*
 * ie. o>(s1,s2,s3) nodes s1-s3 form a GraphInner (a subgraph)
 * Usage: grammar/diagrammer.grammar
 */
export function exitSubGraph (yy) {
  // Now should edit the ENTRANCE EDGE to point to a>b, a>d, a>e
  const currentSubGraphTypeCheckerFix = getCurrentContainer(yy)
  if (!(currentSubGraphTypeCheckerFix instanceof GraphInner)) {
    throw new Error(`Subgraph cannot be any other than GraphInner:${typeof (currentSubGraphTypeCheckerFix)}`)
  }
  /** @type {(GraphInner)} */
  const currentSubGraph = currentSubGraphTypeCheckerFix

  debug(`Exit subgraph ${currentSubGraph}`)
  /** @type {GraphEdge} */
  let edge = null

  let edgeIndex

  // If there's an edge that (RHS) points to current inner sub graph AND the graph has
  // entrance connectable and this edge (LHS) points to entrance node, then relink
  // this edge:
  // a>b>(c d>e f>g h)>(s>k)
  // activates for instance to 2nd edge (ie. one pointing from b to all of (c d>e..))
  // and also on 5th edge ie ..h)>(s..
  for (const idx in yy._EDGES) {
    if (!Object.prototype.hasOwnProperty.call(yy._EDGES, idx)) continue
    edge = yy._EDGES[idx]
    if (edge.right.name === currentSubGraph.name &&
            currentSubGraph._entrance instanceof GraphConnectable &&
            edge.left.name === currentSubGraph._entrance.name) {
      // remove this edge!
      edgeIndex = Number(idx)
      yy._EDGES.splice(edgeIndex, 1)
      // and then relink it to containers vertices that have no LEFT edges
      break
    }
    edge = null
  }

  if (edge !== null) {
    // and then relink it to containers vertices that have no LEFT edges
    // traverse
    for (const n in currentSubGraph._ROOTVERTICES) {
      if (!Object.prototype.hasOwnProperty.call(currentSubGraph._ROOTVERTICES, n)) continue
      const vertex = currentSubGraph._ROOTVERTICES[n]
      if (currentSubGraph._entrance && currentSubGraph._entrance instanceof GraphVertex) {
        // TODO: Assumes entrance is GraphVertex, but it looks it can be other things
        currentSubGraph._entrance._noedges = undefined
      }
      vertex._noedges = undefined
      const newEdge = getEdge(yy, edge.edgeType, currentSubGraph._entrance, vertex, edge.label,
        undefined, undefined, undefined, undefined, true)
      newEdge.container = currentSubGraph
      yy._EDGES.splice(edgeIndex++, 0, newEdge)
    }
  }

  /** @type {GraphConnectable} */
  let lastVertex

  // fix exits
  // {"link":{"edgeType":">","left":1,"right":"z","label":"from e and h"}}
  const exits = []
  traverseVertices(currentSubGraph, vertex => {
    lastVertex = vertex
    if (!hasOutwardEdge(yy, vertex)) {
      exits.push(vertex)
    }
  })

  debug(`exits ${exits}`)
  if (lastVertex) {
    currentSubGraph._setExit(lastVertex)
  }
  return exitContainer(yy)
}

/**
 * Create a NEW GROUP if one (ref) does not exist yet getGroup(yy) => create a
 * new anonymous group getGroup(yy,GroupRef) => create a new group if GroupRef
 * is not a Group or return GroupRef if it is...1
 *
 * Usage: grammar/diagrammer.grammar
 *
 * @param yy lexer
 * @param ref Type of reference, if group, return it
 * @return ref if ref instance of group, else the newly created group
 */
export function getGroup (yy, ref) {
  if (ref instanceof GraphGroup) return ref
  debug(`getGroup() NEW GROUP:${yy}/${ref}`, true)
  // TODO: MOVING TO GraphCanvas
  if (!yy.GROUPIDS) yy.GROUPIDS = 1
  const newGroup = new GraphGroup(String(yy.GROUPIDS++))
  debug(`push group ${newGroup} to ${yy}`)
  _pushObject(yy, newGroup)

  _getDefaultAttribute(yy, 'groupcolor', function (color) {
    newGroup.setColor(color)
  })
  debug(false)
  return newGroup
}

// Get an edge such that l links to r, return the added Edge or EDGES

/**
 * edgeType >,<,.>,<.,->,<-,<> l = left side, Vertex(xxx) or Group(yyy), or
 * Array(smthg) r = right side, Vertex(xxx) or Group(yyy), or Array(smthg) label =
 * if defined, LABEL for the edge color = if defined, COLOR for the edge
 *
 * if there is a list a>b,c,x,d;X then X is gonna be edge label for EVERYONE
 * but for a>"1"b,"2"c edge label is gonna be individual!
 *
 * Usage: grammar/diagrammer.grammar
 *
 * @param yy lexer
 * @param {string} edgeType Type of the edge(grammar)
 * @param {(GraphConnectable|GraphConnectable[])} lhs Left hand side (must be Array,Vertex,Group)
 * @param {(GraphConnectable|GraphConnectable[])} rhs Right hand side (must be Array,Vertex,Group)
 * @param {string} [inlineEdgeLabel] Optional label for the edge
 * @param {string} [commonEdgeLabel] Optional label for the edge
 * @param {string} [edgeColor] Optional color for the edge
 * @param {string} [lcompass] Left hand side compass value
 * @param {string} [rcompass] Reft hand side compass value
 * @param {boolean} [dontadd] Reft hand side compass value
 * @return {GraphEdge} the edge that got added
 */
export function getEdge (yy, edgeType, lhs, rhs, inlineEdgeLabel, commonEdgeLabel, edgeColor, lcompass, rcompass, dontadd) {
  let lastEdge
  const currentContainer = getCurrentContainer(yy)
  debug(true)
  if (rhs instanceof GraphInner && !rhs._getEntrance()) {
    rhs._setEntrance(lhs)
  }
  if (rhs instanceof GraphVertex) {
    // if RHS has no edges (and is contained in a container) AND found from ROOTVERTICES, remove it from ROOTVERTICES
    if (rhs._noedges && currentContainer) {
      debug(`REMOVE ${rhs} from root vertices of the container ${currentContainer}`)
      const idx = currentContainer._ROOTVERTICES.indexOf(rhs)
      if (idx >= 0) {
        const removed = currentContainer._ROOTVERTICES.splice(idx, 1)
        debug(`REMOVE ${removed} from ROOTVERTICES`)
      }
    }
    // TODO: Should noedges be set to GraphConnectable (except Edge..)
    // TODO: Also if this is an array, this assignment makes no sense
    // oddly this seems wrong, but removing breaks plantuml_context and plantuml_context2
    // And for plantuml context this is spot on..
    if (lhs instanceof GraphVertex) {
      lhs._noedges = undefined
    }
    rhs._noedges = undefined
  }
  if (currentContainer instanceof GraphInner &&
        !currentContainer._getEntrance() &&
        lhs instanceof GraphVertex &&
        !(rhs instanceof GraphInner)) {
    currentContainer._setEntrance(lhs)
  }

  if (lhs instanceof Array) {
    debug(`getEdge LHS array, type:${edgeType} l:[${lhs}] r:${rhs} inlineEdgeLabel:${inlineEdgeLabel} commonEdgeLabel: ${commonEdgeLabel} edgeColor:${edgeColor} lcompass:${lcompass} rcompass:${rcompass}`)
    for (let i = 0; i < lhs.length; i++) {
      debug(`    1Get edge ${lhs[i]}`)
      lastEdge = getEdge(yy, edgeType, lhs[i], rhs, inlineEdgeLabel, commonEdgeLabel, edgeColor, lcompass, rcompass)
    }
    debug(false)
    return lastEdge
  }
  if (rhs instanceof Array) {
    debug(`getEdge RHS array, type:${edgeType} l:${lhs} r:[${rhs}] inlineEdgeLabel:${inlineEdgeLabel} commonEdgeLabel: ${commonEdgeLabel} edgeColor:${edgeColor} lcompass:${lcompass} rcompass:${rcompass}`)
    for (let i = 0; i < rhs.length; i++) {
      debug(`    2Get edge ${rhs[i]}`)
      lastEdge = getEdge(yy, edgeType, lhs, rhs[i], inlineEdgeLabel, commonEdgeLabel, edgeColor, lcompass, rcompass)
    }
    debug(false)
    return lastEdge
  }
  {
    let fmt = ''
    if (inlineEdgeLabel) { fmt += `inlineEdgeLabel: ${inlineEdgeLabel}` }
    if (commonEdgeLabel) { fmt += `commonEdgeLabel: ${commonEdgeLabel}` }
    if (edgeColor) { fmt += `edgeColor: ${edgeColor}` }
    if (lcompass) { fmt += `lcompass: ${lcompass}` }
    if (rcompass) { fmt += `rcompass: ${rcompass}` }
    debug(`getEdge type:${edgeType} l:${lhs} r:${rhs}${fmt}`)
  }
  if (!(lhs instanceof GraphVertex) && !(lhs instanceof GraphGroup) && !(lhs instanceof GraphInner)) {
    throw new Error(`LHS not a Vertex,Group nor a SubGraph(LHS=${lhs}) RHS=(${rhs})`)
  }
  if (!(rhs instanceof GraphVertex) && !(rhs instanceof GraphGroup) && !(rhs instanceof GraphInner)) {
    throw new Error(`RHS not a Vertex,Group nor a SubGraph(LHS=${lhs}) RHS=(${rhs})`)
  }
  const edge = new GraphEdge(edgeType, lhs, rhs)

  if (lcompass) edge.lcompass = lcompass
  else if (getAttribute(lhs, 'compass')) edge.lcompass = getAttribute(lhs, 'compass')

  if (rcompass) edge.rcompass = rcompass
  else if (getAttribute(rhs, 'compass')) edge.rcompass = getAttribute(rhs, 'compass')

  _getDefaultAttribute(yy, 'edgecolor', function (edgeColor) {
    edge.setColor(edgeColor)
  })
  _getDefaultAttribute(yy, 'edgetextcolor', function (edgeColor) {
    edge.setTextColor(edgeColor)
  })
  if (commonEdgeLabel) {
    edge.setLabel(commonEdgeLabel)
    debug(`  set commonEdgeLabel ${commonEdgeLabel}`)
  }
  if (inlineEdgeLabel) {
    edge.setLabel(inlineEdgeLabel)
    debug(`  set inlineEdgeLabel ${inlineEdgeLabel}`)
  } else if (rhs instanceof GraphVertex && commonEdgeLabel) {
    edge.setLabel(commonEdgeLabel)
    debug(`  set commonEdgeLabel ${commonEdgeLabel}`)
  }
  if (rhs instanceof GraphVertex) {
    const tmp = rhs._getEdgeLabel()
    if (tmp) {
      edge.setLabel(tmp)
      debug(`  reset edge label to ${tmp}`)
    }
  }
  if (edgeColor) edge.setColor(edgeColor)

  if (!dontadd) {
    _addEdge(yy, edge)
  }
  debug(false)
  return edge
}

// =====================================
// exposed to generators also
// =====================================

/**
 * Get current singleton graphcanvas or create new one
 * External utility support for generator
 *
 * Usage: grammar/diagrammer.grammar, generators
 * @return {GraphCanvas}
 */
export function getGraphCanvas (yy) {
  if (!yy.GRAPHCANVAS) {
    if (!yy.result) {
      throw new Error('Initialization has failed!')
    }
    debug(`...Initialize emptyroot ${yy}`)
    // TODO: DOESN'T WORK as type hint! Modularize to own obj..
    /** @type  {GraphContainer} */
    yy.CURRENTCONTAINER = []
    /** @type {GraphEdge[]} */
    yy._EDGES = []
    /** @type {number} */
    yy.CONTAINER_EXIT = 1
    /** @type  {GraphCanvas} */
    yy.GRAPHCANVAS = new GraphCanvas()
    enterContainer(yy, yy.GRAPHCANVAS)
  }
  return yy.GRAPHCANVAS
}

/**
 * Usage: grammar/diagrammer.grammar, generators/digraph.js
 * @param {GraphConnectable} vertex
 */
export function hasOutwardEdge (yy, vertex) {
  // TODO: Replace with traverseEdges&GraphCanvas
  for (const i in yy._EDGES) {
    if (!Object.prototype.hasOwnProperty.call(yy._EDGES, i)) continue
    const edge = yy._EDGES[i]
    if (edge.left.name === vertex.name) {
      return true
    }
  }
  return false
}

// /**
//  * return true if vertex has inward edge OUTSIDE container it is in
//  * @param {GraphConnectable} vertex
//  * @param {GraphContainer} verticesContainer (Group?)
//  */
// function hasInwardEdge (yy, vertex, verticesContainer) {
//   for (const i in yy.EDGES) {
//     if (!Object.prototype.hasOwnProperty.call(yy.EDGES, i)) continue
//     const edge = yy.EDGES[i]
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
 * @param {GraphCanvas} graphcanvas
 * @param {function(GraphEdge):void} callback
 * @return {any}
 */
export function traverseEdges (graphcanvas, callback) {
  debug(`${graphcanvas._ROOTVERTICES}`)
  for (const i in graphcanvas._EDGES) {
    if (!Object.prototype.hasOwnProperty.call(graphcanvas._EDGES, i)) continue
    const ret = callback(graphcanvas._EDGES[i])
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
export function traverseVertices (container, callback) {
  for (const i in container._OBJECTS) {
    if (!Object.prototype.hasOwnProperty.call(container._OBJECTS, i)) continue
    // this can only be GraphVertex|GraphGroup|GraphInner
    // didn't figure out how to keep typechecker happy now (TODO:)
    const obj = container._OBJECTS[i]
    // just to keep linter happy... Also Inner is always Group, so not necessary
    if (obj instanceof GraphContainer || obj instanceof GraphVertex) {
      const ret = callback(obj)
      if (ret !== undefined) {
        return ret
      }
    }
  }
}

// =====================================
// only model.js
// =====================================

/**
 * Return all the variables from the collection (hard coded to yy)
 */
function _getVariables (yy) {
  if (!yy.VARIABLES) {
    // TODO: MOVING TO GraphCanvas
    yy.VARIABLES = {}
  }
  return yy.VARIABLES
}

/**
 * Get default attribute vertexcolor,edgecolor,groupcolor and bubble upwards if
 * otherwise 'unobtainable'
 *
 * @param yy lexer
 * @param {string} attrname Name of the default attribute. If not found, returns undefined
 * @param {function(string):void} [callback] Pass the attribute to the this function as only argument - if attribute WAS actually defined!
 * @return {string}
 */
function _getDefaultAttribute (yy, attrname, callback) {
  // no need for the value, but runs init if missing
  getGraphCanvas(yy)
  for (const i in yy.CURRENTCONTAINER) {
    if (!Object.prototype.hasOwnProperty.call(yy.CURRENTCONTAINER, i)) continue
    const ctr = yy.CURRENTCONTAINER[i]
    const defaultAttribute = ctr.getDefault(attrname)
    if (defaultAttribute) {
      if (callback) { callback(defaultAttribute) }
      return defaultAttribute
    }
  }
  const defaultAttribute = getGraphCanvas(yy).getDefault(attrname)
  if (defaultAttribute) {
    debug('_getDefaultAttribute got from graphcanvas')
    if (callback) { callback(defaultAttribute) }
    return defaultAttribute
  }
  return undefined
}

/**
 * Create a new sub graph or return passed in reference (if it is a subgraph)
 * @param {GraphInner} [ref]
 */
function _getSubGraph (yy, ref) {
  if (ref instanceof GraphInner) return ref
  if (!yy.SUBGRAPHS) yy.SUBGRAPHS = 1
  const newSubGraph = new GraphInner(String(yy.SUBGRAPHS++))
  _pushObject(yy, newSubGraph)
  return newSubGraph
}

/**
 * Add edge to the list of edges, return the Edge
 * @param yy lexer
 * @param {(GraphEdge[]|GraphEdge)} edge Edge (Edge or Edge[])
 * @return {(GraphEdge[]|GraphEdge)} Return What ever passed in
 */
function _addEdge (yy, edge) {
  if (edge instanceof Array) {
    debug(`PUSH EDGE ARRAY:${edge}`, true)
  } else {
    debug(`PUSH EDGE:${edge}`, true)
    edge.container = getCurrentContainer(yy)
  }
  yy._EDGES.push(edge)
  debug(false)
  return edge
}

/**
 * Push given object into a current container
 * @param {(GraphVertex|GraphContainer)} o
 */
function _pushObject (yy, o) {
  const cnt = getCurrentContainer(yy)
  debug(`_pushObject ${o}to ${cnt}`, true)
  cnt._OBJECTS.push(o)
  debug(`PUSHING OBJECT ${o} to ROOTVERTICES`)
  cnt._ROOTVERTICES.push(o)
  debug(false)
  return o
}
