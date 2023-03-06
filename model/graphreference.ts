// @ts-check
import { GraphConnectable } from './graphconnectable.js'
import { Shapes } from './shapes.js'

/**
 * Represent a hidden placeholder to keep the language precise
 *
 * Imagine graph like: A-B {B}, or A-B {B C}
 * In current(previous) implementation this generates 2 vertices A, B, in to 'canvas' directly. It makes a group as well, but group is actually empty
 * Or in latter case, group only contains vertex C
 *
 * While this works for *ALL* the graph generators and their visualizers as well, it's not precise representation of the graph described in diagrammer language
 *
 * The B vertex indeed is 'silent' and graphing engines will draw it outside the group, as THAT is exactly where it was declared.
 * And in a way, the graph presented could even be considered INCORRECT if B is contained in the group AND outside the group.
 * It violates the concept where node is declared vs. referred
 *
 * How ever, there's need for this in network graph (nwdiag), it explicitly required B to be declared IN the network as well, else
 * the resulting graph will be drawn differently.
 *
 * Ie. A-B {B} should produce A--B network 1 {B} graph, but since B is never recoreded being referred in the group(network), this cannot be done
 *
 * So this wrapper comes to help, it will only refer GraphConnectables by their name, and CAN be contained in a group
 *
 * Since all generators operate on model traversal functions, we can easily skip over these (except allow nwdiag see the references)
 *
 * Hierarchy-wise this could be GraphObject, but since ALL contained objects are to be GraphConnectables, so will be this
 */
export class GraphReference extends GraphConnectable {
    shape?: string
    image?: string = undefined

    // TODO: combine with GraphVertex and move up a notch, or to a trait/mixin
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

    setImage(image: string) {
        if (image) {
            this.image = image
        }
        return this
    }

    getImage() {
        return this.image
    }

    _assertRegonizedShape(shape: string) {
        if (!Object.prototype.hasOwnProperty.call(Shapes, shape.toLowerCase())) {
            throw new Error(`Trying to set unrecognized shape ${shape}`)
        }
    }

};
