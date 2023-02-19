import { generators, visualizations } from '../model/graphcanvas.js'
// used in typing
// eslint-disable-next-line no-unused-vars
import { GraphConnectable } from '../model/graphconnectable.js'
// used in typing
// eslint-disable-next-line no-unused-vars
import { GraphContainer } from '../model/graphcontainer.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphInner } from '../model/graphinner.js'
import { GraphVertex } from '../model/graphvertex.js'
import { getVertex, hasOutwardEdge, traverseEdges, traverseVertices } from '../model/model.js'
import { debug, getAttributeAndFormat, output } from '../model/support.js'

// ADD TO INDEX.HTML AS: <option value="digraph:dot">Graphviz - dot(cli/www)</option>
// ADD TO INDEX.HTML AS: <option value="digraph:circo">Graphviz - circo(cli)</option>
// ADD TO INDEX.HTML AS: <option value="digraph:twopi">Graphviz - twopi(cli)</option>
// ADD TO INDEX.HTML AS: <option value="digraph:neato">Graphviz - neato(cli)</option>
// ADD TO INDEX.HTML AS: <option value="digraph:fdp">Graphviz - fdp(cli)</option>
// ADD TO INDEX.HTML AS: <option value="digraph:sfdp">Graphviz - sfdp(cli)</option>

const DigraphShapeMap = {
  default: 'box',
  invis: 'invis',
  record: 'record',
  doublecircle: 'doublecircle',
  box: 'box',
  rect: 'box',
  rectangle: 'box',
  square: 'square',
  roundedbox: 'box',
  dots: 'point',
  circle: 'circle',
  ellipse: 'ellipse',
  diamond: 'diamond',
  minidiamond: 'Mdiamond',
  minisquare: 'Msquare',
  note: 'note',
  mail: 'tab',
  cloud: 'tripleoctagon',
  actor: 'cds',
  beginpoint: 'circle',
  endpoint: 'doublecircle',
  condition: 'MDiamond',
  database: 'Mcircle',
  terminator: 'ellipse',
  input: 'parallelogram',
  loopin: 'house',
  loop: 'house',
  loopstart: 'house',
  loopout: 'invhouse',
  loopend: 'invhouse'
}

/**
 * To test: node js/diagrammer.js verbose tests/test_inputs/state1.txt digraph
 *
 * @param {GraphCanvas} graphcanvas
 */
