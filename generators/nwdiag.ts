// @ts-check
import { generators, type GraphCanvas } from '../model/graphcanvas.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphReference } from '../model/graphreference.js'
import { output, getAttributeAndFormat, multiAttrFmt } from '../model/support.js'
import { GraphVertex } from '../model/graphvertex.js'
import { type GraphConnectable } from '../model/graphconnectable.js'
import { type Shapes } from '../model/shapes.js'

// ADD TO INDEX.HTML AS: <option value="nwdiag">Network Diagram(cli)</option>

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
export function nwdiag(graphcanvas: GraphCanvas) {
  const lout = (...args: any[]) => {
    const [textOrIndent, maybeIndent] = args
    output(graphcanvas, textOrIndent, maybeIndent)
  }

  lout('nwdiag {', true)
  lout('// everything is so tiny, make bigger (and also badly colored)')
  lout('default_fontsize = 20; ')
  lout('default_node_color = lightblue;')
  lout('default_group_color = "#7777FF";')
  lout('default_linecolor = "#FFFFFF";')
  lout('default_textcolor = red;')
  lout('node_width = 200;  // default value is 128')
  lout('node_height = 100;  // default value is 40')

  graphcanvas.getEdges().forEach(edge => {
    if (!(edge.left instanceof GraphGroup || edge.right instanceof GraphGroup)) {
      lout(`${edge.left.getName() ?? ''} -- ${edge.right.getName() ?? ''};`)
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

  graphcanvas.getObjects().forEach(obj => {
    if (obj instanceof GraphGroup) {
      // split the label to two, NAME and address
      lout(`network ${obj.getName()} {`, true)
      if (obj.getLabel() !== '') {
        lout(`address="${obj.getLabel() ?? ''}"`)
      }
      // TODO: bad, flatmatting the graph
      obj.getObjects(true).forEach(secondLvlObj => {
        if (secondLvlObj instanceof GraphReference) {
          // this is referred node
          lout(`${secondLvlObj.getName() ?? ''};`)
          // return??
        }

        const mappedShape = getNodeAttrs(secondLvlObj, getMappedShape(secondLvlObj))
        lout(`${secondLvlObj.getName()}${mappedShape};`)
      }, true)

      // find if there are ANY edges that have this GROUP as participant!
      graphcanvas.getEdges().forEach(edge => {
        const tmp = getAttributeAndFormat(edge, 'label', '[ address="{0}" ]')
        if (edge.left === obj) {
          lout(`${edge.right.getName()}${tmp};`)
        }
        if (edge.right === obj) {
          lout(`${edge.left.getName()}${tmp};`)
        }
      })
      lout('}', false)
    } else {
      const mappedShape = getNodeAttrs(obj, getMappedShape(obj))
      lout(`${obj.getName()}${mappedShape};`)
    }
  })

  lout('}', false)
}
generators.set('nwdiag', nwdiag)
