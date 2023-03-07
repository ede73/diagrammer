// @ts-check
import { generators, type GraphCanvas, visualizations } from '../model/graphcanvas.js'
// used in typing
// eslint-disable-next-line no-unused-vars
import { type GraphConnectable } from '../model/graphconnectable.js'
// used in typing
// eslint-disable-next-line no-unused-vars
import { type GraphContainer } from '../model/graphcontainer.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphInner } from '../model/graphinner.js'
import { GraphVertex } from '../model/graphvertex.js'
import { hasOutwardEdge } from '../model/traversal.js'
import { _getVertexOrGroup } from '../model/model.js'
import { getAttributeAndFormat, output } from '../model/support.js'
import { debug } from '../model/debug.js'
import { GraphEdgeDirectionType, GraphEdgeLineType } from '../model/graphedge.js'
import { mapMethodsOrProperties } from '../model/transforms.js'
import { GraphReference } from '../model/graphreference.js'

// ADD TO INDEX.HTML AS: <option value="digraph:dot">Graphviz - dot(www/cli)</option>
// ADD TO INDEX.HTML AS: <option value="digraph:circo">Graphviz - circo(www/cli)</option>
// ADD TO INDEX.HTML AS: <option value="digraph:fdp">Graphviz - fdp(www/cli)</option>
// ADD TO INDEX.HTML AS: <option value="digraph:neato">Graphviz - neato(www/cli)</option>
// ADD TO INDEX.HTML AS: <option value="digraph:osage">Graphviz - osage(www/cli)</option>
// ADD TO INDEX.HTML AS: <option value="digraph:sfdp">Graphviz - sfdp(cli)</option>
// ADD TO INDEX.HTML AS: <option value="digraph:twopi">Graphviz - twopi(www/cli)</option>

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
 */
