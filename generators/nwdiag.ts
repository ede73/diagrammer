// @ts-check
import { generators, GraphCanvas } from '../model/graphcanvas.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphReference } from '../model/graphreference.js'
import { traverseEdges, traverseVertices } from '../model/traversal.js'
import { output, getAttributeAndFormat, multiAttrFmt } from '../model/support.js'
import { GraphVertex } from '../model/graphvertex.js'

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
  const lout = (...args) => {
    const [textOrIndent, maybeIndent] = args
    output(graphcanvas, textOrIndent, maybeIndent)
  }

  lout('nwdiag {', true)
  lout('default_fontsize = 16')

  traverseEdges(graphcanvas, edge => {
    if (!(edge.left instanceof GraphGroup || edge.right instanceof GraphGroup)) {
      lout(`${edge.left.getName()} -- ${edge.right.getName()};`)
    }
  })

  traverseVertices(graphcanvas, obj => {
    if (obj instanceof GraphGroup) {
      // split the label to two, NAME and address
      lout(`network ${obj.getName()} {`, true)
      if (obj.getLabel() !== '') {
        lout(`address="${obj.getLabel()}"`)
      }
      // TODO: bad, flatmatting the graph
      traverseVertices(obj, secondLvlObj => {
        if (secondLvlObj instanceof GraphReference) {
          // this is referred node
          lout(`${secondLvlObj.getName()};`)
          //return??
        }

        const mappedShape = (obj => {
          if (obj instanceof GraphVertex) {
            if (obj.shape && !NetworkDiagShapeMap[obj.shape]) {
              throw new Error('Missing shape mapping')
            }
            const mappedShape = NetworkDiagShapeMap[obj.shape] ? NetworkDiagShapeMap[obj.shape] : NetworkDiagShapeMap.default
            return [`shape=${mappedShape}`]
          }
        })(secondLvlObj);

        const tmp = multiAttrFmt(secondLvlObj, {
          color: 'color="{0}"',
          label: 'address="{0}"'
        }, mappedShape)

        lout(`${secondLvlObj.getName()}${tmp};`)
      }, true)

      // find if there are ANY edges that have this GROUP as participant!
      traverseEdges(graphcanvas, edge => {
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
      const mappedShape = (obj => {
        if (obj instanceof GraphVertex) {
          if (obj.shape && !NetworkDiagShapeMap[obj.shape]) {
            throw new Error('Missing shape mapping')
          }
          const mappedShape = NetworkDiagShapeMap[obj.shape] ? NetworkDiagShapeMap[obj.shape] : NetworkDiagShapeMap.default
          return [`shape=${mappedShape}`]
        }
      })(obj);
      // ICON does not work, using background
      const tmp = multiAttrFmt(obj, {
        color: 'color="{0}"',
        image: 'background="icons{0}"',
        label: 'label="{0}"'
      }, mappedShape)
      lout(`${obj.getName()}${tmp};`)
    }
  })

  lout('}', false)
}
generators.set('nwdiag', nwdiag)
