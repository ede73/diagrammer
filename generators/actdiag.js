import { generators } from '../model/graphcanvas.js'
import { GraphGroup } from '../model/graphgroup.js'
import { traverseEdges, traverseVertices } from '../model/model.js'
import { getAttributeAndFormat, output } from '../model/support.js'

// ADD TO INDEX.HTML AS: <option value="actdiag">Activity Diagram(cli)</option>

const ActDiagShapeMap =
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
 *
 * To test: node js/diagrammer.js tests/test_inputs/state2.txt actdiag |actdiag -Tpng -o a.png - && open a.png
 * http://blockdiag.com/en/actdiag/
 *
 * Actual grammar is vague (probably as with blockdiag, check there):
 * Example1: actdiag { A->B->C->D; lane foo{label="notFoo" A;B;} lane bar {C[label="Not C"];D;}}
 *
 * http://blockdiag.com/en/blockdiag/
 * @param {GraphCanvas} graphcanvas
 */
export function actdiag (graphcanvas) {
  const lout = (...args) => {
    output(graphcanvas, ...args)
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
  const parseObjects = (/** @type {function(GraphConnectable)} */obj) => {
    if (obj instanceof GraphGroup) {
      lout(`lane "${obj.getName()}"{`, true)
      traverseVertices(obj, (obj) => {
        if (obj.shape && !ActDiagShapeMap[obj.shape]) {
          throw new Error('Missing shape mapping')
        }
        const mappedShape = ActDiagShapeMap[obj.shape] ? ActDiagShapeMap[obj.shape] : ActDiagShapeMap.default

        let colorShapeLabel = getAttributeAndFormat(obj, 'color', ', color="{0}"') +
                    ', shape={0}'.format(mappedShape) +
                    getAttributeAndFormat(obj, 'label', ', label="{0}"')
        if (colorShapeLabel.trim() !== '') {
          colorShapeLabel = ` [ ${colorShapeLabel.trim().substring(1)} ]`
        }
        lout(`${obj.getName()}${colorShapeLabel};`)
      })
      lout('}', false)
    } else {
      // dotted,dashed,solid
      // NOT invis,bold,rounded,diagonals
      // ICON does not work, using background
      let style = getAttributeAndFormat(obj, 'style', ', style="{0}"')
      if (style !== '' && style.match(/(dotted|dashed|solid)/) == null) {
        style = ''
      }

      if (obj.shape && !ActDiagShapeMap[obj.shape]) {
        throw new Error('Missing shape mapping')
      }
      const mappedShape = ActDiagShapeMap[obj.shape] ? ActDiagShapeMap[obj.shape] : ActDiagShapeMap.default

      // ICON does not work, using background
      let colorIconShapeLabel = getAttributeAndFormat(obj, 'color', ', color="{0}"') +
                getAttributeAndFormat(obj, 'image', ', background="icons{0}"') +
                style +
                ',shape={0}'.format(mappedShape) +
                getAttributeAndFormat(obj, 'label', ', label="{0}"')
      if (colorIconShapeLabel.trim() !== '') { colorIconShapeLabel = ` [ ${colorIconShapeLabel.trim().substring(1)} ]` }
      lout(`${obj.getName()}${colorIconShapeLabel};`)
    }
  }
  traverseVertices(graphcanvas, parseObjects)

  traverseEdges(graphcanvas, (edge) => {
    let t = ''
    if (edge.isDotted()) {
      t += ', style="dotted" '
    } else if (edge.isDashed()) {
      t += ', style="dashed" '
    }
    const labelAndItsColor = getAttributeAndFormat(edge, 'label', ', label="{0}"')
    const color = getAttributeAndFormat(edge, 'color', ', color="{0}"')
    t += labelAndItsColor + color
    t = t.trim()
    if (t.substring(0, 1) === ',') { t = t.substring(1).trim() }
    if (t !== '') { t = ` [ ${t} ]` }
    lout(`${edge.left.getName()} -> ${edge.right.getName()}${t};`)
  })
  lout('}', false)
}
generators.set('actdiag', actdiag)
