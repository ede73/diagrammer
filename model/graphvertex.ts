// @ts-check
import { GraphConnectable } from './graphconnectable.js'
import { GraphContainer } from './graphcontainer.js'
import { Shapes } from './shapes.js'

/**
 * Represents a Vertex in a visualization
 */
export class GraphVertex extends GraphConnectable {
  shape?: string
  image?: string = undefined
  style?: string = undefined

  /**
   * @param name Name of the vertex
   * @param [shape] Optional shape for the vertex, if not given, will default to what ever default is being used at the moment
   * @constructor
   */
  constructor(name: string, parent: GraphContainer, shape?: string) {
    super(name, parent)
    if (shape) {
      this._assertRegonizedShape(shape)
      this.shape = shape
    }
    if (!parent) {
      throw new Error('GraphVertex REQUIRES a parent container')
    }
  }

  _assertRegonizedShape(shape: string) {
    if (!Object.prototype.hasOwnProperty.call(Shapes, shape.toLowerCase())) {
      throw new Error(`Trying to set unrecognized shape ${shape}`)
    }
  }

  setShape(shape: string) {
    if (shape) {
      this._assertRegonizedShape(shape)
      this.shape = shape.toLowerCase()
    }
    return this
  }

  getShape() {
    return this.shape
  }

  /**
   * @param style  // TODO: Restrict
   */
  setStyle(style: string) {
    if (style) {
      this.style = style.toLowerCase()
    }
    return this
  }

  getStyle() {
    return this.style
  }

  setImage(image: string) {
    if (image) {
      this.image = image
    }
    return this
  }

  getImage() {
    return this.image
  }

  toString() {
    let fmt = ''
    if (this.color) { fmt += `, color: ${this.color}` }
    if (this.label) { fmt += `, label: ${this.label}` }
    return `GraphVertex (name:${this.getName()}${fmt})`
  }
};
