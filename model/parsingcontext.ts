// @ts-check
import { type GraphCanvas } from './graphcanvas.js'
import { type GraphContainer } from './graphcontainer.js'
import { GraphGroup } from './graphgroup.js'
import { type GraphConnectable } from './graphconnectable.js'

type IVariables = Record<string, string>

/**
 * This class is only using during parsing phase
 */
export class ParsingContext {
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
  CONTAINER_EXIT: number = 1
  /**
   * TODO: rename
   * Used when processing conditional constructs (if/elseif/else)
   * Currently ONLY used in conditional last else block where
   * NEXT vertex seen will be stores as "else"s _conditionalExitEdge!
   */
  _nextConnectableToExitEndIf?: GraphGroup

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

  constructor(canvas: GraphCanvas) {
    this.CURRENTCONTAINER = [canvas]
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
};
