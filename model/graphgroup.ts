// @ts-check
import { GraphContainer } from '../model/graphcontainer.js'
import { type GraphConnectable } from './graphconnectable.js'
import { type DefaultSettingKey } from '../model/graphcontainer.js'

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
   * TODO: Drop close to GraphConditional(and perhaps GraphLoop)
   * Set to graphcanvas._nextConnectableToExitEndIf
   */
  _conditionalExitEdge?: GraphConnectable = undefined

  /**
   * Only used if this group(set) was created due if then/elseif/else construct
   *
   * TODO: Drop close to GraphConditional(and perhaps GraphLoop)
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
    this.fetchAndSetContainerDefaults([{ attrName: 'groupcolor' as DefaultSettingKey, callback: color => this.color = color }])
  }

  toString() {
    return `GraphGroup (${this.name})`
  }
};
