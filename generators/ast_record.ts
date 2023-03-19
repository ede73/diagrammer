// @ts-check

import { generators, GraphCanvas } from '../model/graphcanvas.js'
import { GraphContainer } from '../model/graphcontainer.js'
import { GraphEdge } from '../model/graphedge.js'
import { GraphInner } from '../model/graphinner.js'
import { GraphReference } from '../model/graphreference.js'
import { type GraphObject } from 'model/graphobject.js'
import { GraphVertex } from '../model/graphvertex.js'
import { Generator } from './generator.js'

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
 * TO test: node js/generate.js verbose tests/test_inputs/state5.txt ast_record
*/
// eslint-disable-next-line @typescript-eslint/naming-convention
export class ASTRecord extends Generator {
  generate() {
    // For a long text(list of words), try to split it at commas, trying to get at least minLineLength lines
    // but at maximum maxLineLength. If max_line_length reached, split, comma or not
    const tryToSplit = (msg: string, maxLineLength: number = 64, minLineLength: number = 32): string => {
      if (msg.length > maxLineLength) {
        return `${msg.match(/.{${minLineLength},${maxLineLength}}[,]/g)?.join('\\n') ?? ''}`
      }
      return msg
    }

    const collectProperties = (obj: GraphObject) => {
      const params: Record<string, string> = {}
      const excludeSomeFields = ['ALLOWED_DEFAULTS', 'CURRENTCONTAINER', '_nextConnectableToExitEndIf', 'lastSeenVertex']
      const collectJustNames = ['_OBJECTS', '_ROOTVERTICES', '_EDGES', 'equal']
      const collectJustName = ['left', 'right', 'container', 'parent', '_exit']

      Object.entries(obj).forEach(([propNames, propValues], idx) => {
        if (excludeSomeFields.includes(propNames) || propValues === undefined || propValues === null || typeof (propValues) === 'function') return
        // if (obj instanceof GraphInner && propNames === 'defaults') return
        function getName(obj: GraphObject) {
          if (obj instanceof GraphInner) {
            return 'GraphInner'
          }
          if (obj instanceof GraphCanvas) {
            return 'GraphCanvas'
          }
          return obj instanceof GraphEdge ? `${obj.left.getName()}-${obj.right.getName()}` : `${obj.getName()}`
        }

        if (collectJustNames.includes(propNames)) {
          const names = Object.values(propValues).map((l) => `${getName(l as GraphObject)}`).join(', ')
          // if list is longer than 64, try to break it at commas, but so that one block is atleast 32 chars long not exceeding 64
          // if not possible, then just break
          // also do not loose anything!
          params[propNames] = tryToSplit(names, 64, 32)
        } else if (collectJustName.includes(propNames)) {
          params[propNames] = `${getName(propValues)}`
        } else if (propNames === 'VARIABLES' || propNames === 'defaults') {
          const vars = Object.entries(propValues).map(([varName, varValue]) => `${varName}=${varValue as string}`).join(', ')
          params[propNames] = `${vars}`
        } else {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          params[propNames] = `${propValues}`
        }
      })
      return params
    }

    function makeRecord(title: string, color: string, params: Record<string, string>) {
      const ret: string[] = []
      ret.push(`<table style="rounded" bgcolor="${color}" border='1' cellborder='0' cellspacing='0'>`)
      ret.push(`<tr><td>${title}</td><td></td></tr>`)
      const q = Object.entries(params).map(([k, v], idx) => `<tr><td>${k}</td><td>${v.replace(/"/g, "'")}</td></tr>`)
      ret.push(...q)
      ret.push('</table>')
      return ret
    }

    this.lout('digraph {', true)
    this.lout('compound=true;')
    this.lout('rankdir=TD;')
    this.lout('node[fontsize="9"];')
    this.lout('edge[fontsize="9"];')
    this.lout('subgraph cluster_canvas {', true)
    this.lout('color=yellow;')

    const canvas = makeRecord('GraphCanvas', 'magenta', collectProperties(this.graphCanvas))
    this.lout(`GraphCanvas[shape=plaintext, label=<\n\t${canvas.join('\n\t\t')}\n\t>];`)

    this.graphCanvas.getObjects().forEach(function c(n) {
      function getName(obj: GraphObject) {
        if (obj instanceof GraphReference) {
          return `inner_${obj.getName()}`
        }
        return obj.getName()
      }

      if (n instanceof GraphContainer) {
        const color = n instanceof GraphInner ? 'blue' : 'brown'
        const groupProps = makeRecord(n.constructor.name, color, collectProperties(n))
        this.lout(`subgraph cluster_${n.getName()} {`, true)
        this.lout('color=blue;')
        this.lout(`${n.getName()}[shape=plaintext, label=<\n\t${groupProps.join('\n\t\t')}\t\n>];`)
        // group or inner
        n.getObjects(true).forEach(o => { c(o) })
        this.lout('}', false)
      } else {
        const color = n instanceof GraphVertex ? 'maroon' : 'darkgreen'
        const nodeProps = makeRecord(n.constructor.name, color, collectProperties(n))
        // Vertex (or ref)
        this.lout(`${getName(n)}[shape=plaintext, label=<\n\t${nodeProps.join('\n\t\t')}\t\n>];`)
      }
    }, this)

    this.graphCanvas.getEdges().forEach(e => {
      // TODO: Add default edgetype (flip if flipped) report in label
      const params = collectProperties(e)
      const paramTextBlock = Object.entries(params).map(([k, v], idx) => `${k}=${v}`).join('\\n')
      const label = `${e.constructor.name}\\n${paramTextBlock}`
      this.lout(`${e.left.getName()} -> ${e.right.getName()}[label="${label}"];`)
    })
    this.lout('}', false)
    this.lout('}', false)
  }
}
generators.set('ast_record', ASTRecord)
