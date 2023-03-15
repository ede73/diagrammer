// @ts-check
import { type GraphCanvas } from '../model/graphcanvas.js'
import { GraphContainer } from '../model/graphcontainer.js'
import { GraphEdge } from '../model/graphedge.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphInner } from '../model/graphinner.js'
import { GraphVertex } from '../model/graphvertex.js'
import { getAttribute } from '../model/support.js'
import { GraphConnectable } from './graphconnectable.js'
import { GraphReference } from './graphreference.js'
import { hasOutwardEdge } from './traversal.js'
import { debug } from './debug.js'
import { GraphConditional } from './graphconditional.js'
import { GraphLoop } from './graphloop.js'

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
  const parsingContext = graphCanvas.parsingContext
  if (vari.includes(':')) {
    // Assignment
    const tmp = vari.split(':')
    parsingContext.VARIABLES[tmp[0]] = tmp[1]
    return tmp[1]
  } else {
    // referral
    if (!parsingContext.VARIABLES[vari]) {
      throw new Error(`Variable ${vari} not defined`)
    }
    return parsingContext.VARIABLES[vari]
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
    debug(`_getList(vertex:${String(lhs)},rhs:[${String(rhs)}])`, true)
    const lst: (GraphConnectable | GraphConnectable[]) = []
    lst.push(lhs)
    const rhsFound = _getVertexOrGroup(graphCanvas, rhs as GraphVertex)
    if (rhsEdgeLabel && (rhsFound instanceof GraphGroup || rhsFound instanceof GraphVertex)) {
      rhsFound._setEdgeLabel(rhsEdgeLabel)
    }
    lst.push(rhsFound)
    debug(`return vertex:${String(lst)}`, false)
    return lst
  } else if (lhs instanceof GraphGroup) {
    debug(`_getList(group:[${String(lhs)}],rhs:${String(rhs)})`, true)
    const lst = []
    lst.push(lhs)
    if (!(rhs instanceof GraphContainer)) {
      throw new Error('RHS must be container')
    }
    const grp = _getGroupOrMakeNew(graphCanvas, rhs)
    if (rhsEdgeLabel) {
      grp._setEdgeLabel(rhsEdgeLabel)
    }
    lst.push(grp)
    debug(`return group:${String(lst)}`, false)
    return lst
  }
  if (!(lhs instanceof Array)) {
    throw new Error('_getList requires LHS to be Vertex, Group or Array')
  }
  debug(`_getList ((array)lhs:[${String(lhs)}],rhs:${String(rhs)}`, true)
  // LHS not a vertex..
  const rhsFound = _getVertexOrGroup(graphCanvas, rhs as GraphVertex)
  if (rhsEdgeLabel && (rhsFound instanceof GraphGroup || rhsFound instanceof GraphVertex)) {
    rhsFound._setEdgeLabel(rhsEdgeLabel)
  }
  lhs.push(rhsFound)
  debug(`return [${String(lhs)}]`, false)
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
export function _getVertexOrGroup(graphCanvas: GraphCanvas, objOrName: (string | GraphVertex), style?: string): GraphConnectable {
  debug(`_getVertexOrGroup (name:${String(objOrName)}, style:${String(style)})`, true)
  const parsingContext = graphCanvas.parsingContext
  const node = findOrCreateVertex(graphCanvas, objOrName, style)
  debug(`in _getVertexOrGroup got ${String(node)} / ${node.getName()}/${node.constructor.name}`)
  parsingContext.lastSeenVertex = node
  if (parsingContext._nextConnectableToExitEndIf && (node instanceof GraphConnectable)) {
    parsingContext._nextConnectableToExitEndIf._conditionalExitEdge = node
    parsingContext._nextConnectableToExitEndIf = undefined
  }
  debug(false)
  return node
}

function locateVertex(container: GraphContainer, rhsObjectName: string): GraphVertex | GraphGroup | undefined {
  if (container instanceof GraphGroup && container.getName() === rhsObjectName) {
    return container
  }
  for (const node of container.getObjects()) {
    if (node instanceof GraphVertex && node.getName() === rhsObjectName) {
      return node
    } else if (node instanceof GraphGroup) { // TODO: why not inner? SHouldn't this be container? According to same philosophy
      const found = locateVertex(node, rhsObjectName)
      if (found) return found
    }
  }
}

