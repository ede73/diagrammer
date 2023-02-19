import { generators } from '../model/graphcanvas.js'
// eslint-disable-next-line no-unused-vars
import { GraphConnectable } from '../model/graphconnectable.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphVertex } from '../model/graphvertex.js'
import { debug, getAttributeAndFormat, iterateEdges, output, outputFormattedText } from '../model/support.js'
import { getVertex, traverseVertices } from '../model/model.js'

// ADD TO INDEX.HTML AS: <option value="plantuml_sequence">PlantUML - Sequence(cli)</option>

const PlantUMLShapeMap = {
  default: 'box',
  invis: 'invis',
  record: 'record',
  doublecircle: 'doublecircle',
  box: 'box',
  rect: 'box',
  rectangle: 'box',
  square: 'square',
  roundedbox: 'box',
  dots: 'point',
  circle: 'circle',
  ellipse: 'ellipse',
  diamond: 'diamond',
  minidiamond: 'Mdiamond',
  minisquare: 'Msquare',
  note: 'note',
  mail: 'tab',
  cloud: 'tripleoctagon',
  actor: 'cds',
  beginpoint: 'circle',
  endpoint: 'doublecircle',
  condition: 'MDiamond',
  database: 'Mcircle',
  terminator: 'ellipse',
  input: 'parallelogram',
  loopin: 'house',
  loop: 'house',
  loopstart: 'house',
  loopout: 'invhouse',
  loopend: 'invhouse'
}
/**
 *
 * node js/diagrammer.js verbose tests/test_inputs/events.txt plantuml_sequence | java -Xmx2048m -jar ext/plantuml.jar -tpng -pipe > output.png && open output.png
 * @param {GraphCanvas} graphcanvas
*/
// eslint-disable-next-line camelcase
export function plantuml_sequence (graphcanvas) {
  const lout = (...args) => {
    output(graphcanvas, ...args)
  }

  const processAVertex = function (obj, sbgraph) {
    const nattrs = []
    const styles = []

    getAttributeAndFormat(obj, 'style', '{0}', styles)
    if (styles.length > 0) {
      if (styles.join('').indexOf('singularity') !== -1) {
        // invis node is not singularity!, circle with minimal
        // width/height IS!
        nattrs.push('shape="circle"')
        nattrs.push('label=""')
        nattrs.push('width=0.01')
        nattrs.push('weight=0.01')
      } else {
        nattrs.push(`style="${styles.sort().join(',')}"`)
      }
    }
    getAttributeAndFormat(obj, 'image', 'image="icons{0}"', nattrs)
    getAttributeAndFormat(obj, 'textcolor', 'fontcolor="{0}"', nattrs)

    if (obj.shape && !PlantUMLShapeMap[obj.shape]) {
      throw new Error('Missing shape mapping')
    }
    if (obj.shape) {
      const shape = 'shape="{0}"'.format(PlantUMLShapeMap[obj.shape])
      nattrs.push(shape)
    }
    let t = ''
    if (nattrs.length > 0) { t = `[${nattrs.sort().join(',')}]` }
    lout('participant {0} {1} {2}'.format(
      getAttributeAndFormat(obj, 'label', '"{0}" as'),
      obj.getName(),
      t))
  }

  lout('@startuml')
  lout('autonumber', true)
  /*
     * if (r.getDirection() === "portrait") { lout( indent("rankdir=LR;")); }
     * else { lout( indent("rankdir=TD;")); }
     */
  // This may FORWARD DECLARE a node...which creates problems with coloring
  const s = graphcanvas.getStart()
  if (s) {
    const fwd = getVertex(graphcanvas.yy, s)
    processAVertex(fwd, false)
  }
  /**
     * print only NON PRINTED container edges. If first non printed edge is NOT
     * for this container, break out immediately
     * this is to emulate ORDERED nodes of plantuml
     * (node=edge,node,edge.group...all in order for this fucker)
     * @param {GraphConnectable} container
     * @param {boolean} sbgraph
     */
  const printEdges = (container, sbgraph) => {
    for (const edge of iterateEdges(graphcanvas)) {
      if (edge.printed) { continue }
      // if container given, print ONLY THOSE edges that match this
      // container!
      if (edge.container !== container) { break }
      edge.printed = true
      let note = ''
      let label = edge.label
      if (label) {
        if (label.indexOf('::') !== -1) {
          label = label.split('::')
          note = label[1].trim()
          label = label[0].trim()
        }
      }
      const color = getAttributeAndFormat(edge, 'color', '[{0}]').trim()
      let lt
      let rhs = edge.right
      let lhs = edge.left

      // lout( indent("//"+lr));
      if (rhs instanceof GraphGroup) {
        // just pick ONE Vertex from group and use lhead
        // TODO: Assuming it is Vertex (if Recursive groups implemented,
        // it could be smthg else)
        // attrs.push(" lhead=cluster_" + lr.getName());
        // TODO:
        if (rhs.isEmpty()) {
          // TODO:Bad thing, EMPTY group..add one invisible node
          // there...
          // But should add already at TOP
        } else {
          rhs = rhs.getFirstObject()
        }
      }
      if (lhs instanceof GraphGroup) {
        // attrs.push(" ltail=cluster_" + ll.getName());
        // TODO:
        if (lhs.isEmpty()) {
          // Same as above
        } else {
          lhs = lhs.getFirstObject()
        }
      }
      // TODO:Assuming producing DIGRAPH
      // For GRAPH all edges are type --
      // but we could SET arrow type if we'd like
      if (edge.isBroken()) {
        // TODO: Somehow denote better this "quite does not reach"
        // even though such an edge type MAKES NO SENSE in a graph
        // attrs.push('arrowhead="tee"');
        // TODO:
      }
      const dot = edge.isDotted()
      const dash = edge.isDashed()
      let swap = false
      if (edge.edgeType.indexOf('<') !== -1 && edge.edgeType.indexOf('>') !== -1) {
        lt = (dot ? '-' : '') + '-' + color + '>'
        swap = true
      } else if (edge.edgeType.indexOf('<') !== -1) {
        const tmp = lhs
        lhs = rhs
        rhs = tmp
        lt = (dot ? '-' : '') + '-' + color + '>'
      } else if (edge.edgeType.indexOf('>') !== -1) {
        lt = (dot ? '-' : '') + '-' + color + '>'
      } else if (dot) {
        // dotted
        lout(getAttributeAndFormat(edge, 'label', '...{0}...'))
        continue
      } else if (dash) {
        // dashed
        lout(getAttributeAndFormat(edge, 'label', '=={0}=='))
        continue
      } else {
        // is dotted or dashed no direction
        lt = `-${color}>`
      }
      const t = ''
      if (label) { label = `:${label}` } else { label = '' }
      lout(lhs.getName() + lt + rhs.getName() + t + label)
      if (swap) { lout(rhs.getName() + lt + lhs.getName() + t + label) }
      if (sbgraph) {
        if (!rhs.active) {
          lout(`activate ${rhs.getName()}`, true)
          rhs.active = true
        } else {
          lhs.active = false
          output(false)
          lout(`deactivate ${lhs.getName()}`)
        }
      } else {
        if (lhs.active) {
          lhs.active = false
          output(false)
          lout(`deactivate ${lhs.getName()}`)
        }
      }
      if (note !== '') {
        lout(`note over ${rhs.getName()}`)
        outputFormattedText(graphcanvas, note.replace(/\\n/g, '\n'))
        lout('end note')
      }
    }
  }

  const ltraverseVertices = (/** @type {GraphConnectable} */root, /** @type {boolean} */isInnerGraph) => {
    // Dump this groups participants first...
    traverseVertices(root, maybeVertex => {
      if (maybeVertex instanceof GraphVertex) { processAVertex(maybeVertex, isInnerGraph) }
    })
    printEdges(root, isInnerGraph)

    traverseVertices(root, maybeGroup => {
      // TODO:
      if (maybeGroup instanceof GraphGroup) {
        // Group name,OBJECTS,get/setEqual,toString
        debug('processAGroup:' + JSON.stringify(maybeGroup))
        let cond = maybeGroup.conditional
        if (cond) {
          if (cond === 'if') {
            cond = 'alt'
          } else if (cond === 'elseif') {
            cond = 'else'
          } else if (cond === 'else') {
            cond = 'else'
          } else if (cond === 'endif') {
            cond = 'end'
          }
          lout(cond + ' ' + maybeGroup.getLabel())
        } else {
          cond = ''// cond = "ref";
        }
        const nodeIsSubGraph = maybeGroup.isInnerGraph
        if (maybeGroup.getColor()) {
          lout('style=filled;')
          lout(getAttributeAndFormat(maybeGroup, 'color',
            '   color="{0}";\n'))
        }
        ltraverseVertices(maybeGroup, nodeIsSubGraph)
        printEdges(maybeGroup)
      } else if (!(maybeGroup instanceof GraphVertex)) {
        throw new Error('Not a node nor a group, NOT SUPPORTED')
      }
    })
  }
  ltraverseVertices(graphcanvas, false)
  printEdges(graphcanvas)
  output(false)
  lout('@enduml')
}
generators.set('plantuml_sequence', plantuml_sequence)
