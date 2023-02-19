import { generators, GraphCanvas } from '../model/graphcanvas.js'
import { GraphContainer } from '../model/graphcontainer.js'
import { traverseEdges, traverseVertices } from '../model/model.js'
import { output } from '../model/support.js'
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
 * @param {GraphCanvas} graphcanvas
*/
export function ast_record (graphcanvas) {
  const lout = (...args) => {
    output(graphcanvas, ...args)
  }

  lout('digraph {', true)
  lout('compound=true;')
  lout('rankdir=TD;')

  lout('subgraph cluster_canvas {', true)
  lout('color=yellow;')
  const label = '{ GraphCanvas | {portrait|x}| {exit|x}| {quu|x}}} }'
  lout(`GraphCanvas[shape=record, color=yellow, fillcolor=yellow, label="${label}"];`)

  traverseVertices(graphcanvas, function c (n) {
    if (n instanceof GraphContainer) {
      lout(`subgraph cluster_${n.getName()} {`, true)
      lout('color=blue;')
      const label = `{ ${n.constructor.name} | {name|${n.getName()}}} }`
      lout(`${n.getName()}[shape=record, color=blue, fillcolor=blue, label="${label}"];`)
      // group or inner
      traverseVertices(n, c)
      lout('}', false)
    } else {
      // Vertex (or ref)
      const label = `{ ${n.constructor.name} | {name|${n.getName()}} |{shape|${n.getShape()}} }`
      lout(`${n.getName()}[shape=record, color=red, fillcolor=red ,label="${label}"];`)
    }
  })

  traverseEdges(graphcanvas, e => {
    // TODO: Add default edgetype (flip if flipped) report in label
    lout(`${e.left.getName()} -${e.edgeType} ${e.right.getName()}[label="${e.constructor.name}"];`)
  })
  lout('}', false)
  lout('}', false)
}
generators.set('ast_record', ast_record)
