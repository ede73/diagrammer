// @ts-check

import { generators, type GraphCanvas } from '../model/graphcanvas.js'
import { GraphGroup } from '../model/graphgroup.js'
import { getAttributeAndFormat, output, multiAttrFmt } from '../model/support.js'
import { type GraphConnectable } from '../model/graphconnectable.js'
import { GraphVertex } from '../model/graphvertex.js'
import { GraphEdgeLineType } from '../model/graphedge.js'
import { type Shapes } from '../model/shapes.js'

// ADD TO INDEX.HTML AS: <option value="actdiag">Activity Diagram(cli)</option>

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
export function actdiag(graphcanvas: GraphCanvas) {
  const lout = (...args: any[]) => {
    const [textOrIndent, maybeIndent] = args
    output(graphcanvas, textOrIndent, maybeIndent)
  }
  lout('actdiag {', true)
  lout('default_fontsize = 14')
  if (graphcanvas.getDirection() === 'portrait') {
    lout('orientation=portrait')
  } else {
    // DEFAULT
    lout('orientation=landscape')
  }
  /**
     * does not really work..but portrait mode if
     * (r.getDirection()==="portrait"){ lout(" orientation=portrait");
     * }else{ //DEFAULT lout(" orientation=landscape"); }
     */
  const parseObjects = (obj: GraphConnectable) => {
    if (obj instanceof GraphGroup) {
      lout(`lane "${obj.getName()}"{`, true)
      obj.getObjects().forEach((obj: GraphConnectable) => {
        const mappedShape = (obj => {
          if (obj instanceof GraphVertex) {
            const currentShape = obj.shape // as keyof typeof ActDiagShapeMap
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
        lout(`${obj.getName()} ${colorShapeLabel};`)
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

      const mappedShape = (obj => {
        if (obj instanceof GraphVertex) {
          const currentShape = obj.shape

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
      lout(`${obj.getName()}${colorIconShapeLabel};`)
    }
  }
  graphcanvas.getObjects().forEach(o => { parseObjects(o) })

  graphcanvas.getEdges().forEach((edge) => {
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
    lout(`${edge.left.getName()} -> ${edge.right.getName()} ${t};`)
  })
  lout('}', false)
}
generators.set('actdiag', actdiag)
