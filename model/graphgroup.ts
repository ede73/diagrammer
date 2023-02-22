// @ts-check
import { setAttr, getAttribute, debug } from '../model/support.js'
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
  _conditionalEntryEdge: GraphConnectable = undefined

  /**
   * Only with endif, first vertex(Connectable) seen after
   * TODO: Inconsistent: not a GraphConnectable
   *
   * Set to graphcanvas._nextConnectableToExitEndIf
   */
  _conditionalExitEdge: GraphConnectable = undefined

  /**
   * Only used if this group(set) was created due if then/elseif/else construct
   */
  conditional: string = undefined

  /**
   * a UNIQUE exitvertex within the graph.
   */
  exitvertex: number = undefined

  constructor(name: string) {
    super(name)
  }

  /**
   * Set default vertexcolor, groupcolor, edgecolor Always ask from the
   * currentContainer first
   */
  setDefault(key: string, value: any) {
    if (this.ALLOWED_DEFAULTS.indexOf(key.toLowerCase()) === -1) {
      throw new Error(`Trying to set unknown default ${key}`)
    }
    return setAttr(this, key, value)
  }

  getDefault(key: string) {
    debug(`group:Get group ${key}`)
    return getAttribute(this, key)
  }

  toString() {
    return `group:Group(${this.name})`
  }
};
