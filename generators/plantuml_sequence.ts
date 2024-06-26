// @ts-check
import { type GraphConnectable } from '../model/graphconnectable.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphVertex } from '../model/graphvertex.js'
import { getAttributeAndFormat, iterateEdges, output, outputFormattedText } from '../model/support.js'
import { _getVertexOrGroup } from '../model/model.js'
import { type GraphContainer } from '../model/graphcontainer.js'
import { debug } from '../model/debug.js'
import { GraphEdgeLineType } from '../model/graphedge.js'
import { Generator } from './generator.js'

// TODO: Looks like all these have changed(broken), see https://plantuml.com/sequence-diagram
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
 * node js/generate.js verbose tests/test_inputs/events.txt plantuml_sequence | java -Xmx2048m -jar ext/plantuml.jar -tpng -pipe > output.png && open output.png
*/
// TODO:
// eslint-disable-next-line @typescript-eslint/naming-convention
export class PlantUMLSequence extends Generator {
  generate() {
    /**
     * Help JSON.stringify dump our objects (that may have circular references)
     */
    const skipEntrancesReplacer = (key: string, value: any) => {
      if (['entrance', '_entrance', 'exit', '_exit', 'parent', 'canvas'].includes(key)) {
        return null
      }
      return value
    }

    const processAVertex = (obj: GraphConnectable, isSubGraph: boolean) => {
      const nattrs: string[] = []
      const styles: string[] = []

      getAttributeAndFormat(obj, 'style', '{0}', styles)
      if (styles.length > 0) {
        if (styles.join('').includes('singularity')) {
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

      // if (obj.shape && !PlantUMLShapeMap[obj.shape]) {
      //   throw new Error('Missing shape mapping')
      // }
      // if (obj.shape) {
      //   // TODO: Looks like syntax has been broken
      //   // const shape = `shape="${PlantUMLShapeMap[obj.shape]}"`
      //   // nattrs.push(shape)
      // }
      let t = ''
      if (nattrs.length > 0) { t = `[${nattrs.sort().join(',')}]` }
      this.lout(`participant ${getAttributeAndFormat(obj, 'label', '"{0}" as')} ${obj.getName()} ${t}`)
    }

    this.lout('@startuml')
    this.lout('autonumber', true)
    // Helps testing, limiting to a widely available font
    this.lout('skinparam defaultFontName SansSerif')

    // This may FORWARD DECLARE a node...which creates problems with coloring
    const s = this.graphCanvas.getStart()
    if (s) {
      const fwd = _getVertexOrGroup(this.graphCanvas, s)
      processAVertex(fwd, false)
    }
    /**
       * print only NON PRINTED container edges. If first non printed edge is NOT
       * for this container, break out immediately
       * this is to emulate ORDERED nodes of plantuml
       * (node=edge,node,edge.group...all in order for this fucker)
       */
    const printEdges = (container: GraphContainer, isSubGraph: boolean) => {
      for (const edge of iterateEdges(this.graphCanvas)) {
        if (edge.printed) { continue }
        // if container given, print ONLY THOSE edges that match this
        // container!
        if (edge.parent !== container) { break }
        edge.printed = true
        let note = ''
        let label = edge.label
        if (label) {
          // if (edge.edgeMeaningType() === GraphEdgeMeaningType.EDGE_AND_NOTE) {}
          if (label.includes('::')) {
            const labels = label.split('::')
            note = labels[1].trim()
            label = labels[0].trim()
          }
        }
        const color = getAttributeAndFormat(edge, 'color', '[{0}]').trim()
        let linkType: string
        let rhs = edge.right
        let lhs = edge.left

        // this.lout( indent("//"+lr));
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
        if (edge.lineType() === GraphEdgeLineType.BROKEN) {
          // TODO: Somehow denote better this "quite does not reach"
          // even though such an edge type MAKES NO SENSE in a graph
          // attrs.push('arrowhead="tee"');
          // TODO:
        }
        const dot = edge.lineType() === GraphEdgeLineType.DOTTED
        const dash = edge.lineType() === GraphEdgeLineType.DASHED
        let swap = false
        if (edge.edgeType.includes('<') && edge.edgeType.includes('>')) {
          linkType = (dot ? '-' : '') + '-' + color + '>'
          swap = true
        } else if (edge.edgeType.includes('<')) {
          const tmp = lhs
          lhs = rhs
          rhs = tmp
          linkType = (dot ? '-' : '') + '-' + color + '>'
        } else if (edge.edgeType.includes('>')) {
          linkType = (dot ? '-' : '') + '-' + color + '>'
        } else if (dot) {
          // dotted
          this.lout(getAttributeAndFormat(edge, 'label', '...{0}...'))
          continue
        } else if (dash) {
          // dashed
          this.lout(getAttributeAndFormat(edge, 'label', '=={0}=='))
          continue
        } else {
          // is dotted or dashed no direction
          linkType = `-${color}>`
        }
        const t = ''
        if (label) { label = `:${label}` } else { label = '' }
        this.lout(lhs.getName() + linkType + rhs.getName() + t + label)
        if (swap) { this.lout(rhs.getName() + linkType + lhs.getName() + t + label) }
        if (isSubGraph) {
          if (!rhs.active) {
            this.lout(`activate ${rhs.getName()}`, true)
            rhs.active = true
          } else {
            lhs.active = false
            output(false)
            this.lout(`deactivate ${lhs.getName()}`)
          }
        } else {
          if (lhs.active) {
            lhs.active = false
            output(false)
            this.lout(`deactivate ${lhs.getName()}`)
          }
        }
        if (note !== '') {
          this.lout(`note over ${rhs.getName()}`)
          outputFormattedText(this.graphCanvas, note.replace(/\\n/g, '\n'))
          this.lout('end note')
        }
      }
    }

    const ltraverseVertices = (root: GraphContainer, isInnerGraph: boolean) => {
      // Dump this groups participants first...
      root.getObjects().forEach(maybeVertex => {
        if (maybeVertex instanceof GraphVertex) { processAVertex(maybeVertex, isInnerGraph) }
      })
      printEdges(root, isInnerGraph)

      root.getObjects().forEach(maybeGroup => {
        // TODO:
        if (maybeGroup instanceof GraphGroup) {
          // Group name,OBJECTS,get/setEqual,toString
          debug('processAGroup:' + JSON.stringify(maybeGroup, skipEntrancesReplacer))
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
            this.lout(cond + ' ' + (maybeGroup.getLabel() ?? ''))
          } else {
            cond = ''// cond = "ref";
          }
          const nodeIsSubGraph = maybeGroup.isInnerGraph
          if (maybeGroup.getColor()) {
            // TODO: Looks like syntax has been broken..
            // this.lout('style=filled;')
            // TODO: Looks like syntax has been broken..
            // this.lout(getAttributeAndFormat(maybeGroup, 'color',
            //   '   color="{0}";\n'))
          }
          ltraverseVertices(maybeGroup, nodeIsSubGraph)
          printEdges(maybeGroup, nodeIsSubGraph)
        } else if (!(maybeGroup instanceof GraphVertex)) {
          throw new Error('Not a node nor a group, NOT SUPPORTED')
        }
      }, this)
    }
    ltraverseVertices(this.graphCanvas, false)
    printEdges(this.graphCanvas, false)
    output(false)
    this.lout('@enduml')
  }
}
