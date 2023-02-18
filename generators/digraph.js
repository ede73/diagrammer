import { generators, visualizations } from '../model/graphcanvas.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphInner } from '../model/graphinner.js'
import { GraphVertex } from '../model/graphvertex.js'
import { getVertex, hasOutwardEdge, traverseEdges } from '../model/model.js'
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
     * @param {GraphConnectable} obj
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
        nattrs.push(`style="${styles.join(',')}"`)
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
      t = `[ ${nattrs.join(', ')} ]`
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
  const fixgroup = (c => {
    for (const i in c.OBJECTS) {
      if (!Object.prototype.hasOwnProperty.call(c.OBJECTS, i)) continue
      const o = c.OBJECTS[i]
      if (o instanceof GraphGroup) {
        if (o.OBJECTS.length === 0) {
          o.OBJECTS.push(new GraphVertex(`invis_${o.getName()}`)
            .setStyle('invis'))
        } else {
          // A group...non empty...parse inside
          fixgroup(o)
        }
      }
    }
  })(graphcanvas.OBJECTS)

  function getFirstEdgeOfTheGroup (grp) {
    for (const i in graphcanvas.EDGES) {
      if (!Object.prototype.hasOwnProperty.call(graphcanvas.EDGES, i)) continue
      const l = graphcanvas.EDGES[i]
      for (const j in grp.OBJECTS) {
        if (!Object.prototype.hasOwnProperty.call(grp.OBJECTS, j)) continue
        const n = grp.OBJECTS[j]
        if (n === l.left) {
          return n
        }
      }
    }
    return undefined
  }

  function getLastEdgeInGroup (grp) {
    let nod
    for (const i in graphcanvas.EDGES) {
      if (!Object.prototype.hasOwnProperty.call(graphcanvas.EDGES, i)) continue
      const l = graphcanvas.EDGES[i]
      for (const j in grp.OBJECTS) {
        if (!Object.prototype.hasOwnProperty.call(grp.OBJECTS, j)) continue
        const n = grp.OBJECTS[j]
        if (n === l.left) { nod = n }
        if (n === l.right) { nod = n }
      }
    }
    return nod
  }

  let lastexit
  let lastendif
  const traverseVertices = /** @type {function((GraphGroup|GraphVertex))} */root => {
    for (const i in root.OBJECTS) {
      if (!Object.prototype.hasOwnProperty.call(root.OBJECTS, i)) continue
      const obj = root.OBJECTS[i]
      if (obj instanceof GraphGroup) {
        const cond = obj.conditional;
        // if (cond=="endif")continue;
        // Group name,OBJECTS,get/setEqual,toString
        ((grp) => {
          debug(JSON.stringify(grp, skipEntrances))
          lout(`subgraph cluster_${grp.getName()} {`, true)
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
          traverseVertices(grp)
          lout(`}//end of ${grp.getName()} ${cond}`, false)
          if (cond) {
            lout(`//COND ${grp.getName()} ${cond}`)
            if (cond === 'endif') {
              // never reached
              const exitedge = grp.exitedge
              if (exitedge) {
                lout(`${lastexit}->${exitedge.getName()}[ color=red ];`)
                lout(`${lastendif}->${exitedge.getName()};`)
              }
            } else {
              const sn = `entry${grp.exitvertex}`
              if (!lastendif) {
                lastendif = `endif${grp.exitvertex}`
                lout(lastendif + '[ shape=circle, label="", width=0.01, height=0.01 ];')
              }
              // TODO:else does not need diamond
              lout(`${sn}[ shape=diamond, fixedsize=true, width=1, height=1, label="${grp.getLabel()}" ];`)
              if (cond === 'if') {
                // entryedge!
                lout(`${grp.entryedge.getName()}->${sn};`)
              }
              // FIRST node of group and LAST node in group..
              const lastEdge = getFirstEdgeOfTheGroup(grp)
              const ln = getLastEdgeInGroup(grp)
              // decision node
              // const en = "exit" + o.exitvertex

              if (lastexit) {
                lout(`${lastexit}->${sn}[ label="NO", color=red ];`)
                // lastexit = undefined;
              }
              // YES LINK to first node of the group
              lout(`${sn}->${lastEdge.getName()}[ label="YES", color=green, lhead=cluster_${grp.getName()} ];`)
              lout(`${ln.getName()}->${lastendif}[ label="" ];`)
              lastexit = sn
            }
          }
        })(obj)
      } else if (obj instanceof GraphVertex) {
        processAVertex(obj)
      } else {
        throw new Error('Not a node nor a group, NOT SUPPORTED')
      }
    }
  }
  traverseVertices(graphcanvas)

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
        for (const i in lhs.OBJECTS) {
          if (!Object.prototype.hasOwnProperty.call(lhs.OBJECTS, i)) continue
          const go = lhs.OBJECTS[i]
          if (!hasOutwardEdge(graphcanvas.yy, go)) {
            exits.push(go)
          }
        }
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
    if (attrs.length > 0) { t = `[ ${attrs.join(', ')} ]` }
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
