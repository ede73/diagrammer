// @ts-check
import { GraphGroup } from '../model/graphgroup.js'
import { GraphReference } from '../model/graphreference.js'
import { getAttributeAndFormat, multiAttrFmt } from '../model/support.js'
import { GraphVertex } from '../model/graphvertex.js'
import { type GraphConnectable } from '../model/graphconnectable.js'
import { type Shapes } from '../model/shapes.js'
import { Generator } from './generator.js'

const NetworkDiagShapeMap: Shapes =
{
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
  right: { rotate: 90 }
}

/**
 * http://blockdiag.com/en/nwdiag/
 * To test: node js/generate.js tests/test_inputs/state13.txt nwdiag |nwdiag3 -Tpng -o a.png - && open a.png
 */
export class NWDiag extends Generator {
  generate() {
    this.lout('nwdiag {', true)
    this.lout('// everything is so tiny, make bigger (and also badly colored)')
    this.lout('default_fontsize = 20; ')
    this.lout('default_node_color = lightblue;')
    this.lout('default_group_color = "#7777FF";')
    this.lout('default_linecolor = "#FFFFFF";')
    this.lout('default_textcolor = red;')
    this.lout('node_width = 200;  // default value is 128')
    this.lout('node_height = 100;  // default value is 40')

    this.graphCanvas.getEdges().forEach(edge => {
      if (!(edge.left instanceof GraphGroup || edge.right instanceof GraphGroup)) {
        this.lout(`${edge.left.getName() ?? ''} -- ${edge.right.getName() ?? ''};`)
      }
    })

    function getMappedShape(obj: GraphConnectable) {
      if (obj instanceof GraphVertex) {
        const currentShape = obj.shape as keyof typeof NetworkDiagShapeMap
        if (obj.shape && !NetworkDiagShapeMap[currentShape]) {
          throw new Error('Missing shape mapping')
        }
        const mappedShape = NetworkDiagShapeMap[currentShape] ? NetworkDiagShapeMap[currentShape] : NetworkDiagShapeMap.default
        const nattrs: string[] = []
        nattrs.push(`shape=${mappedShape}`)
        if (extraShapeAttrs[currentShape]) {
          const v = extraShapeAttrs[currentShape]
          Object.entries(v).forEach(([k, v]) => nattrs.push(`${k}="${String(v)}"`))
        }
        return nattrs
      }
      return []
    }

    function getNodeAttrs(obj: GraphConnectable, mappedShape: string[]): string {
      return multiAttrFmt(obj, {
        color: 'color="{0}"',
        image: 'icon="icons{0}"',
        label: 'address="{0}"'
      }, mappedShape)
    }

    this.graphCanvas.getObjects().forEach(obj => {
      if (obj instanceof GraphGroup) {
        // split the label to two, NAME and address
        this.lout(`network ${obj.getName()} {`, true)
        if (obj.getLabel() !== '') {
          this.lout(`address="${obj.getLabel() ?? ''}"`)
        }
        // TODO: bad, flatmatting the graph
        obj.getObjects(true).forEach(secondLvlObj => {
          if (secondLvlObj instanceof GraphReference) {
            // this is referred node
            this.lout(`${secondLvlObj.getName() ?? ''};`)
            // return??
          }

          const mappedShape = getNodeAttrs(secondLvlObj, getMappedShape(secondLvlObj))
          this.lout(`${secondLvlObj.getName()}${mappedShape};`)
        }, true)

        // find if there are ANY edges that have this GROUP as participant!
        this.graphCanvas.getEdges().forEach(edge => {
          const tmp = getAttributeAndFormat(edge, 'label', '[ address="{0}" ]')
          if (edge.left === obj) {
            this.lout(`${edge.right.getName()}${tmp};`)
          }
          if (edge.right === obj) {
            this.lout(`${edge.left.getName()}${tmp};`)
          }
        })
        this.lout('}', false)
      } else {
        const mappedShape = getNodeAttrs(obj, getMappedShape(obj))
        this.lout(`${obj.getName()}${mappedShape};`)
      }
    })

    this.lout('}', false)
  }
}