function findOrCreateVertex(graphCanvas: GraphCanvas, vertexOrName: (string | GraphConnectable), style?: string): GraphConnectable {
  if (vertexOrName instanceof GraphVertex) {
    if (style) vertexOrName.setStyle(style)
    return vertexOrName
  }

  const rhsObjectName = vertexOrName as string

  const rhsConnectable = locateVertex(graphCanvas, rhsObjectName)
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
    debug(`_getVertexOrGroup return ${rhsConnectable.getName()}/${rhsConnectable.constructor.name} vs ${ret.getName()}${ret.constructor.name}`, false)
    return ret // foundConnectable
  }

  // not found, so create vertex
  debug(`Create new vertex name=${rhsObjectName}`, true)
  const vertex = new GraphVertex(rhsObjectName, graphCanvas.parsingContext._getCurrentContainer(), graphCanvas.getCurrentShape(), style)

  debug(false)
  return graphCanvas.parsingContext._getCurrentContainer().addObject(vertex) as GraphVertex
}

/**
 * Enter to a new parented inner graph
 * like in a>(b>c,d,e)>h
 *
 * Edit grammar so it edges a>b and c,d,e to h
 * Ie exit vertex(s) and entrance vertex(s) linked properly
 *
 * Usage: grammar/diagrammer.grammar
 */
export function _enterNewGraphInner(graphCanvas: GraphCanvas): GraphInner {
  const newGraphInner = new GraphInner(String(graphCanvas.parsingContext.GRAPHINNER_INDEX++), graphCanvas.parsingContext._getCurrentContainer())
  graphCanvas.parsingContext._getCurrentContainer().addObject(newGraphInner)
  return graphCanvas.parsingContext._enterContainer(newGraphInner) as GraphInner
}

/*
 * ie. o>(s1,s2,s3) nodes s1-s3 form a GraphInner (am inner graph)
 * Usage: grammar/diagrammer.grammar
 */
export function _exitCurrentGraphInner(graphCanvas: GraphCanvas) {
  // Now should edit the ENTRANCE EDGE to point to a>b, a>d, a>e
  const currentGraphInner = graphCanvas.parsingContext._getCurrentContainer()
  if (!(currentGraphInner instanceof GraphInner)) {
    throw new Error(`Inner Graph cannot be any other than GraphInner:${typeof (currentGraphInner)}`)
  }

  relinkGraphInnerEntryAndExit(graphCanvas, currentGraphInner)

  let lastVertex: GraphConnectable | undefined

  // fix exits
  // {"link":{"edgeType":">","left":1,"right":"z","label":"from e and h"}}
  const exits: GraphConnectable[] = []
  currentGraphInner.getObjects().forEach(vertex => {
    lastVertex = vertex
    if (!hasOutwardEdge(graphCanvas, vertex)) {
      exits.push(vertex)
    }
  })

  debug(`exits ${String(exits)}`)
  if (lastVertex) {
    currentGraphInner._setExit(lastVertex)
  }
  debug(`Exit innergraph ${String(currentGraphInner)}`)
  return graphCanvas.parsingContext._exitContainer()
}

