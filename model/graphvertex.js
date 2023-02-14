// @ts-check
import { GraphConnectable } from './graphconnectable.js'
import { Shapes } from './shapes.js'

/**
 * Represents a Vertex in a visualization
 *
 * @param name Name of the vertex
 * @param [shape] Optional shape for the vertex, if not give, will default to what ever default is being used at the moment
 * @constructor
 */
export class GraphVertex extends GraphConnectable {
  /**
     *
     * @param {string} name
     * @param {string} shape
     */
  constructor (name, shape) {
    super(name)
    if (shape) {
      this._assertRegonizedShape(shape)
    }
    /** @type {string} */
    this.shape = shape
    /** @type {string} */
    this.image = undefined
    /** @type {string} */
    this.style = undefined
  }

  _assertRegonizedShape (shape) {
    if (!Object.prototype.hasOwnProperty.call(Shapes, shape.toLowerCase())) {
      throw new Error(`Trying to set unrecognized shape ${shape}`)
    }
  }

  /**
     * @param {string} shape
     * @returns {GraphVertex}
     */
  setShape (shape) {
    if (shape) {
      this._assertRegonizedShape(shape)
      this.shape = shape.toLowerCase()
    }
    return this
  }

  getShape () {
    return this.shape
  }

  /**
     * @param {string} style  // TODO: Restrict
     * @returns {GraphVertex}
     */
  setStyle (style) {
    if (style) {
      this.style = style.toLowerCase()
    }
    return this
  }

  getStyle () {
    return this.style
  }

  /**
     * @param {string} image
     * @returns {GraphVertex}
     */
  setImage (image) {
    if (image) {
      this.image = image
    }
    return this
  }

  getImage () {
    return this.image
  }

  toString () {
    let fmt = ''
    if (this.color) { fmt += `,color: ${this.color}` }
    if (this.label) { fmt += `,label: ${this.label}` }
    return `Vertex(name:${this.getName()}${fmt})`
  }
};
