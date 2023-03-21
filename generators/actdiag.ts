// @ts-check

import { GraphGroup } from '../model/graphgroup.js'
import { getAttributeAndFormat, multiAttrFmt } from '../model/support.js'
import { type GraphConnectable } from '../model/graphconnectable.js'
import { GraphVertex } from '../model/graphvertex.js'
import { GraphEdgeLineType } from '../model/graphedge.js'
import { type Shapes } from '../model/shapes.js'
import { Generator } from './generator.js'

const ActDiagShapeMap: Shapes = {
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
 *
 * To test: node js/generate.js tests/test_inputs/events.txt actdiag |actdiag -Tpng -o a.png - && open a.png
 * http://blockdiag.com/en/actdiag/
 *
 * Actual grammar is vague (probably as with blockdiag, check there):
 * Example1: actdiag { A->B->C->D; lane foo{label="notFoo" A;B;} lane bar {C[label="Not C"];D;}}
 *
 * http://blockdiag.com/en/blockdiag/
 */
export class ActDiag extends Generator {
  generate() {
    this.lout('actdiag {', true)
    this.lout('default_fontsize = 14')
    if (this.graphCanvas.getDirection() === 'portrait') {
      this.lout('orientation=portrait')
    } else {
      // DEFAULT
      this.lout('orientation=landscape')
    }
    /**
       * does not really work..but portrait mode if
       * (r.getDirection()==="portrait"){ this.lout(" orientation=portrait");
       * }else{ //DEFAULT this.lout(" orientation=landscape"); }
       */
    const parseObjects = (obj: GraphConnectable) => {
      if (obj instanceof GraphGroup) {
        this.lout(`lane "${obj.getName()}"{`, true)
        obj.getObjects().forEach((obj: GraphConnectable) => {
          const mappedShape = (obj => {
            if (obj instanceof GraphVertex) {
              const currentShape = obj.shape as keyof typeof ActDiagShapeMap
              if (obj.shape && !ActDiagShapeMap[currentShape]) {
                throw new Error('Missing shape mapping')
              }
              const mappedShape = ActDiagShapeMap[currentShape] ? ActDiagShapeMap[currentShape] : ActDiagShapeMap.default
              const nattrs: string[] = []
              nattrs.push(`shape=${mappedShape}`)
              if (extraShapeAttrs[currentShape]) {
                const v = extraShapeAttrs[currentShape]
                Object.entries(v).forEach(([k, v]) => nattrs.push(`${k}="${String(v)}"`))
              }
              return nattrs
            }
          })(obj)

          const colorShapeLabel = multiAttrFmt(obj, {
            color: 'color="{0}"',
            label: 'label="{0}"'
          }, mappedShape)
          this.lout(`${obj.getName()} ${colorShapeLabel};`)
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

        const mappedShape = (obj => {
          if (obj instanceof GraphVertex) {
            const currentShape = obj.shape as keyof typeof ActDiagShapeMap

            if (obj.shape && !ActDiagShapeMap[currentShape]) {
              throw new Error('Missing shape mapping')
            }
            const mappedShape = ActDiagShapeMap[currentShape] ? ActDiagShapeMap[currentShape] : ActDiagShapeMap.default
            return [`shape=${mappedShape}`]
          }
        })(obj)

        // ICON does not work, using background
        const colorIconShapeLabel = multiAttrFmt(obj, {
          color: 'color="{0}"',
          image: 'background="icons{0}"',
          label: 'label="{0}"'
        }, mappedShape)
        this.lout(`${obj.getName()}${colorIconShapeLabel};`)
      }
    }
    this.graphCanvas.getObjects().forEach(o => { parseObjects(o) })

    this.graphCanvas.getEdges().forEach((edge) => {
      let s = ''
      if (edge.lineType() === GraphEdgeLineType.DOTTED) {
        s += 'style="dotted"'
      } else if (edge.lineType() === GraphEdgeLineType.DASHED) {
        s += 'style="dashed"'
      }
      const t = multiAttrFmt(edge, {
        label: 'label="{0}"',
        color: 'color="{0}"'
      }, [s])
      this.lout(`${edge.left.getName()} -> ${edge.right.getName()} ${t};`)
    })
    this.lout('}', false)
  }
}
