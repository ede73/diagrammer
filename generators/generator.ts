// @ts-check

import { type GraphCanvas } from '../model/graphcanvas.js'
import { output } from '../model/support.js'

/**
 * Generator is producer that takes Abstract Syntax Tree (AST) and produces output document
 * that will be consumed by a visualizer.
 *
 * A generator may have multiple visualizers (and it doesn't have to know which).
 * In turn a visualizer can only have one generator and it has to precisely know what it is.
 *
 * Visualizer (at the moment) can be command line only, web only or both (e.g. graphviz)
 *
 * Also there's absolutely no restrictions to what generator can produce, it could be
 * Domain Specific Language (like graphviz) or JSON document (popular with D3.js)
 */

export abstract class Generator {
  public name: string
  constructor(protected graphCanvas: GraphCanvas) {
    this.name = this.constructor.name.toLocaleLowerCase()
  }

  abstract generate(graphCanvas: GraphCanvas): void

  protected lout = (...args: any[]) => {
    const [textOrIndent, maybeIndent] = args
    output(this.graphCanvas, textOrIndent, maybeIndent)
  }
}
