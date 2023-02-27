// @ts-check
import { GraphEdge } from '../model/graphedge.js'
import { GraphConnectable } from './graphconnectable.js'
import { GraphGroup } from './graphgroup.js'
import { GraphContainer } from './graphcontainer.js'

export const generators = new Map()
export const visualizations = new Map()

interface IParseError {
  (str: string, hash: string): void;
}

interface IResult {
  (generatedCodeLine: string): void;
}

interface IVariables {
  [name: string]: string
}

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
  parseError?: IParseError = undefined
  generator?: string = undefined
  visualizer?: string = undefined
  shape?: string = undefined
  direction?: string = undefined
  start?: string = undefined

  // parsing context
  /**
   * Current container stack.
   *
   * Everytime a group is created (in the context of parsing in process)
   * it is entered, last on in this array (top of the stack) is the current
   * One group is closed (in the context of parsing), it is popped (and it will never be entered again)
   * and we have next..and next until we're back at GraphCanvas
   * Can be GraphGroup or GraphInnerGroup
   */
  CURRENTCONTAINER: GraphContainer[] = []
  /**
   * TODO: rename
   * Used when processing conditional constructs (if/elseif/else)
   * Currently ONLY used in conditional last else block where
   * NEXT vertex seen will be stores as "else"s _conditionalExitEdge!
   */
  _nextConnectableToExitEndIf?: GraphGroup
  CONTAINER_EXIT: number = 1
  /**
   * Automated indexing for created subgraphs (nameless)
   */
  GRAPHINNER_INDEX: number = 1
  /**
   * Automated indexing for created groups (they can be nameless)
   */
  GROUPIDS: number = 1
  /**
   * Store all declared variables (and their values)
   */
  VARIABLES: IVariables = {}
  lastSeenVertex?: GraphConnectable

  constructor() {
    super('', undefined) // Canvas has no name
    this.CURRENTCONTAINER = [this]
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

  /**
   *
   * Usage: grammar/diagrammer.grammar
   *
   * Get current container
   */
  _getCurrentContainer() {
    return this.CURRENTCONTAINER[this.CURRENTCONTAINER.length - 1]
  }

  /**
   * Enter into a new container, set it as current container
   * TODO: move to GraphCanvas
   * Usage: grammar/diagrammer.grammar
   *
   * @param container Set this container as current container
   */
  _enterContainer(container: GraphContainer) {
    this.CURRENTCONTAINER.push(container)
    return container
  }

  /**
   * Exit the current container
   * Return the previous one
   * Previous one also set as current container
   *
   * Usage: grammar/diagrammer.grammar
   */
  _exitContainer() {
    if (this.CURRENTCONTAINER.length <= 1) { throw new Error('INTERNAL ERROR:Trying to exit ROOT container') }
    const currentContainer = this.CURRENTCONTAINER.pop()
    if (currentContainer instanceof GraphGroup) {
      // TODO: ???
      currentContainer.exitvertex = this.CONTAINER_EXIT++
    }
    // TODO: digraph (or graphviz rather) visualizing empty subgraph breaks, it needs a node (invisible for instance)
    // digraph generator imlpements this by injecting empty invis node for all empty groups.
    // While this works, it does edit the graph, which is bad..
    return currentContainer
  }

  getEdges() {
    return this._OBJECTS.filter(p => (p instanceof GraphEdge)) as GraphEdge[] // OK
  }

  addEdge(edge: GraphEdge) {
    this._OBJECTS.push(edge)
    return edge
  }

  removeEdge(edge: GraphEdge) {
    const edgeIndex = this._OBJECTS.findIndex(p => p === edge);
    this._OBJECTS.splice(edgeIndex, 1)
    return edgeIndex
  }

  insertEdge(afterThisIndex: number, newEdge: GraphEdge) {
    return this._OBJECTS.splice(afterThisIndex, 0, newEdge)
  }
};
