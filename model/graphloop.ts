// @ts-check

import { type GraphCanvas } from './graphcanvas.js'
import { type GraphContainer } from './graphcontainer.js'
import { GraphGroup } from './graphgroup.js'

export class GraphLoop extends GraphGroup {
  private readonly canvas: GraphCanvas

  constructor(canvas: GraphCanvas, type: string, label: string, parent: GraphContainer) {
    // for IF, current container is correct, for any other part (right now), current contantainer
    // is obviously this GraphConditional (ie. previous statement), so we will use the parent
    // IN THE FUTURE, TODO: Make GraphConditional a NEW parent group for the WHOLE conditional section
    // is GraphConditional(If,elseif..else..endif)
    super(String(canvas.parsingContext.GROUPIDS++), parent)
    this.canvas = this.getCanvas();

    (parent).addObject(this)
    this.setLabel(label.trim().replace(/(^(end[ ]*while|until)\s)/g, '').trim())
    // TODO: right now, digraph generator assumes conditional means if/else.. neeed revamping
    // this.conditional = type

    this.canvas.parsingContext._enterContainer(this)
  }
};
