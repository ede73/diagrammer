// @ts-check
import { GraphCanvas } from '../model/graphcanvas.js'
import { GraphContainer } from '../model/graphcontainer.js'
import { GraphEdge } from '../model/graphedge.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphInner } from '../model/graphinner.js'
import { GraphVertex } from '../model/graphvertex.js'
import { debug, getAttribute } from '../model/support.js'
import { GraphConnectable } from './graphconnectable.js'
import { GraphReference } from './graphreference.js'
import { hasOutwardEdge } from './traversal.js'

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
 * @param variable ${XXX:zzz} assignment or ${XXX} query
 */
export function _processVariable(graphCanvas: GraphCanvas, variable: string) {
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
    _getVariables(graphCanvas)[tmp[0]] = tmp[1]
    return tmp[1]
  } else {
    // referral
    if (!_getVariables(graphCanvas)[vari]) {
      throw new Error(`Variable ${vari} not defined`)
    }
    return _getVariables(graphCanvas)[vari]
  }
}

/**
 * Create an array, push LHS,RHS vertices there and return the array as long as
 * processing the list vertices added to array..
 *
 * Usage: grammar/diagrammer.grammar
 *
 * @param lhs left hand side of the list
 * @param rhs right hand side of the list
 * @param rhsEdgeLabel optional RHS label
 */
