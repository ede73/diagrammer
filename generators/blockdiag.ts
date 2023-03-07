// @ts-check

import { generators, type GraphCanvas } from '../model/graphcanvas.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphVertex } from '../model/graphvertex.js'
import { getAttributeAndFormat, multiAttrFmt, output } from '../model/support.js'
import { type GraphConnectable } from '../model/graphconnectable.js'
import { GraphEdgeLineType } from '../model/graphedge.js'

// ADD TO INDEX.HTML AS: <option value="blockdiag">Block Diagram(cli)</option>

const BlockDiagShapeMap = {
  default: 'box',
  invis: 'invis',
  record: 'box',
  doublecircle: 'endpoint',
  box: 'box',
  rect: 'box',
  rectangle: 'box',
  square: 'square',
  roundedbox: 'roundedbox',
  dots: 'dots',
  circle: 'circle',
  ellipse: 'ellipse',
  diamond: 'diamond',
  minidiamond: 'minidiamond',
  minisquare: 'minidiamond',
  note: 'note',
  mail: 'mail',
  cloud: 'cloud',
  actor: 'actor',
  beginpoint: 'flowchart.beginpoint',
  endpoint: 'flowchart.endpoint',
  condition: 'flowchart.condition',
  database: 'flowchart.database',
  terminator: 'flowchart.terminator',
  input: 'flowchart.input',
  loopin: 'flowchart.loopin',
  loop: 'flowchart.loop',
  loopstart: 'flowchart.loopin',
  loopout: 'flowchart.loopout',
  loopend: 'flowchart.loopout'
}

/**
 * http://blockdiag.com/en/blockdiag/
 *
 * Grammar: blockdiag {
 *   node_width=128
 *   node_height=40
 *   span_width=64
 *   span_height=40
 *   default_fontsize=??
 *   default_shape=xxx
 *   orientation=landscape
 *   default_node_color=[#RRGGBB|ColorName]
 *   default_group_color=[#RRGGBB|ColorName]
 *   default_linecolor=[#RRGGBB|ColorName]
 *   default_textcolor=[#RRGGBB|ColorName]
 *   edge_layout=[normal|flowchart]
 * }
 *
 * A Node: node[params] where params:
 *   label=""
 *   style=dotted|dashed|number
 *   color=[#RRGGBB|ColorName]
 *   numbered=set a number to the node
 *   shape=box
 *   background=filepath or URL
 *   stacked=
 *   description=""
 *   icon=filepath or URL
 *   textcolor=[#RRGGBB|ColorName]
 *   width=128
 *   height=40
 *   fontsize=11
 *   rotate=0
 *
 * An Edge: node1->node2->node3 [edgeparams]
 *   label=""
 *   style=dotted|dashed|none|number
 *   hstyle=generalization|composition|aggregation
 *   color=[#RRGGBB|ColorName]
 *   dir=none|forward|back|both
 *   folded
 *   textcolor=[#RRGGBB|ColorName]
 *   thick
 *   fontsize=11
 *
 * To test: node js/diagrammer.js tests/test_inputs/events.txt blockdiag |blockdiag3 -Tpng -o a.png - && open a.png
 */
export function blockdiag(graphcanvas: GraphCanvas) {
  const lout = (...args: any[]) => {
    const [textOrIndent, maybeIndent] = args
    output(graphcanvas, textOrIndent, maybeIndent)
  }
  lout('blockdiag {', true)
  lout('default_fontsize = 14')
  if (graphcanvas.getDirection() === 'portrait') {
    lout('orientation=portrait')
  } else {
    // DEFAULT
    lout('orientation=landscape')
  }

  let lastNode = graphcanvas.getStart()

  const parseObjects = (obj: GraphConnectable) => {
    if (obj instanceof GraphGroup) {
      lout(`group "${obj.getLabel()}"{`, true)
      lout(getAttributeAndFormat(obj, 'color', 'color="{0}"'))
      lout(getAttributeAndFormat(obj, 'label', 'label="{0}"'))
      if (lastNode && lastNode.trim() !== '') {
        lastNode = `[${lastNode.trim().substring(1)}]`
      }
      obj.getObjects().forEach(obj => {
        const mappedShape = (obj => {
          if (obj instanceof GraphVertex) {
            const currentShape = obj.shape as keyof typeof BlockDiagShapeMap
            if (obj.shape && !BlockDiagShapeMap[currentShape]) {
              throw new Error('Missing shape mapping')
            }
            const mappedShape = BlockDiagShapeMap[currentShape] ? BlockDiagShapeMap[currentShape] : BlockDiagShapeMap.default
            return [`shape=${mappedShape}`]
          }
        })(obj)

        const tmp = multiAttrFmt(obj, {
          color: 'color="{0}"',
          label: 'label="{0}"'
        }, mappedShape)
        lout(`${obj.getName()}${tmp};`)
      })
      lout('}', false)
    } else {
      // dotted,dashed,solid
      // NOT invis,bold,rounded,diagonals
      // ICON does not work, using background
      let style = getAttributeAndFormat(obj, 'style', ', style="{0}"')
      if (style !== '' && style.match(/(dotted|dashed|solid)/) === null) {
        style = ''
      }
      const currentShape = (obj as GraphVertex).shape as keyof typeof BlockDiagShapeMap
      if ((obj as GraphVertex).shape && !BlockDiagShapeMap[currentShape]) {
        throw new Error('Missing shape mapping')
      }
      const mappedShape = BlockDiagShapeMap[currentShape] ? BlockDiagShapeMap[currentShape] : BlockDiagShapeMap.default

      const colorIconShapeLabel = multiAttrFmt(obj, {
        color: 'color="{0}"',
        image: 'background="icons{0}"',
        label: 'label="{0}"'
      }, [`shape=${mappedShape}`, style])

      lout(`${obj.getName()}${colorIconShapeLabel};`)
    }
  }

  graphcanvas.getObjects().forEach(o => { parseObjects(o) })

  graphcanvas.getEdges().forEach(edge => {
    let s = ''
    if (edge.lineType() === GraphEdgeLineType.DOTTED) {
      s = 'style="dotted"'
    } else if (edge.lineType() === GraphEdgeLineType.DASHED) {
      s = 'style="dashed"'
    }
    const t = multiAttrFmt(edge, {
      label: 'label="{0}"',
      color: 'color="{0}"'
    }, [s])

    lout(`${edge.left.getName()} -> ${edge.right.getName()}${t};`)
  })
  lout('}', false)
}
generators.set('blockdiag', blockdiag)
