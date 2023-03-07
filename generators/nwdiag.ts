// @ts-check
import { generators, type GraphCanvas } from '../model/graphcanvas.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphReference } from '../model/graphreference.js'
import { output, getAttributeAndFormat, multiAttrFmt } from '../model/support.js'
import { GraphVertex } from '../model/graphvertex.js'
import { type GraphConnectable } from '../model/graphconnectable.js'

// ADD TO INDEX.HTML AS: <option value="nwdiag">Network Diagram(cli)</option>

const NetworkDiagShapeMap =
{
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
 * http://blockdiag.com/en/nwdiag/
 * To test: node js/diagrammer.js tests/test_inputs/state13.txt nwdiag |nwdiag3 -Tpng -o a.png - && open a.png
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
      const objShape = obj.shape as keyof typeof NetworkDiagShapeMap
      if (obj.shape && !NetworkDiagShapeMap[objShape]) {
        throw new Error('Missing shape mapping')
      }
      const mappedShape = NetworkDiagShapeMap[objShape] ? NetworkDiagShapeMap[objShape] : NetworkDiagShapeMap.default
      return [`shape=${mappedShape}`]
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
