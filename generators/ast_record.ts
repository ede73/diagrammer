// @ts-check

import { generators, GraphCanvas } from '../model/graphcanvas.js'
import { GraphContainer } from '../model/graphcontainer.js'
import { GraphEdge } from '../model/graphedge.js'
import { GraphInner } from '../model/graphinner.js'
import { output } from '../model/support.js'
import { GraphReference } from '../model/graphreference.js'
import { type GraphObject } from 'model/graphobject.js'

// ADD TO INDEX.HTML AS: <option value="ast_record">Abstract Syntax Tree(Record)</option>

/*
=========================================
$(v:#ff0000)
$(b:#0000ff)
shape record

A$(v);{ GraphVertex | {name|A} |{style|record} }
B$(v);{ GraphVertex | {name|A} |{style|record} }

{group1;q
g1$(b);{ GraphGroup | {name|group1}} }

C$(v);{ GraphVertex | {name|C} |{style|record} }
D$(v);{ GraphVertex | {name|D} |{style|record} }
C-D
}

{group2;q
g2$(b);{ GraphGroup | {name|group2}} }
E$(v);{ GraphVertex | {name|E} |{style|record} }
F$(v);{ GraphVertex | {name|F} |{style|record} }
E-F
}

A-C-B-E

=========================================
*/
/**
 * SHAPE record
 * d; { <f0> GraphCanvas | {x|q} |{x|q} }
 * TO test: node js/diagrammer.js verbose tests/test_inputs/state5.txt ast_record
*/
export function ast_record(graphcanvas: GraphCanvas) {
  const lout = (...args: any[]) => {
    const [textOrIndent, maybeIndent] = args
    output(graphcanvas, textOrIndent, maybeIndent)
  }

  // For a long text(list of words), try to split it at commas, trying to get at least min_line_length lines
  // but at maximum max_line_length. If max_line_length reached, split, comma or not
  const tryToSplit = (msg: string, max_line_length: number = 64, min_line_length: number = 32): string => {
    if (msg.length > max_line_length) {
      return `${msg.match(/.{${min_line_length},${max_line_length}}[,]/g)?.join('\\n')}`
    }
    return msg
  }

  const collectProperties = (obj: GraphObject) => {
    const params: Record<string, string> = {}
    const excludeSomeFields = ['ALLOWED_DEFAULTS', 'CURRENTCONTAINER', '_nextConnectableToExitEndIf', 'lastSeenVertex']
    const collectJustNames = ['_OBJECTS', '_ROOTVERTICES', '_EDGES', 'equal']
    const collectJustName = ['left', 'right', 'container', 'parent', '_exit']

    Object.entries(obj).forEach(([k, v], idx) => {
      if (excludeSomeFields.includes(k) || v === undefined || v === null || typeof (v) === 'function') return
      if (obj instanceof GraphInner && k === 'defaults') return
      function getName(obj: GraphObject) {
        if (obj instanceof GraphInner) {
          return 'GraphInner'
        }
        if (obj instanceof GraphCanvas) {
          return 'GraphCanvas'
        }
        return obj instanceof GraphEdge ? `${obj.left.getName()}-${obj.right.getName()}` : `${obj.getName()}`
      }

      if (collectJustNames.includes(k)) {
        const names = Object.values(v).map((l) => `${getName(l as GraphObject)}`).join(', ')
        // if list is longer than 64, try to break it at commas, but so that one block is atleast 32 chars long not exceeding 64
        // if not possible, then just break
        // also do not loose anything!
        params[k] = tryToSplit(names, 64, 32)
      } else if (collectJustName.includes(k)) {
        params[k] = `${getName(v)}`
      } else if (k === 'VARIABLES') {
        const vars = Object.entries(v).map(([k, v]) => `${k}=${v}`).join(', ')
        params[k] = `${vars}`
      } else {
        params[k] = `${v}`
      }
    })
    return params
  }

  function makeRecord(params: Record<string, string>) {
    return Object.entries(params).map(([k, v], idx) => `{${k}|${v.replace(/"/g, "'")}}`).join('|')
  }

  lout('digraph {', true)
  lout('compound=true;')
  lout('rankdir=TD;')

  lout('subgraph cluster_canvas {', true)
  lout('color=yellow;')
  const label = `{ GraphCanvas | ${makeRecord(collectProperties(graphcanvas))} }`
  lout(`GraphCanvas[shape=record, color=yellow, fillcolor=yellow, label="${label}"];`)

  graphcanvas.getObjects().forEach(function c(n) {
    function getName(obj: GraphObject) {
      if (obj instanceof GraphReference) {
        return `inner_${obj.getName()}`
      }
      return obj.getName()
    }

    const props = makeRecord(collectProperties(n))
    const label = `{ ${n.constructor.name} | ${props} }`

    if (n instanceof GraphContainer) {
      lout(`subgraph cluster_${n.getName()} {`, true)
      lout('color=blue;')
      lout(`${n.getName()}[shape=record, color=blue, fillcolor=blue, label="${label}"];`)
      // group or inner
      n.getObjects(true).forEach(o => { c(o) })
      lout('}', false)
    } else {
      // Vertex (or ref)
      lout(`${getName(n)}[shape=record, color=red, fillcolor=red, label="${label}"];`)
    }
  }, true)

  graphcanvas.getEdges().forEach(e => {
    // TODO: Add default edgetype (flip if flipped) report in label
    const params = collectProperties(e)
    const paramTextBlock = Object.entries(params).map(([k, v], idx) => `${k}=${v}`).join('\\n')
    const label = `${e.constructor.name}\\n${paramTextBlock}`
    lout(`${e.left.getName()} -> ${e.right.getName()}[label="${label}"];`)
  })
  lout('}', false)
  lout('}', false)
}
generators.set('ast_record', ast_record)
