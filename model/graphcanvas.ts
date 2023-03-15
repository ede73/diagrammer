// @ts-check
import { GraphEdge } from '../model/graphedge.js'
import { GraphContainer } from './graphcontainer.js'
import { ParsingContext } from './parsingcontext.js'

export const generators = new Map()
export const visualizations = new Map()

type IResult = (generatedCodeLine: string) => void

/**
* Represents the graph canvas.
*
* Some graphs may have a root code, but the whole graph canves is free to have as many as required
*
* Single root graph:
* a>b>c>d
*
* A graph with four roots
* a b c d
*
* Even if the TREE has multiple root vertices (or basically multiple trees)
* the graph will only EVER have one GraphCanvas
*
* TODO: Shouldn't inherit from GraphConnectable!
*/
export class GraphCanvas extends GraphContainer {
  /**
   * Output the generated result
   */
  result?: IResult = undefined
  generator?: string = undefined
  visualizer?: string = undefined
  shape?: string = undefined
  direction?: string = undefined
  start?: string = undefined

  // parsing context
  parsingContext: ParsingContext

  constructor() {
    super('', undefined) // Canvas has no name
    this.parsingContext = new ParsingContext(this)
  }

  setGenerator(value: string): GraphCanvas {
    this.generator = value.toLowerCase()
    return this
  }

  getGenerator() {
    return this.generator
  }

  setVisualizer(value: string): GraphCanvas {
    this.visualizer = value.toLowerCase()
    return this
  }

  getVisualizer() {
    return this.visualizer
  }

  setCurrentShape(value: string): GraphCanvas {
    value = value?.toLowerCase()
    this.shape = value
    return this
  }

  getCurrentShape() {
    return this.shape
  }

  setDirection(value: string) {
    this.direction = value
    return this
  }

  getDirection() {
    return this.direction
  }

  setStart(value: string) {
    this.start = value
    return this
  }

  getStart() {
    return this.start
  }

  toString() {
    return 'GraphCanvas'
  }

  getEdges() {
    return this._OBJECTS.filter(p => (p instanceof GraphEdge)) as GraphEdge[] // OK
  }

  addEdge(edge: GraphEdge) {
    this._OBJECTS.push(edge)
    return edge
  }

  removeEdge(edge: GraphEdge) {
    const edgeIndex = this._OBJECTS.findIndex(p => p === edge)
    this._OBJECTS.splice(edgeIndex, 1)
    return edgeIndex
  }

  insertEdge(afterThisIndex: number, newEdge: GraphEdge) {
    return this._OBJECTS.splice(afterThisIndex, 0, newEdge)
  }
};
