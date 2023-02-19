import { generators } from '../model/graphcanvas.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphVertex } from '../model/graphvertex.js'
import { traverseEdges, traverseVertices } from '../model/model.js'
import { getAttributeAndFormat, multiAttrFmt, output } from '../model/support.js'

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
  const lout = (...args) => {
    output(graphcanvas, ...args)
  }

  lout('seqdiag {', true)
  lout('autonumber = True;')
  // quite fucked up life line activations and no control over..skip
  // it,shrimpy!
  lout('activation = none;')

  // print out all node declarations FIRST (if any)
  traverseVertices(graphcanvas, obj => {
    if (obj instanceof GraphGroup) {
      lout('/*' + obj.getName() + getAttributeAndFormat(obj, 'label', ' {0}*/'))
      traverseVertices(obj, secondLvlObj => {
        // no color support either..
        const styleAndLabel = multiAttrFmt(secondLvlObj, {
          style: 'style={0}',
          label: 'label="{0}"'
        })
        lout(`${secondLvlObj.getName()}${styleAndLabel};`)
      })
    } else if (obj instanceof GraphVertex) {
      const styleAndLabel = multiAttrFmt(obj, {
        style: 'style={0}',
        label: 'label="{0}"',
        color: 'color="{0}"'
      })
      lout(`${obj.getName()}${styleAndLabel};`)
    }
  })

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
        lout(getAttributeAndFormat(edge, 'label', '===BROADCAST:{0}==='))
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
      lout(getAttributeAndFormat(edge, 'label', '...{0}...'))
      return
    } else if (dash) {
      // dashed
      lout(getAttributeAndFormat(edge, 'label', '==={0}==='))
      return
    } else {
      lout('ERROR: SHOULD NOT HAPPEN')
    }
    // MUST HAVE whitespace at both sides of the "arrow"
    if (!attrs || attrs.length === 0) {
      attrs.push('label=""')
    }
    lout(`${lhs.getName()} ${edgeType} ${rightName}[ ${attrs.sort().join(', ')} ];`)
  })
  lout('}', false)
}
generators.set('seqdiag', seqdiag)