// TODO: see if this could be done also at the end of the graph
function relinkGraphInnerEntryAndExit(graphCanvas: GraphCanvas, currentGraphInner: GraphInner) {
  let edgeAndItsIndex: [GraphEdge, number] | undefined
  debug(`relinkGraphInnerEntryAndExit ${String(currentGraphInner)}`)

  // If there's an edge that (RHS) points to current inner (GraphInner) AND the graph has
  // entrance connectable and this edge (LHS) points to entrance node, then relink
  // this edge:
  // a>b>(c d>e f>g h)>(s>k)
  // activates for instance to 2nd edge (ie. one pointing from b to all of (c d>e..))
  // and also on 5th edge ie ..h)>(s..
  for (const candidateEdge of graphCanvas.getEdges()) {
    if (candidateEdge.right.name === currentGraphInner.name &&
      currentGraphInner._entrance instanceof GraphConnectable &&
      candidateEdge.left.name === currentGraphInner._entrance.name) {
      debug(`  Remove edge ${String(candidateEdge)}`)
      // remove this edge!
      const edgeIndex = graphCanvas.removeEdge(candidateEdge)
      // and then relink it to containers vertices that have no LEFT edges
      edgeAndItsIndex = [candidateEdge, edgeIndex]
      break
    }
  }

  if (edgeAndItsIndex) {
    // and then relink it to containers vertices that have no LEFT edges
    // traverse
    for (const vertex of currentGraphInner._ROOTVERTICES) {
      if (currentGraphInner._entrance && currentGraphInner._entrance instanceof GraphVertex) {
        // TODO: Assumes entrance is GraphVertex, but it looks it can be other things
        currentGraphInner._entrance._noedges = undefined
      }
      vertex._noedges = undefined
      const newEdge = _getEdge(
        graphCanvas,
        edgeAndItsIndex[0].edgeType,
        currentGraphInner._entrance as (GraphConnectable | GraphConnectable[]),
        vertex,
        edgeAndItsIndex[0].label,
        undefined,
        edgeAndItsIndex[0].color,
        edgeAndItsIndex[0].lcompass,
        edgeAndItsIndex[0].rcompass,
        true)
      debug(`  Add new edge ${String(newEdge)}`)
      graphCanvas.insertEdge(edgeAndItsIndex[1]++, newEdge)
    }
  }
}

/**
 * Placeholder for making a true GraphConditional
 * ie. if/elseif/elseif.../else/endif
 *
 * Will replace ^(if|elseif|else|endif) and then$ with ''
 *
 * Every container returned is current container, and before making a new container here, current one is EXITED.
 * Exception being if, it's the first one, not exiting current container, and endif, it's the last, it will return the
 * container before entering the if
 * TODO: GraphConditional has to be a container of containers actually, ie. each section if/elseif../else are own groups
 *
 * @param type if/elseif/else
 * @param label Anything between ^(if|elseif|else|endif) and then$
 */
export function _getGroupConditionalOrMakeNew(graphCanvas: GraphCanvas, type: string, label: string) {
  const currentContainer = graphCanvas.parsingContext._getCurrentContainer()
  return new GraphConditional(graphCanvas, type, label, currentContainer)
}

export function _getGroupLoopOrMakeNew(graphCanvas: GraphCanvas, type: string, label: string) {
  const currentContainer = graphCanvas.parsingContext._getCurrentContainer()
  return new GraphLoop(graphCanvas, type, label, currentContainer)
}

/**
 * Create a NEW GROUP if one (ref) does not exist yet getGroup(..) => create a
 * new anonymous group getGroup(.., GroupRef) => create a new group if GroupRef
 * is not a Group or return GroupRef if it is...1
 *
 * Usage: grammar/diagrammer.grammar
 *
 * @param ref Type of reference, if group, return it, TODO: get rid, confusing, find the group in the callsite
 * @param name If given, will be name of this group, otherwise group get's automatic name (that cannot be referred in the language)
 * @return ref if ref instance of group, else the newly created group
 */