export function digraph(graphcanvas: GraphCanvas) {
  // TODO: See splines control
  // http://www.graphviz.org/doc/info/attrs.html#d:splines
  // TODO: Start note fdp/neato
  // http://www.graphviz.org/doc/info/attrs.html#d:start

  const lout = (...args: any[]) => {
    const [textOrIndent, maybeIndent] = args
    output(graphcanvas, textOrIndent, maybeIndent)
  }

  /**
   * Help JSON.stringify dump our objects (that may have circular references)
   */
  const skipEntrancesReplacer = (key: string, value: any) => {
    if (['entrance', '_entrance', 'exit', '_exit', 'parent', 'canvas'].includes(key)) {
      return null
    }
    return value
  }

  /**
     * @param {GraphVertex} obj
     */
  const processAVertex = (obj: GraphConnectable) => {
    const nattrs: string[] = []
    const styles: string[] = []
    if (obj.color) {
      nattrs.push(`fillcolor="${obj.color}"`)
      styles.push('filled')
    }
    getAttributeAndFormat(obj, 'style', '{0}', styles)

    const url = obj.url
    if (url) {
      nattrs.push(`URL="${url}"`)
    }
    if (styles.length > 0) {
      if (styles.join('').includes('singularity')) {
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
    if (((obj instanceof GraphVertex) || (obj instanceof GraphReference)) && obj.image) {
      nattrs.push('penwidth=0')
    }
    if (obj instanceof GraphVertex && obj.shape) {
      const currentShape = obj.shape as keyof typeof DigraphShapeMap
      if (obj.shape && !DigraphShapeMap[currentShape]) {
        throw new Error('Missing shape mapping')
      }
      const mappedShape = DigraphShapeMap[currentShape] ? DigraphShapeMap[currentShape] : DigraphShapeMap.default
      const r = `shape="${mappedShape}"`
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
  // This may FORWARD DECLARATION of a node...which creates problems with coloring
  const start = graphcanvas.getStart()
  if (start) {
    const fwd = _getVertexOrGroup(graphcanvas, start)
    processAVertex(fwd)
    lout('//startnode setup')
    lout(`{rank = same;null} {rank = same; ${start}}`, true)
    lout('null [shape=plaintext, label=""];')
    lout(`${start}[shape=doublecircle];`)
    lout(`null->${start};\n`)
    lout(false)
  }
  // This may FORWARD DECLARATION of a node...which creates problems with coloring
  if (graphcanvas.getEqual() && graphcanvas.getEqual().length > 0) {
    lout('{rank=same;', true)
    for (let x = 0; x < graphcanvas.getEqual().length; x++) {
      lout(graphcanvas.getEqual()[x].getName() + ';')
    }
    lout('}', false)
  }

  // Fix groups that have no nodes by adding invisible node there
  const fixgroup = (grp: GraphConnectable) => {
    if (!(output instanceof GraphGroup)) {
      return
    }
    if ((grp as GraphGroup).isEmpty()) {
      // TODO: This is ugly
      (grp as GraphGroup).addObject(new GraphVertex(`invis_${grp.getName()}`, grp as GraphGroup)
        .setStyle('invis'))
      return
    }
    (grp as GraphContainer).getObjects().forEach(o => { fixgroup(o) })
  }
  graphcanvas.getObjects().forEach(o => { fixgroup(o) })

  // pick node from group that is FIRST pointed by edges left hand side
  function getFirstLHSReferredNodeFromGroup(grp: GraphContainer) {
    // TODO: equal to hasOutwardEdge in model.js (except canvas, not yy)
    return graphcanvas.getEdges().find(allEdges =>
      undefined !== grp.getObjects().find(objectInGroup => objectInGroup === allEdges.left)
    )?.left
  }

  function getLastLHSOrRHSReferredNodeInGroup(grp: GraphContainer) {
    let nod: (GraphConnectable | undefined)
    graphcanvas.getEdges().forEach(allEdges => {
      grp.getObjects().forEach(node => {
        if (node === allEdges.left) { nod = node }
        if (node === allEdges.right) { nod = node }
      })
    })
    return nod
  }

  let lastexit: string
  let lastendif: string

  const processAGroup = (grp: GraphGroup) => {
    debug(JSON.stringify(grp, skipEntrancesReplacer))
    lout(`subgraph cluster_${grp.getName()} {`, true)
    // if (cond=="endif")continue;
    // Group name,OBJECTS,get/setEqual,toString
    mapMethodsOrProperties(grp, [
      ['isInnerGraph', (p, o) => { lout('graph[ style=invis ];') }],
      ['getLabel', (p, o) => { lout(getAttributeAndFormat(grp, 'label', 'label="{0}";')) }],
      ['getColor', (p, o, c) => {
        lout('style=filled;')
        lout(getAttributeAndFormat(grp, 'color', 'color="{0}";'))
      }]
    ])
    grp.getObjects().forEach(o => { ltraverseVertices(o) })

    const cond = grp.conditional
    lout(`}//end of ${grp.getName()} ${cond ?? ''}`, false)

    if (cond) {
      // IF.elseif..else construct...
      lout(`//COND ${grp.getName()} ${cond}`)
      if (cond === 'endif') {
        // never reached
        const _conditionalExitEdge = grp._conditionalExitEdge
        if (_conditionalExitEdge) {
          // lout(`${lastexit}->${_conditionalExitEdge.getName()}[ color=red ];`)
          lout(`${lastexit}->${lastendif}[ color=red ];`)
          lout(`${lastendif}->${_conditionalExitEdge.getName()};`)
        }
      } else {
        const exitVertexInConditional = `conditional_${cond}_${grp.exitvertex ?? ''}`
        if (!lastendif) {
          lastendif = `conditional_endif_${grp.exitvertex ?? ''}`
          lout(lastendif + '[ shape=circle, label="", width=0.01, height=0.01 ];')
        }
        // TODO:else does not need diamond
        lout(`${exitVertexInConditional}[ shape=diamond, fixedsize=true, width=1, height=1, label="${grp.getLabel() ?? ''}" ];`)
        if (cond === 'if' && grp._conditionalEntryEdge) {
          lout(`${grp._conditionalEntryEdge.getName()}->${exitVertexInConditional};`)
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
        if (firstReferredNode) {
          lout(`${exitVertexInConditional}->${firstReferredNode.getName()}[ label="YES", color=green, lhead=cluster_${grp.getName()} ];`)
        }
        if (lastReferredNode) {
          lout(`${lastReferredNode.getName()}->${lastendif}[ label="" ];`)
        }
        lastexit = exitVertexInConditional
      }
    }
  }

  const ltraverseVertices = (obj: GraphConnectable) => {
    if (obj instanceof GraphVertex) {
      processAVertex(obj)
    } else if (obj instanceof GraphGroup) {
      processAGroup(obj)
    } else {
      throw new Error('Not a node nor a group, NOT SUPPORTED')
    }
  }
  graphcanvas.getObjects().forEach(o => { ltraverseVertices(o) })

  lout('//links start')
  graphcanvas.getEdges().forEach(edge => {
    const attrs: string[] = []

    const context = [edge.left, edge.right]
    mapMethodsOrProperties(edge, [
      ['label', (p, o) => {
        if (p.includes('::')) {
          const labels = p.split('::')
          o.push(`label="${labels[0].trim()}"`)
          o.push(`xlabel="${labels[1].trim()}"`)
        } else {
          o.push(`label="${p.trim()}"`)
        }
      }],
      ['url', (p, o) => o.push(`URL="${p.trim()}"`)],
      ['color', (p, o) => o.push(`color="${p}"`)],
      ['textcolor', (p, o) => o.push(`fontcolor="${p}"`)],
      ['leftArrowType', (p, o) => {
        if (p === 'none()' || p === 'normal(< or >)') return
        if (p === 'double(<< or >>)') p = 'diamond'
        else if (p === 'flat(|)') p = 'tee'
        const astyle = 'arrowtail'// edge.direction() === GraphEdgeDirectionType.LEFT ? "arrowhead" : "arrowtail"
        o.push(`${astyle}="${p}"`)
      }],
      ['rightArrowType', (p, o) => {
        //
        if (p === 'none()' || p === 'normal(< or >)') return
        if (p === 'double(<< or >>)') p = 'diamond'
        else if (p === 'flat(|)') p = 'tee'
        const astyle = 'arrowhead'// edge.direction() === GraphEdgeDirectionType.RIGHT ? "arrowhead" : "arrowtail"
        o.push(`${astyle}="${p}"`)
      }],
      ['lineType', (p, o) => {
        if (p === GraphEdgeLineType.BROKEN) { o.push('arrowhead="tee"') } else if (p === GraphEdgeLineType.DASHED) {
          o.push('style="dashed"')
        } else if (p === GraphEdgeLineType.DOTTED) { o.push('style="dotted"') } else if (p === GraphEdgeLineType.DOUBLE) {
          o.push('peripheries=2')
          const c = edge.getColor() ?? 'white'
          o.push(`color="${c}:${c}:invis"`)
        }
      }],
      ['direction', (p, o, c) => {
        if (p === GraphEdgeDirectionType.BIDIRECTIONAL) { o.push('dir=both') } else if (p === GraphEdgeDirectionType.UNIDIRECTIONAL) { o.push('dir=none') } else if (p === GraphEdgeDirectionType.LEFT) {
          // Swap left hand side and right hand side, always using right pointing edges
          c[0] = c.splice(1, 1, c[0])[0]
        }
      }]
    ], attrs, context)
    let [lhs, rhs] = context
    debug(`// link from ${String(lhs)} to ${String(rhs)}`)
    if (rhs instanceof GraphGroup) {
      // just pick ONE Vertex from group and use lhead
      // TODO: Assuming it is Vertex (if Recursive groups implemented, it
      // could be smthg else)
      if (!rhs.isInnerGraph) {
        attrs.push(` lhead=cluster_${rhs.getName()}`)
      }
      if (!rhs.isEmpty()) {
        rhs = rhs.getFirstObject()
      }
    }
    if (lhs instanceof GraphGroup) {
      if (!lhs.isInnerGraph) { attrs.push(` ltail=cluster_${lhs.getName()}`) }
      if (lhs instanceof GraphInner && lhs._getExit()) {
        // get containers all vertices that have no outward links...(TODO:should be in model actually!)
        // perhaps when linking SUBGRAPH to a node (or another SUBGRAPH which might be very tricky)
        const exits: GraphConnectable[] = []
        lhs.getObjects().forEach(go => {
          if (!hasOutwardEdge(graphcanvas, go)) {
            exits.push(go)
          }
        })
        // @ts-expect-error TODO: can't really be array (makes no sense, c>(a b c) may? should point to inner group)
        lhs = exits
      } else {
        if (lhs.isEmpty()) {
          // TODO:?
        } else {
          lhs = lhs.getFirstObject()
        }
      }
      if (!lhs) {
        // Same as above
      }
    }

    // ======

    let t = ''
    if (attrs.length > 0) { t = `[ ${attrs.sort().join(', ')} ]` }
    debug(`print lhs ${String(lhs)}`)
    debug(`print rhs ${String(rhs)}`)
    if (lhs instanceof Array) {
      (lhs as GraphConnectable[]).forEach((element, index, array) => {
        const rname = (Array.isArray(rhs) ? rhs[0].getName() as string : rhs.getName())
        lout(element.getName() +
          getAttributeAndFormat(edge, 'lcompass', '{0}').trim() + '->' + rname +
          getAttributeAndFormat(edge, 'rcompass', '{0}').trim() + t + ';')
      })
    } else {
      const rname = (Array.isArray(rhs) ? rhs[0].getName() as string : rhs.getName())
      lout(lhs.getName() +
        getAttributeAndFormat(edge, 'lcompass', '{0}').trim() + '->' + rname +
        getAttributeAndFormat(edge, 'rcompass', '{0}').trim() + t + ';')
    }
  })
  lout('}', false)
}
generators.set('digraph', digraph)
visualizations.set('digraph', ['dot', 'circo', 'twopi', 'neato', 'fdp', 'sfpd', 'osage'])
