// @ts-check

import { type GraphCanvas } from './graphcanvas.js'
import { type GraphContainer } from './graphcontainer.js'
import { GraphGroup } from './graphgroup.js'

export class GraphConditional extends GraphGroup {
  private readonly canvas: GraphCanvas

  constructor(canvas: GraphCanvas, type: string, label: string, parent: GraphContainer) {
    // for IF, current container is correct, for any other part (right now), current contantainer
    // is obviously this GraphConditional (ie. previous statement), so we will use the parent
    // IN THE FUTURE, TODO: Make GraphConditional a NEW parent group for the WHOLE conditional section
    // is GraphConditional(If,elseif..else..endif)
    super(String(canvas.parsingContext.GROUPIDS++), (type === 'if' ? parent : parent.parent) as GraphContainer)
    this.canvas = this.getCanvas()

    if (type === 'if') {
      this._conditionalEntryEdge = this.canvas.parsingContext.lastSeenVertex
    } else {
      this.canvas.parsingContext._exitContainer()
    }
    (this.parent as GraphContainer).addObject(this)
    this.setLabel(label.trim().replace(/(^(if|elseif|endif)\s*|(\s*then$))/g, '').trim())
    this.conditional = type
    this.canvas.parsingContext._enterContainer(this)

    if (type === 'endif') {
      this.canvas.parsingContext._nextConnectableToExitEndIf = this
      // TODO: currently no 'label/info' on endif..
      this.label = 'endif'
      this.canvas.parsingContext._exitContainer()
      // TODO: Make invisble pseudo exit node...?? This would work for graphviz, but...
      if (this.canvas.parsingContext._getCurrentContainer() instanceof GraphConditional) {
        throw new Error('effinf puffin2')
      }
    }
  }
};
