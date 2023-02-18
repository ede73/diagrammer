import { generators } from '../model/graphcanvas.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphVertex } from '../model/graphvertex.js'
import { traverseEdges } from '../model/model.js'
import { getAttributeAndFormat, output } from '../model/support.js'

// ADD TO INDEX.HTML AS: <option value="seqdiag">Sequence Diagram(cli)</option>

/**
 * http://blockdiag.com/en/seqdiag/index.html
 *
 * Actual grammar unknown (check actdiag, blockdiag)
 * http://blockdiag.com/en/seqdiag/examples.html#diagram-attributes
 *
 * To test: node js/diagrammer.js tests/test_inputs/state13.txt seqdiag |seqdiag3 -Tpng -o a.png - && open a.png
 * @param {GraphCanvas} graphcanvas
 */
export function seqdiag (graphcanvas) {
  output(graphcanvas, 'seqdiag {', true)
  output(graphcanvas, 'autonumber = True;')
  // quite fucked up life line activations and no control over..skip
  // it,shrimpy!
  output(graphcanvas, 'activation = none;')

  // print out all node declarations FIRST (if any)
  for (const i in graphcanvas.OBJECTS) {
    if (!Object.prototype.hasOwnProperty.call(graphcanvas.OBJECTS, i)) continue
    const obj = graphcanvas.OBJECTS[i]

    if (obj instanceof GraphGroup) {
      output(graphcanvas, ' /*' + obj.getName() + getAttributeAndFormat(obj, 'label', ' {0}*/'))
      for (const j in obj.OBJECTS) {
        if (!Object.prototype.hasOwnProperty.call(obj.OBJECTS, j)) continue
        const z = obj.OBJECTS[j]
        // no color support either..
        let styleAndLabel = getAttributeAndFormat(z, 'style', ',style={0}') +
                    getAttributeAndFormat(z, 'label', ',label="{0}"')
        if (styleAndLabel.trim() !== '') { styleAndLabel = `[${styleAndLabel.trim().substring(1)}]` }
        output(graphcanvas, `${z.getName()}${styleAndLabel};`)
      }
    } else if (obj instanceof GraphVertex) {
      let styleAndLabel = getAttributeAndFormat(obj, 'style', ',style={0}') +
                getAttributeAndFormat(obj, 'label', ',label="{0}"') +
                getAttributeAndFormat(obj, 'color', ',color="{0}"')
      if (styleAndLabel.trim() !== '') {
        styleAndLabel = `[${styleAndLabel.trim().substring(1)}]`
      }
      output(graphcanvas, `${obj.getName()}${styleAndLabel};`)
    }
  }

  traverseEdges(graphcanvas, edge => {
    const attrs = []
    let edgeType = ''
    let rhs = edge.right
    const lhs = edge.left

    const color = edge.color
    if (color) {
      attrs.push(`color="${color}"`)
    }
    let label = edge.label
    if (label) {
      if (label.indexOf('::') !== -1) {
        label = label.split('::')
        attrs.push(`note="${label[1].trim()}"`)
        attrs.push(`label="${label[0].trim()}"`)
      } else {
        attrs.push(`label="${label.trim()}"`)
      }
    }
    if (rhs instanceof GraphGroup) {
      // just pick ONE Vertex from group and use lhead
      // TODO: Assuming it is Vertex (if Recursive groups implemented, it
      // could be smthg else)
      edgeType += ` lhead=cluster_${rhs.getName()}`
      rhs = rhs.OBJECTS[0]
      if (!rhs) {
        // TODO:Bad thing, EMPTY group..add one invisible node there...
        // But should add already at TOP
      }
    }
    // TODO:Assuming producing DIGRAPH
    // For GRAPH all edges are type --
    // but we could SET arrow type if we'd like
    let rightName = rhs.getName()
    const dot = edge.isDotted()
    const dash = edge.isDashed()
    if (edge.isBroken()) {
      attrs.push('failed')
    }
    if (edge.edgeType.indexOf('<') !== -1 && edge.edgeType.indexOf('>') !== -1) {
      // Broadcast type (<>)
      // Alas not supported...
      // HMh..since one could use the === as broadcast
      // a<>b would be BETTER served as autoreturn edge
      // But I'd need to GUESS a new broadcast then..
      // hm.. solve a<>a is broadcast, where as
      // a<>b (any else than node itself) is autoreturn
      if (rhs === lhs) {
        output(graphcanvas, getAttributeAndFormat(edge, 'label', '===BROADCAST:{0}==='))
        return
      }
      edgeType = '=>'
    } else if (edge.edgeType.indexOf('<') !== -1) {
      if (dot) { edgeType = '<--' } else if (dash) { edgeType = '<<--' } else { edgeType = '<-' }
      rightName = rhs.getName()
    } else if (edge.edgeType.indexOf('>') !== -1) {
      if (dot) { edgeType = '-->' } else if (dash) { edgeType = '-->>' } else { edgeType = '->' }
    } else if (dot) {
      // dotted
      output(graphcanvas, getAttributeAndFormat(edge, 'label', '...{0}...'))
      return
    } else if (dash) {
      // dashed
      output(graphcanvas, getAttributeAndFormat(edge, 'label', '==={0}==='))
      return
    } else {
      output(graphcanvas, 'ERROR: SHOULD NOT HAPPEN')
    }
    // MUST HAVE whitespace at both sides of the "arrow"
    if (!attrs || attrs.length === 0) {
      attrs.push('label=""')
    }
    output(graphcanvas, `${lhs.getName()} ${edgeType} ${rightName}[${attrs.join(',')}];`)
  })
  output(graphcanvas, '}', false)
}
generators.set('seqdiag', seqdiag)