export function _getGroupOrMakeNew(graphCanvas: GraphCanvas, ref?: GraphContainer, name?: string): GraphContainer {
  if (ref instanceof GraphGroup) return ref
  debug(`_getGroup() ref:${String(ref)}`)
  const currenContainer = graphCanvas.parsingContext._getCurrentContainer()
  const newGroup = new GraphGroup(name || String(graphCanvas.parsingContext.GROUPIDS++), currenContainer)
  return currenContainer.addObject(newGroup) as GraphContainer
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
  const currentContainer = graphCanvas.parsingContext._getCurrentContainer()
  debug(`_getEdge edgeType=${edgeType} lhs=${String(lhs)}/${lhs.constructor.name} rhs=${String(rhs)} inlineEdgeLabel=${inlineEdgeLabel ?? ''} commonEdgeLabel=${commonEdgeLabel ?? ''} edgeColor=${edgeColor ?? ''} lcompass=${lcompass ?? ''} rcompass=${rcompass ?? ''} dontadd=${dontadd ? 'true' : 'false'}`, true)
  if (rhs instanceof GraphInner && !rhs._getEntrance()) {
    rhs._setEntrance(lhs)
  }

  if (rhs instanceof GraphVertex) {
    maybeRemoveFromRootVertices(currentContainer, rhs)
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
    debug(`getEdge LHS array, type:${edgeType} l:[${String(lhs)}] r:${String(rhs)} inlineEdgeLabel:${inlineEdgeLabel ?? ''} commonEdgeLabel: ${commonEdgeLabel ?? ''} edgeColor:${edgeColor ?? ''} lcompass:${lcompass ?? ''} rcompass:${rcompass ?? ''}`)
    for (let i = 0; i < lhs.length; i++) {
      debug(`    1Get edge ${String(lhs[i])}`)
      lastEdge = _getEdge(graphCanvas, edgeType, lhs[i], rhs, inlineEdgeLabel, commonEdgeLabel, edgeColor, lcompass, rcompass)
    }
    debug(false)
    return lastEdge as GraphEdge
  }
  if (rhs instanceof Array) {
    debug(`getEdge RHS array, type:${edgeType} l:${String(lhs)} r:[${String(rhs)}] inlineEdgeLabel:${inlineEdgeLabel ?? ''} commonEdgeLabel: ${commonEdgeLabel ?? ''} edgeColor:${edgeColor ?? ''} lcompass:${lcompass ?? ''} rcompass:${rcompass ?? ''}`)
    for (let i = 0; i < rhs.length; i++) {
      debug(`    2Get edge ${String(rhs[i])}`)
      lastEdge = _getEdge(graphCanvas, edgeType, lhs, rhs[i], inlineEdgeLabel, commonEdgeLabel, edgeColor, lcompass, rcompass)
    }
    debug(false)
    return lastEdge as GraphEdge
  }

  const edge = new GraphEdge(edgeType, currentContainer, lhs, rhs)
  debug(`${String(edge)}`)
  if (lcompass) edge.lcompass = lcompass
  else if (getAttribute(lhs, 'compass')) edge.lcompass = getAttribute(lhs, 'compass')

  if (rcompass) edge.rcompass = rcompass
  else if (getAttribute(rhs, 'compass')) edge.rcompass = getAttribute(rhs, 'compass')

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
  if (edgeColor) {
    debug(`Set edge color from ${edgeColor}`)
    edge.setColor(edgeColor)
  }

  if (!dontadd) {
    graphCanvas.addEdge(edge)
  }
  debug(false)
  return edge
}

function maybeRemoveFromRootVertices(currentContainer: GraphContainer, rhs: GraphVertex) {
  // if RHS has no edges (and is contained in a container) AND found from ROOTVERTICES, remove it from ROOTVERTICES
  if (rhs._noedges && currentContainer) {
    // debug(`REMOVE ${String(rhs)} from root vertices of the container ${currentContainer}`)
    const idx = currentContainer._ROOTVERTICES.indexOf(rhs)
    if (idx >= 0) {
      const removed = currentContainer._ROOTVERTICES.splice(idx, 1)
      debug(`REMOVE ${removed.join(', ')} from ROOTVERTICES`)
    }
  }
}

// =====================================
// only model.js
// =====================================

function _maybePushToCurrentContainerAsReference(graphCanvas: GraphCanvas, referred: GraphConnectable) {
  const currentContainer = graphCanvas.parsingContext._getCurrentContainer()
  if (!(currentContainer instanceof GraphGroup)) {
    // if current container is anything but a group, just return the same now
    return referred
  }
  const nodes = currentContainer.getObjects(true)
  const alreadyIncluded = nodes.filter(n => n.getName() === referred.getName()) // OK
  if (alreadyIncluded.length > 0) {
    debug(` This group (${currentContainer.getName()}) already has this named node in it, so just bail out`)
    return referred
  }
  debug(`  Add GraphReference(${referred.getName()}) to group (${currentContainer.getName()})`)
  const ref = new GraphReference(referred.getName(), currentContainer)
  currentContainer.addObject(ref)
  return ref
}
