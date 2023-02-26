// @ts-check
import { errorMonitor } from 'events'
import { GraphContainer } from '../model/graphcontainer.js'
import { GraphConnectable } from './graphconnectable.js'

/**
 * Represents a container
 */
export class GraphGroup extends GraphContainer {
  isInnerGraph: boolean = false
  // === START Conditional construct support
  /**
   * Only with IF, first preceding vertex seen before "if"
   * Set directly in diagrammer.grammar
   */
  _conditionalEntryEdge?: GraphConnectable = undefined

  /**
   * Only with endif, first vertex(Connectable) seen after
   * TODO: Inconsistent: not a GraphConnectable
   *
   * Set to graphcanvas._nextConnectableToExitEndIf
   */
  _conditionalExitEdge?: GraphConnectable = undefined

  /**
   * Only used if this group(set) was created due if then/elseif/else construct
   */
  conditional?: string = undefined

  /**
   * a UNIQUE exitvertex within the graph.
   */
  exitvertex?: number = undefined

  constructor(name: string, parent: GraphContainer) {
    super(name, parent)
    if (!parent) {
      throw new Error('GraphGroup REQUIRES a parent container')
    }
  }

  toString() {
    return `GraphGroup (${this.name})`
  }
};