export function digraph (graphcanvas) {
  // TODO: See splines control
  // http://www.graphviz.org/doc/info/attrs.html#d:splines
  // TODO: Start note fdp/neato
  // http://www.graphviz.org/doc/info/attrs.html#d:start

  const lout = (...args) => {
    output(graphcanvas, ...args)
  }
  /**
     *
     * @param {string} key
     * @returns
     */
  const skipEntrances = (key, value) => {
    if (key === 'entrance' || key === 'exit') {
      return null
    }
    return value
  }

  /**
     * @param {GraphVertex} obj
     */
  const processAVertex = obj => {
    const nattrs = []
    const styles = []
    getAttributeAndFormat(obj, 'color', 'fillcolor="{0}"', nattrs)
    getAttributeAndFormat(obj, 'color', 'filled', styles)
    getAttributeAndFormat(obj, 'style', '{0}', styles)

    const url = obj.url
    if (url) {
      nattrs.push(`URL="${url}"`)
    }
    if (styles.length > 0) {
      if (styles.join('').indexOf('singularity') !== -1) {
        // invis node is not singularity!, circle with minimal
        // width/height IS!
        nattrs.push('shape="circle"')
        nattrs.push('label=""')
        nattrs.push('width=0.01')
        nattrs.push('weight=0.01')
      } else {
        nattrs.push(`style="${styles.sort().join(',')}"`)
      }
    }
    getAttributeAndFormat(obj, 'image', 'image="icons{0}"', nattrs)
    getAttributeAndFormat(obj, 'textcolor', 'fontcolor="{0}"', nattrs)
    if (obj.shape) {
      if (obj.shape && !DigraphShapeMap[obj.shape]) {
        throw new Error('Missing shape mapping')
      }
      const mappedShape = DigraphShapeMap[obj.shape] ? DigraphShapeMap[obj.shape] : DigraphShapeMap.default
      const r = 'shape="{0}"'.format(mappedShape)
      nattrs.push(r)
    }
    getAttributeAndFormat(obj, 'label', 'label="{0}"', nattrs)
    let t = ''
    if (nattrs.length > 0) {
      t = `[ ${nattrs.sort().join(', ')} ]`
    }
    lout(`${obj.getName()}${t};`)
  }

  lout('digraph {', true)

  lout('compound=true;')
  if (graphcanvas.getDirection() === 'portrait') {
    lout('rankdir=LR;')
  } else {
    lout('rankdir=TD;')
  }
  // This may FORWARD DECLARE a node...which creates problems with coloring
  const start = graphcanvas.getStart()
  if (start) {
    const fwd = getVertex(graphcanvas.yy, start)
    processAVertex(fwd)
    lout('//startnode setup')
    lout(`{rank = same;null} {rank = same; ${start}}`, true)
    lout('null [shape=plaintext, label=""];')
    lout(`${start}[shape=doublecircle];`)
    lout(`null->${start};\n`)
    lout(false)
  }
  // This may FORWARD DECLARE a node...which creates problems with coloring
  if (graphcanvas.getEqual() && graphcanvas.getEqual().length > 0) {
    lout('{rank=same;', true)
    for (let x = 0; x < graphcanvas.getEqual().length; x++) {
      lout(graphcanvas.getEqual()[x].getName() + ';')
    }
    lout('}', false)
  }

  // Fix groups that have no nodes by adding invisible node there
  const fixgroup = (o) => {
    if (!(output instanceof GraphGroup)) {
      return
    }
    if (o.OBJECTS.length === 0) {
      o.OBJECTS.push(new GraphVertex(`invis_${o.getName()}`)
        .setStyle('invis'))
      return
    }
    traverseVertices(o, fixgroup)
  }
  traverseVertices(graphcanvas, fixgroup)

  // pick node from group that is FIRST pointed by edges left hand side
  function getFirstLHSReferredNodeFromGroup (/** @type {GraphContainer} */grp) {
    // TODO: Replace with supported traversal (but it needs return support first)
    for (const i in graphcanvas.EDGES) {
      if (!Object.prototype.hasOwnProperty.call(graphcanvas.EDGES, i)) continue
      const allEdges = graphcanvas.EDGES[i]
      // TODO: Cannot return from traversal yet
      // traverseVertices(grp, objectInGroup => {
      //   if (objectInGroup === allEdges.left) {
      //     return objectInGroup
      //   }
      // })
      // TODO: Replace with above (soon)
      for (const j in grp.OBJECTS) {
        if (!Object.prototype.hasOwnProperty.call(grp.OBJECTS, j)) continue
        const objectInGroup = grp.OBJECTS[j]
        if (objectInGroup === allEdges.left) {
          return objectInGroup
        }
      }
    }
    return undefined
  }

  function getLastLHSOrRHSReferredNodeInGroup (/** @type {GraphContainer} */grp) {
    /** @type {(GraphConnectable|undefined)} */
    let nod
    traverseEdges(graphcanvas, allEdges => {
      traverseVertices(grp, node => {
        if (node === allEdges.left) { nod = node }
        if (node === allEdges.right) { nod = node }
      })
    })
    return nod
  }

  let lastexit
  let lastendif
  /**
    * @param {GraphGroup} grp
    */
  const processAGroup = grp => {
    debug(JSON.stringify(grp, skipEntrances))
    lout(`subgraph cluster_${grp.getName()} {`, true)
    const cond = grp.conditional
    // if (cond=="endif")continue;
    // Group name,OBJECTS,get/setEqual,toString
    if (grp.isInnerGraph) {
      lout('graph[ style=invis ];')
    }
    if (grp.getLabel()) {
      lout(getAttributeAndFormat(grp, 'label',
        'label="{0}";'))
    }
    if (grp.getColor()) {
      lout('style=filled;')
      lout(getAttributeAndFormat(grp, 'color',
        'color="{0}";'))
    }
    traverseVertices(grp, ltraverseVertices)
    lout(`}//end of ${grp.getName()} ${cond}`, false)
    if (cond) {
      // IF.elseif..else construct...
      lout(`//COND ${grp.getName()} ${cond}`)
      if (cond === 'endif') {
        // never reached
        const exitedge = grp.exitedge
        if (exitedge) {
          lout(`${lastexit}->${exitedge.getName()}[ color=red ];`)
          lout(`${lastendif}->${exitedge.getName()};`)
        }
      } else {
        const exitVertexInConditional = `entry${grp.exitvertex}`
        if (!lastendif) {
          lastendif = `endif${grp.exitvertex}`
          lout(lastendif + '[ shape=circle, label="", width=0.01, height=0.01 ];')
        }
        // TODO:else does not need diamond
        lout(`${exitVertexInConditional}[ shape=diamond, fixedsize=true, width=1, height=1, label="${grp.getLabel()}" ];`)
        if (cond === 'if') {
          // entryedge!
          lout(`${grp.entryedge.getName()}->${exitVertexInConditional};`)
        }
        // FIRST node of group and LAST node(GraphConnectable) in group..
        const firstReferredNode = getFirstLHSReferredNodeFromGroup(grp)
        const lastReferredNode = getLastLHSOrRHSReferredNodeInGroup(grp)
        // decision node
        // const en = "exit" + o.exitvertex

        if (lastexit) {
          lout(`${lastexit}->${exitVertexInConditional}[ label="NO", color=red ];`)
          // lastexit = undefined;
        }
        // YES LINK to first node of the group
        lout(`${exitVertexInConditional}->${firstReferredNode.getName()}[ label="YES", color=green, lhead=cluster_${grp.getName()} ];`)
        lout(`${lastReferredNode.getName()}->${lastendif}[ label="" ];`)
        lastexit = exitVertexInConditional
      }
    }
  }

  const ltraverseVertices = /** @type {function(GraphConnectable)} */obj => {
    if (obj instanceof GraphVertex) {
      processAVertex(obj)
    } else if (obj instanceof GraphGroup) {
      processAGroup(obj)
    } else {
      throw new Error('Not a node nor a group, NOT SUPPORTED')
    }
  }
  traverseVertices(graphcanvas, ltraverseVertices)

  lout('//links start')
  traverseEdges(graphcanvas, edge => {
    const attrs = []
    let label = edge.label
    if (label) {
      if (label.indexOf('::') !== -1) {
        label = label.split('::')
        attrs.push(`label="${label[0].trim()}"`)
        attrs.push(`xlabel="${label[1].trim()}"`)
      } else {
        attrs.push(`label="${label.trim()}"`)
      }
    }
    const url = edge.url
    if (url) {
      attrs.push(`URL="${url.trim()}"`)
    }
    getAttributeAndFormat(edge, 'color', 'color="{0}"', attrs)
    getAttributeAndFormat(edge, ['textcolor', 'color'], 'fontcolor="{0}"', attrs)
    let edgeType
    let rhs = edge.right
    let lhs = edge.left

    debug(`// link from ${lhs} to ${rhs}`)
    if (rhs instanceof GraphGroup) {
      // just pick ONE Vertex from group and use lhead
      // TODO: Assuming it is Vertex (if Recursive groups implemented, it
      // could be smthg else)
      if (!rhs.isInnerGraph) {
        attrs.push(` lhead=cluster_${rhs.getName()}`)
      }
      if (rhs.OBJECTS[0]) {
        rhs = rhs.OBJECTS[0]
      }
    }
    if (lhs instanceof GraphGroup) {
      if (!lhs.isInnerGraph) { attrs.push(` ltail=cluster_${lhs.getName()}`) }
      if (lhs instanceof GraphInner && lhs.getExit()) {
        // get containers all vertices that have no outward links...(TODO:should be in model actually!)
        // perhaps when linking SUBGRAPH to a node (or another SUBGRAPH which might be very tricky)
        const exits = []
        traverseVertices(lhs, go => {
          if (!hasOutwardEdge(graphcanvas.yy, go)) {
            exits.push(go)
          }
        })
        lhs = exits
      } else {
        lhs = lhs.OBJECTS[0]
      }
      if (!lhs) {
        // Same as above
      }
    }
    // TODO:Assuming producing DIGRAPH
    // For GRAPH all edges are type --
    // but we could SET arrow type if we'd like
    if (edge.isDotted()) {
      attrs.push('style="dotted"')
    } else if (edge.isDashed()) {
      attrs.push('style="dashed"')
    }
    if (edge.isBroken()) {
      // TODO: Somehow denote better this "quite does not reach"
      // even though such an edge type MAKES NO SENSE in a graph
      attrs.push('arrowhead="tee"')
    }
    if (edge.isBidirectional()) {
      edgeType = '->'
      attrs.push('dir=both')
    } else if (edge.isLeftPointingEdge()) {
      const tmp = lhs
      lhs = rhs
      rhs = tmp
      edgeType = '->'
    } else if (edge.isRightPointingEdge()) {
      edgeType = '->'
    } else {
      // is dotted or dashed no direction
      edgeType = '->'
      attrs.push('dir=none')
    }
    let t = ''
    if (attrs.length > 0) { t = `[ ${attrs.sort().join(', ')} ]` }
    debug(`print lhs ${lhs}`)
    debug(`print rhs ${rhs}`)
    if (lhs instanceof Array) {
      lhs.forEach((element, index, array) => {
        lout(element.getName() +
                    getAttributeAndFormat(edge, 'lcompass', '{0}').trim() + edgeType + rhs.getName() +
                    getAttributeAndFormat(edge, 'rcompass', '{0}').trim() + t + ';')
      })
    } else {
      lout(lhs.getName() +
                getAttributeAndFormat(edge, 'lcompass', '{0}').trim() + edgeType + rhs.getName() +
                getAttributeAndFormat(edge, 'rcompass', '{0}').trim() + t + ';')
    }
  })
  lout('}', false)
}
generators.set('digraph', digraph)
visualizations.set('digraph', ['dot', 'circo', 'twopi', 'neato', 'fdp', 'sfpd'])
