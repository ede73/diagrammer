// @ts-check

import { generators } from '../model/graphcanvas.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphVertex } from '../model/graphvertex.js'
import { getAttributeAndFormat, multiAttrFmt } from '../model/support.js'
import { type GraphConnectable } from '../model/graphconnectable.js'
import { GraphEdgeLineType } from '../model/graphedge.js'
import { type Shapes } from '../model/shapes.js'
import { Generator } from './generator.js'

// ADD TO INDEX.HTML AS: <option value="blockdiag">Block Diagram(cli)</option>
const BlockDiagShapeMap: Shapes = {
  // invis: 'invis',
  actor: 'actor',
  beginpoint: 'beginpoint',
  circle: 'circle',
  cloud: 'cloud',
  condition: 'flowchart.condition',
  database: 'flowchart.database',
  default: 'box',
  diamond: 'diamond',
  dots: 'dots',
  doublecircle: 'circle',
  ellipse: 'ellipse',
  endpoint: 'endpoint',
  folder: 'box',
  input: 'flowchart.input',
  left: 'flowchart.loopin', // rotate=90
  loop: 'flowchart.loopin',
  loopin: 'flowchart.loopin',
  loopout: 'flowchart.loopout',
  mail: 'mail',
  document: 'note',
  display: 'ellipse',
  note: 'note',
  preparation: 'roundedbox',
  record: 'box',
  rect: 'box',
  right: 'flowchart.loopout', // rotate=90
  roundedbox: 'box', // style=rounded
  square: 'box',
  subroutine: 'roundedbox'
}

const extraShapeAttrs: { [k in keyof Shapes]: Record<string, string | number | boolean> } =
{
  left: { rotate: 90 },
  right: { rotate: 90 },
  roundedbox: { style: 'rounded' }
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
 * To test: node js/generate.js tests/test_inputs/events.txt blockdiag |blockdiag3 -Tpng -o a.png - && open a.png
 */
export class BlockDiag extends Generator {
  generate() {
    this.lout('blockdiag {', true)
    this.lout('default_fontsize = 14')
    if (this.graphCanvas.getDirection() === 'portrait') {
      this.lout('orientation=portrait')
    } else {
      // DEFAULT
      this.lout('orientation=landscape')
    }

    let lastNode = this.graphCanvas.getStart()

    const parseObjects = (obj: GraphConnectable) => {
      if (obj instanceof GraphGroup) {
        this.lout(`group "${obj.getLabel() ?? ''}"{`, true)
        this.lout(getAttributeAndFormat(obj, 'color', 'color="{0}"'))
        this.lout(getAttributeAndFormat(obj, 'label', 'label="{0}"'))
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
              const nattrs: string[] = []
              nattrs.push(`shape=${mappedShape}`)
              if (extraShapeAttrs[currentShape]) {
                const v = extraShapeAttrs[currentShape]
                Object.entries(v).forEach(([k, v]) => nattrs.push(`${k}="${String(v)}"`))
              }
              return nattrs
            }
          })(obj)

          const tmp = multiAttrFmt(obj, {
            color: 'color="{0}"',
            label: 'label="{0}"'
          }, mappedShape)
          this.lout(`${obj.getName()}${tmp};`)
        })
        this.lout('}', false)
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

        this.lout(`${obj.getName()}${colorIconShapeLabel};`)
      }
    }

    this.graphCanvas.getObjects().forEach(o => { parseObjects(o) })

    this.graphCanvas.getEdges().forEach(edge => {
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

      this.lout(`${edge.left.getName()} -> ${edge.right.getName()}${t};`)
    })
    this.lout('}', false)
  }
}
generators.set('blockdiag', BlockDiag)
