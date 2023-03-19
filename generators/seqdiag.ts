// @ts-check
import { generators } from '../model/graphcanvas.js'
import { GraphEdgeLineType } from '../model/graphedge.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphVertex } from '../model/graphvertex.js'
import { getAttributeAndFormat, multiAttrFmt } from '../model/support.js'
import { Generator } from './generator.js'

// ADD TO INDEX.HTML AS: <option value="seqdiag">Sequence Diagram(cli)</option>

/**
 * http://blockdiag.com/en/seqdiag/index.html
 *
 * Actual grammar unknown (check actdiag, blockdiag)
 * http://blockdiag.com/en/seqdiag/examples.html#diagram-attributes
 *
 * To test: node js/generate.js tests/test_inputs/state13.txt seqdiag |seqdiag3 -Tpng -o a.png - && open a.png
 */
export class SeqDiag extends Generator {
  generate() {
    this.lout('seqdiag {', true)
    this.lout('autonumber = True;')
    // quite fucked up life line activations and no control over..skip
    // it,shrimpy!
    this.lout('activation = none;')

    // print out all node declarations FIRST (if any)
    this.graphCanvas.getObjects().forEach(obj => {
      if (obj instanceof GraphGroup) {
        this.lout('/*' + obj.getName() + getAttributeAndFormat(obj, 'label', ' {0}*/'))
        obj.getObjects().forEach(secondLvlObj => {
          // no color support either..
          const styleAndLabel = multiAttrFmt(secondLvlObj, {
            style: 'style={0}',
            label: 'label="{0}"'
          })
          this.lout(`${secondLvlObj.getName()}${styleAndLabel};`)
        })
      } else if (obj instanceof GraphVertex) {
        const styleAndLabel = multiAttrFmt(obj, {
          style: 'style={0}',
          label: 'label="{0}"',
          color: 'color="{0}"'
        })
        this.lout(`${obj.getName()}${styleAndLabel};`)
      }
    })

    this.graphCanvas.getEdges().forEach(edge => {
      const attrs: string[] = []
      let edgeType = ''
      let rhs = edge.right
      const lhs = edge.left

      const color = edge.color
      if (color) {
        attrs.push(`color="${color}"`)
      }
      const label = edge.label
      if (label) {
        if (label.includes('::')) {
          const labels = label.split('::')
          attrs.push(`note="${labels[1].trim()}"`)
          attrs.push(`label="${labels[0].trim()}"`)
        } else {
          attrs.push(`label="${label.trim()}"`)
        }
      }
      if (rhs instanceof GraphGroup) {
        // just pick ONE Vertex from group and use lhead
        // TODO: Assuming it is Vertex (if Recursive groups implemented, it
        // could be smthg else)
        edgeType += ` lhead=cluster_${rhs.getName()}`
        if (rhs.getObjects()) {
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
      const dot = edge.lineType() === GraphEdgeLineType.DOTTED
      const dash = edge.lineType() === GraphEdgeLineType.DASHED
      if (edge.lineType() === GraphEdgeLineType.BROKEN) {
        attrs.push('failed')
      }
      if (edge.edgeType.includes('<') && edge.edgeType.includes('>')) {
        // Broadcast type (<>)
        // Alas not supported...
        // HMh..since one could use the === as broadcast
        // a<>b would be BETTER served as autoreturn edge
        // But I'd need to GUESS a new broadcast then..
        // hm.. solve a<>a is broadcast, where as
        // a<>b (any else than node itself) is autoreturn
        if (rhs === lhs) {
          this.lout(getAttributeAndFormat(edge, 'label', '===BROADCAST:{0}==='))
          return
        }
        edgeType = '=>'
      } else if (edge.edgeType.includes('<')) {
        if (dot) { edgeType = '<--' } else if (dash) { edgeType = '<<--' } else { edgeType = '<-' }
        rightName = rhs.getName()
      } else if (edge.edgeType.includes('>')) {
        if (dot) { edgeType = '-->' } else if (dash) { edgeType = '-->>' } else { edgeType = '->' }
      } else if (dot) {
        // dotted
        this.lout(getAttributeAndFormat(edge, 'label', '...{0}...'))
        return
      } else if (dash) {
        // dashed
        this.lout(getAttributeAndFormat(edge, 'label', '==={0}==='))
        return
      } else {
        this.lout('ERROR: SHOULD NOT HAPPEN')
      }
      // MUST HAVE whitespace at both sides of the "arrow"
      if (!attrs || attrs.length === 0) {
        attrs.push('label=""')
      }
      this.lout(`${lhs.getName()} ${edgeType} ${rightName}[ ${attrs.sort().join(', ')} ];`)
    })
    this.lout('}', false)
  }
}
generators.set('seqdiag', SeqDiag)
