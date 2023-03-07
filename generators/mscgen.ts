// @ts-check

import { generators, type GraphCanvas } from '../model/graphcanvas.js'
import { GraphEdgeDirectionType, GraphEdgeLineType } from '../model/graphedge.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphVertex } from '../model/graphvertex.js'
import { multiAttrFmt, output } from '../model/support.js'

// ADD TO INDEX.HTML AS: <option value="mscgen">MSCGEN(cli)</option>

/**
 * https://www.mcternan.me.uk/mscgen/
 *
 * To test: node js/diagrammer.js verbose tests/test_inputs/state_sequence.txt mscgen
 */
export function mscgen(graphcanvas: GraphCanvas) {
  const lout = (...args: any[]) => {
    const [textOrIndent, maybeIndent] = args
    output(graphcanvas, textOrIndent, maybeIndent)
  }

  lout('msc {', true)

  const vertices: string[] = []

  // print out all node declarations FIRST (if any)
  graphcanvas.getObjects().forEach(obj => {
    if (obj instanceof GraphGroup) {
      // vertices.push(' /*' + obj.getName() + getAttributeAndFormat(obj, 'label', ' {0}') + '*/')
      obj.getObjects().forEach(z => {
        const tmp = multiAttrFmt(z, {
          color: 'color="{0}"',
          style: 'style={0}',
          label: 'label="{0}"'
        })
        vertices.push(z.getName() + tmp)
      })
    } else if (obj instanceof GraphVertex) {
      const tmp = multiAttrFmt(obj, {
        color: 'textbgcolor="{0}"',
        style: 'style={0}',
        label: 'label="{0}"'
      })
      vertices.push(obj.getName() + tmp)
    }
  })

  lout(`${vertices.join(',')};`)
  const mscEdgeMapping: Record<string, string> = {
    '->': '->', // message, *continuous line, one sided arrow*
    '<-': '<-', // message
    '<->': '<->', // message

    '-|': '->', // not supported by msc
    '|-': '<-', // not supported by msc
    '|-|': '<->', // not supported by msc
    '.|': '->', // not supported by msc
    '|.': '<-', // not supported by msc
    '|.|': '<->', // not supported by msc
    '=|': '->', // not supported by msc
    '|=': '<-', // not supported by msc
    '|=|': '<->', // not supported by msc

    '>': '=>', // method call or function call *continuous line, bold arrow*
    '<': '<=', //  method call or function call
    '<>': '<=>', //

    '.>': '=>>', // callback *continuous line, small arrow*
    '<.': '<<=', // callback
    '<.>': '<<=>>', // callback

    '/>': '-x ', // Broken message *continuous line, broken not reaching arrow*
    '</': ' x-', //  Broken message

    '.': '...', // time passes  * vertical ... *
    '-': '---', // horizontal comment * horizontal dash*

    '>>': '>>', // method or function return value (dashed line, small arrow) *dashed line, small arrow*
    '<<': '<<', // method or function return value
    '<<>>': '<<=>>', // method or function return value

    '=>': ':>', // Emphazised message *double arrow, bold arrow*
    '<=': '<:', // Emphazised message
    '<=>': '<:>' // Emphazised message

    // '': '|||', // extra space between rows

    // '': '->*', // Broadcast arcs, where the arc is extended to all but the source entity. Any arc label is centred across the whole chart.
    // '': '*<-', // Broadcast arcs, where the arc is extended to all but the source entity.

    // '': 'box', // a box a [label='']
    // '': 'rbox', //  a rbox a [label='']
    // '': 'abox', // a abox a [label='']
    // '': 'note', // a note a  [label='']
  }

  // node attrs: label, URL, ID, IDURL, arcskip, linecolor, textcolor, arclinecolor, arctextcolor, arxtextbgcolor

  let id = 1
  graphcanvas.getEdges().forEach(edge => {
    let edgeType = ''
    let rhs = edge.right
    const lhs = edge.left

    if (rhs instanceof GraphGroup) {
      // just pick ONE Vertex from group and use lhead
      // TODO: Assuming it is Vertex (if Recursive groups implemented, it
      // could be smthg else)
      edgeType += ` lhead=cluster_${rhs.getName()}`
      if (rhs.isEmpty()) {
        // TODO:Bad thing, EMPTY group..add one invisible node there...
        // But should add already at TOP
      } else {
        rhs = rhs.getFirstObject()
      }
    }
    // TODO:Assuming producing DIGRAPH
    // For GRAPH all edges are type --
    // but we could SET arrow type if we'd like
    let rightName = rhs.getName()

    const attrs = []
    let note = ''
    if (edge.url) {
      attrs.push(`URL="${edge.url}"`)
    }
    if (edge.color) {
      attrs.push(`linecolor="${edge.color}"`)
    }
    if (edge.label) {
      if (edge.label.includes('::')) {
        const labels = edge.label.split('::')
        note = labels[1].trim()
        attrs.push(`label="${labels[0].trim()}"`)
      } else {
        attrs.push(`label="${edge.label.trim()}"`)
      }
    }
    attrs.push(`id="${id++}"`)

    const dir = edge.direction()
    const line = edge.lineType()
    if (dir === GraphEdgeDirectionType.BIDIRECTIONAL) {
      // Broadcast type (<>)
      // hmh..since seqdiag uses a<>a as broadcast and
      // a<>b as autoreturn, could we do as well?
      if (lhs === rhs) {
        edgeType = '->'
        rightName = '*'
      } else {
        edgeType = mscEdgeMapping[edge.edgeType]
      }
    } else if (dir === GraphEdgeDirectionType.LEFT) {
      // const tmpl = lhs
      // lhs = rhs
      // rhs = tmpl
      edgeType = mscEdgeMapping[edge.edgeType]
      rightName = rhs.getName()
    } else if (dir === GraphEdgeDirectionType.RIGHT) {
      edgeType = mscEdgeMapping[edge.edgeType]
    } else if (line === GraphEdgeLineType.DOTTED) {
      // dotted
      if (edge.color) {
        attrs.push(`textcolor="${edge.color}"`)
      }
      lout(`... [ ${attrs.sort().join(',')} ];`)
      return
    } else if (line === GraphEdgeLineType.DASHED) {
      // dashed
      if (edge.color) {
        attrs.push(`textcolor="${edge.color}"`)
      }
      lout(`--- [ ${attrs.sort().join(',')} ];`)
      return
    } else {
      lout('ERROR: SHOULD NOT HAPPEN')
    }

    lout(`${lhs.getName()}${edgeType}${rightName}[${attrs.sort().join(', ')}];`)
    if (note !== '') {
      lout(`${rhs.getName()} abox ${rhs.getName()}[ label="${note}" ];`)
    }
  })
  lout('}', false)
}
generators.set('mscgen', mscgen)