export function _getList(graphCanvas: GraphCanvas,
  lhs: (GraphConnectable | GraphConnectable[]),
  rhs: GraphConnectable,
  rhsEdgeLabel?: string): (GraphConnectable | GraphConnectable[]) {
  if (lhs instanceof GraphVertex) {
    debug(`_getList(vertex:${lhs},rhs:[${rhs}])`, true)
    const lst: (GraphConnectable | GraphConnectable[]) = []
    lst.push(lhs)
    const rhsFound = _getVertex(graphCanvas, rhs as GraphVertex)
    if (rhsEdgeLabel && (rhsFound instanceof GraphGroup || rhsFound instanceof GraphVertex)) {
      rhsFound._setEdgeLabel(rhsEdgeLabel)
    }
    lst.push(rhsFound)
    debug(`return vertex:${lst}`, false)
    return lst
  } else if (lhs instanceof GraphGroup) {
    debug(`_getList(group:[${lhs}],rhs:${rhs})`, true)
    const lst = []
    lst.push(lhs)
    if (!(rhs instanceof GraphContainer)) {
      throw new Error("RHS must be container");
    }
    const grp = _getGroup(graphCanvas, rhs)
    if (rhsEdgeLabel) {
      grp._setEdgeLabel(rhsEdgeLabel)
    }
    lst.push(grp)
    debug(`return group:${lst}`, false)
    return lst
  }
  if (!(lhs instanceof Array)) {
    throw new Error('_getList requires LHS to be Vertex, Group or Array')
  }
  debug(`_getList(lhs:[${lhs}],rhs:${rhs}`, true)
  // LHS not a vertex..
  const rhsFound = _getVertex(graphCanvas, rhs as GraphVertex)
  if (rhsEdgeLabel && (rhsFound instanceof GraphGroup || rhsFound instanceof GraphVertex)) {
    rhsFound._setEdgeLabel(rhsEdgeLabel)
  }
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
 * @param objOrName Reference, Vertex/(never observed Array)/Group
 * @param  [style] OPTIONAL if style given, update (only if name refers to vertex)
 */
export function _getVertex(graphCanvas: GraphCanvas, objOrName: (string | GraphVertex), style?: string): GraphConnectable {
  debug(`_getVertex (name:${objOrName}, style:${style})`, true)

  function findVertexCreateIfMissing(graphCanvas: GraphCanvas, vertexOrName: (string | GraphConnectable), style?: string) {
    if (vertexOrName instanceof GraphVertex) {
      if (style) vertexOrName.setStyle(style)
      return vertexOrName
    }
    const rhsObjectName = vertexOrName as string

    const rhsConnectable = (function locateVertex(container: GraphContainer): GraphVertex | GraphGroup | undefined {
      if (container instanceof GraphGroup && container.getName() == rhsObjectName) {
        return container
      }
      for (const node of container.getObjects()) {
        if (node instanceof GraphVertex && node.getName() === rhsObjectName) {
          return node
        } else if (node instanceof GraphGroup) {
          const found = locateVertex(node)
          if (found) return found
        }
      }
    }(graphCanvas))

    if (rhsConnectable) {
      if (rhsConnectable instanceof GraphVertex && style) {
        rhsConnectable.setStyle(style)
      }
      // if vertex was found, return it, ELSE it will be added to current container
      // While this works perfectly for pretty much ALL graph/visualizing engines (ie. vertex is instantiated/declared where it is seen)
      // Some engines (nwdiag) DO want to see the vertex in the group as well
      // a-b { b} draws a different graph in nwdiag if b is also in the group, like a--b network 1 {} vs, a--b network 1 {b}
      // And to be precise this is violation of the language as well! We DO have the vertex IN the group, even if it was declared at the top
      // TODO: Fix this, without breaking all other generators, introduce Reference wrapper (GraphReference(GraphVertex))
      // This allows filtering it out in all traversal code, but allows nwdiag see the REFERENCE
      const ret = _maybePushToCurrentContainerAsReference(graphCanvas, rhsConnectable)
      debug(`_getVertex return ${rhsConnectable.getName()}/${rhsConnectable.constructor.name} vs ${ret.getName()}${ret.constructor.name}`, false)
      return ret // foundConnectable
    }
    debug(`Create new vertex name=${rhsObjectName}`, true)
    const vertex = new GraphVertex(rhsObjectName, graphCanvas.getCurrentShape())
    if (style) vertex.setStyle(style)
    vertex._noedges = true

    _getDefaultAttribute(graphCanvas, 'vertexcolor', (color: string) => {
      vertex.setColor(color)
    })
    _getDefaultAttribute(graphCanvas, 'vertextextcolor', (color: string) => {
      vertex.setTextColor(color)
    })
    debug(false)
    return graphCanvas._getCurrentContainer().addObject(vertex)
  }

  const vertex = findVertexCreateIfMissing(graphCanvas, objOrName, style)
  debug(`  in getVertex gotVertex ${vertex} / ${vertex.getName()}/${vertex.constructor.name}`)
  graphCanvas.lastSeenVertex = vertex
  if (graphCanvas._nextConnectableToExitEndIf) {
    debug('Collect next vertex')
    // TODO: make vertex? Do we know that it is vertex(yet?)
    graphCanvas._nextConnectableToExitEndIf._conditionalExitEdge = vertex
    graphCanvas._nextConnectableToExitEndIf = undefined
  }
  debug(false)
  return vertex
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
export function _enterSubGraph(graphCanvas: GraphCanvas) {
  const subgraph = _getSubGraph(graphCanvas)
  return graphCanvas._enterContainer(subgraph)
}

/*
 * ie. o>(s1,s2,s3) nodes s1-s3 form a GraphInner (a subgraph)
 * Usage: grammar/diagrammer.grammar
 */
export function _exitSubGraph(graphCanvas: GraphCanvas) {
  // Now should edit the ENTRANCE EDGE to point to a>b, a>d, a>e
  const currentSubGraphTypeCheckerFix = graphCanvas._getCurrentContainer()
  if (!(currentSubGraphTypeCheckerFix instanceof GraphInner)) {
    throw new Error(`Subgraph cannot be any other than GraphInner:${typeof (currentSubGraphTypeCheckerFix)}`)
  }
  const currentSubGraph: GraphInner = currentSubGraphTypeCheckerFix

  debug(`Exit subgraph ${currentSubGraph}`)
  let edgeAndItsIndex: [GraphEdge, number] | undefined

  // If there's an edge that (RHS) points to current inner sub graph AND the graph has
  // entrance connectable and this edge (LHS) points to entrance node, then relink
  // this edge:
  // a>b>(c d>e f>g h)>(s>k)
  // activates for instance to 2nd edge (ie. one pointing from b to all of (c d>e..))
  // and also on 5th edge ie ..h)>(s..
  for (const idx in graphCanvas._EDGES) {
    if (!Object.prototype.hasOwnProperty.call(graphCanvas._EDGES, idx)) continue
    const candidateEdge = graphCanvas._EDGES[idx]
    if (candidateEdge.right.name === currentSubGraph.name &&
      currentSubGraph._entrance instanceof GraphConnectable &&
      candidateEdge.left.name === currentSubGraph._entrance.name) {
      // remove this edge!
      const edgeIndex = Number(idx)
      edgeAndItsIndex = [candidateEdge, edgeIndex]
      graphCanvas._EDGES.splice(edgeIndex, 1)
      // and then relink it to containers vertices that have no LEFT edges
      break
    }
  }

  if (edgeAndItsIndex) {
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
      const newEdge = _getEdge(graphCanvas, edgeAndItsIndex[0].edgeType, currentSubGraph._entrance as (GraphConnectable | GraphConnectable[]), vertex, edgeAndItsIndex[0].label,
        undefined, undefined, undefined, undefined, true)
      newEdge.container = currentSubGraph
      graphCanvas._EDGES.splice(edgeAndItsIndex[1]++, 0, newEdge)
    }
  }

  let lastVertex: GraphConnectable | undefined

  // fix exits
  // {"link":{"edgeType":">","left":1,"right":"z","label":"from e and h"}}
  const exits: GraphConnectable[] = []
  currentSubGraph.getObjects().forEach(vertex => {
    lastVertex = vertex
    if (!hasOutwardEdge(graphCanvas, vertex)) {
      exits.push(vertex)
    }
  })

  debug(`exits ${exits}`)
  if (lastVertex) {
    currentSubGraph._setExit(lastVertex)
  }
  return graphCanvas._exitContainer()
}

/**
 * Create a NEW GROUP if one (ref) does not exist yet getGroup(..) => create a
 * new anonymous group getGroup(.., GroupRef) => create a new group if GroupRef
 * is not a Group or return GroupRef if it is...1
 *
 * Usage: grammar/diagrammer.grammar
 *
 * @param ref Type of reference, if group, return it
 * @return ref if ref instance of group, else the newly created group
 */
export function _getGroup(graphCanvas: GraphCanvas, ref: GraphContainer): GraphContainer {
  if (ref instanceof GraphGroup) return ref
  debug(`_getGroup() ref:${ref}`, true)
  const newGroup = new GraphGroup(String(graphCanvas.GROUPIDS++))
  debug(`pushgroup ${newGroup}`)
  graphCanvas._getCurrentContainer().addObject(newGroup)

  _getDefaultAttribute(graphCanvas, 'groupcolor', (color: string) => {
    newGroup.setColor(color)
  })
  debug(false)
  return newGroup
}

// Get an edge such that l links to r, return the added Edge or EDGES

/**
 * edgeType >,<,.>,<.,->,<-,<> l = left side, Vertex(xxx) or Group(zzz), or
 * Array(smthg) r = right side, Vertex(xxx) or Group(zzz), or Array(smthg) label =
 * if defined, LABEL for the edge color = if defined, COLOR for the edge
 *
 * if there is a list a>b,c,x,d;X then X is gonna be edge label for EVERYONE
 * but for a>"1"b,"2"c edge label is gonna be individual!
 *
 * Usage: grammar/diagrammer.grammar
 *
 * @param edgeType Type of the edge(grammar)
 * @param lhs Left hand side (must be Array,Vertex,Group)
 * @param rhs Right hand side (must be Array,Vertex,Group)
 * @param [inlineEdgeLabel] Optional label for the edge
 * @param [commonEdgeLabel] Optional label for the edge
 * @param [edgeColor] Optional color for the edge
 * @param [lcompass] Left hand side compass value
 * @param [rcompass] Reft hand side compass value
 * @param [dontadd] Reft hand side compass value
 * @return the edge that got added
 */
export function _getEdge(graphCanvas: GraphCanvas,
  edgeType: string, lhs: (GraphConnectable | GraphConnectable[]),
  rhs: (GraphConnectable | GraphConnectable[]),
  inlineEdgeLabel?: string,
  commonEdgeLabel?: string,
  edgeColor?: string,
  lcompass?: string,
  rcompass?: string,
  dontadd?: boolean): GraphEdge {

  const currentContainer = graphCanvas._getCurrentContainer()
  debug(`_getEdge edgeType=${edgeType} lhs=${lhs}/${lhs.constructor.name} rhs=${rhs} inlineEdgeLabel=${inlineEdgeLabel} commonEdgeLabel=${commonEdgeLabel} edgeColor=${edgeColor} lcompass=${lcompass} rcompass=${rcompass} dontadd=${dontadd}`, true)
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

  // This will NEVER be undefined here, _getEdge always finds or makes an edge, just to satisfy typechecker
  let lastEdge: GraphEdge | undefined
  if (lhs instanceof Array) {
    debug(`getEdge LHS array, type:${edgeType} l:[${lhs}] r:${rhs} inlineEdgeLabel:${inlineEdgeLabel} commonEdgeLabel: ${commonEdgeLabel} edgeColor:${edgeColor} lcompass:${lcompass} rcompass:${rcompass}`)
    for (let i = 0; i < lhs.length; i++) {
      debug(`    1Get edge ${lhs[i]}`)
      lastEdge = _getEdge(graphCanvas, edgeType, lhs[i], rhs, inlineEdgeLabel, commonEdgeLabel, edgeColor, lcompass, rcompass)
    }
    debug(false)
    return lastEdge as GraphEdge
  }
  if (rhs instanceof Array) {
    debug(`getEdge RHS array, type:${edgeType} l:${lhs} r:[${rhs}] inlineEdgeLabel:${inlineEdgeLabel} commonEdgeLabel: ${commonEdgeLabel} edgeColor:${edgeColor} lcompass:${lcompass} rcompass:${rcompass}`)
    for (let i = 0; i < rhs.length; i++) {
      debug(`    2Get edge ${rhs[i]}`)
      lastEdge = _getEdge(graphCanvas, edgeType, lhs, rhs[i], inlineEdgeLabel, commonEdgeLabel, edgeColor, lcompass, rcompass)
    }
    debug(false)
    return lastEdge as GraphEdge
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
  if (!(lhs instanceof GraphVertex) && !(lhs instanceof GraphGroup) && !(lhs instanceof GraphInner) && !(lhs instanceof GraphReference)) {
    throw new Error(`LHS not a Vertex,Group nor a SubGraph(LHS=${lhs}) RHS=(${rhs})`)
  }
  if (!(rhs instanceof GraphVertex) && !(rhs instanceof GraphGroup) && !(rhs instanceof GraphInner) && !(rhs instanceof GraphReference)) {
    throw new Error(`RHS not a Vertex,Group nor a SubGraph(LHS=${lhs}) RHS=(${rhs})`)
  }
  const edge = new GraphEdge(edgeType, lhs, rhs)

  if (lcompass) edge.lcompass = lcompass
  else if (getAttribute(lhs, 'compass')) edge.lcompass = getAttribute(lhs, 'compass')

  if (rcompass) edge.rcompass = rcompass
  else if (getAttribute(rhs, 'compass')) edge.rcompass = getAttribute(rhs, 'compass')

  _getDefaultAttribute(graphCanvas, 'edgecolor', (edgeColor: string) => {
    edge.setColor(edgeColor)
  })
  _getDefaultAttribute(graphCanvas, 'edgetextcolor', (edgeColor: string) => {
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
    _addEdge(graphCanvas, edge)
  }
  debug(false)
  return edge
}

// =====================================
// only model.js
// =====================================

/**
 * Return all the variables from the collection
 * @param {GraphCanvas} graphCanvas
 */
function _getVariables(graphCanvas: GraphCanvas) {
  return graphCanvas.VARIABLES
}

/**
 * Get default attribute vertexcolor,edgecolor,groupcolor and bubble upwards if
 * otherwise 'unobtainable'
 *
 * @param graphCanvas
 * @param attrname Name of the default attribute. If not found, returns undefined
 * @param  [callback] Pass the attribute to the this function as only argument - if attribute WAS actually defined!
 */
function _getDefaultAttribute(graphCanvas: GraphCanvas, attrname: string, callback?: (defaultAttr: string) => void): string | undefined {
  for (const i in graphCanvas.CURRENTCONTAINER) {
    if (!Object.prototype.hasOwnProperty.call(graphCanvas.CURRENTCONTAINER, i)) continue
    const ctr = graphCanvas.CURRENTCONTAINER[i]
    // inner groups have no defaults
    if (ctr instanceof GraphGroup) {
      const defaultAttribute = ctr.getDefault(attrname)
      if (defaultAttribute) {
        if (callback) { callback(defaultAttribute) }
        return defaultAttribute
      }
    }
  }
  const defaultAttribute = graphCanvas.getDefault(attrname)
  if (defaultAttribute) {
    debug('_getDefaultAttribute got from graphcanvas')
    if (callback) { callback(defaultAttribute) }
    return defaultAttribute
  }
  return undefined
}

/**
 * Create a new sub graph or return passed in reference (if it is a subgraph)
 * GraphInner>GraphGroup>GraphContainer>GraphConnectable
 */
function _getSubGraph(graphCanvas: GraphCanvas) {
  const newSubGraph = new GraphInner(String(graphCanvas.SUBGRAPHS++))
  graphCanvas._getCurrentContainer().addObject(newSubGraph)
  return newSubGraph
}

/**
 * Add edge to the list of edges, return the Edge
 */
function _addEdge(graphCanvas: GraphCanvas, edge: (GraphEdge[] | GraphEdge)): (GraphEdge[] | GraphEdge) {
  if (edge instanceof Array) {
    // TODO: No longer happens..remove
    debug(`PUSH EDGE ARRAY:${edge}`, true)
    throw new Error('xx')
  } else {
    debug(`PUSH EDGE:${edge}`, true)
    edge.container = graphCanvas._getCurrentContainer()
  }
  graphCanvas._EDGES.push(edge)
  debug(false)
  return edge
}

function _maybePushToCurrentContainerAsReference(graphCanvas: GraphCanvas, referred: GraphConnectable) {
  const cnt = graphCanvas._getCurrentContainer()
  if (!(cnt instanceof GraphGroup)) {
    // if current container is anything but a group, just return the same now
    return referred
  }
  const nodes = cnt.getObjects(true)
  const alreadyIncluded = nodes.filter(n => n.getName() === referred.getName()) // OK
  if (alreadyIncluded.length > 0) {
    debug(` This group (${cnt.getName()}) already has this named node in it, so just bail out`)
    return referred
  }
  debug(`  Add GraphReference(${referred.getName()}) to group (${cnt.getName()})`)
  const ref = new GraphReference(referred.getName() as string)
  cnt.addObject(ref)
  return ref
}
