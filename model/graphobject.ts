// @ts-check

import { debug } from './debug.js'
import { GraphCanvas } from './graphcanvas.js'
import { GraphContainer, DefaultSettingKey } from './graphcontainer.js'

type DefaultAndCallback = { attrName: DefaultSettingKey, callback: (value: string) => void }
/**
 * GraphObject: Anything that is represented in a graph (diagram/visualization)
 */
export class GraphObject {
  /**
   * Every object in a graph have a name
   * That's how it can get linked.
   * "name" for display purposes may be a label instead
   */
  name?: string
  /**
   * If provided, this will be used as visual name
   */
  label?: string = undefined
  /**
   * Main color for this object
   */
  color?: string = undefined
  /**
   * Color for any text rendered for this object
   */
  textcolor?: string = undefined
  /**
   * External link (only works for dynamic visualizations like SVG)
   */
  url?: string = undefined
  parent: GraphObject

  /**
   * Name of the object. Exception being edges, they don't have names
   */
  constructor(name: string, parent?/*TODO:Ugh..ugly*/: any) {
    if (name) {
      this.name = name
    }
    // if (!parent && !(this instanceof GraphCanvas)) {
    //   //throw new Error("Only GraphCanvas is allowed to NOT have a prent, since it is the root")
    // }
    if (!parent && this.constructor.name !== 'GraphCanvas') {
      throw new Error(`All objects require a parent - EXCEPTION being canvas ${this.constructor.name}`)
    }
    this.parent = parent;
  }

  /**
   * Set the name for the object
   */
  setName(name: string) {
    // TODO: Something odd in the parser
    if (name) {
      this.name = name.trim()
    }
    return this
  }

  getName() {
    return this.name
  }

  /**
   * Set color
   */
  setColor(color: string) {
    //debug(`===Set color ${color} to ${this.getName()}`)
    // Grammar uses call chaining, and doesn't check so it may ..setColor(OptionalColotThatIsUndefinedIeLeftOut..)
    if (color) {
      this.color = color.trim()
    }
    return this
  }

  getColor() {
    return this.color
  }

  /**
   * Set text color
   */
  setTextColor(textColor: string) {
    this.textcolor = textColor.trim()
    return this
  }

  getTextColor() {
    return this.textcolor
  }

  /**
   * Set URL
   */
  setUrl(url: string) {
    this.url = url.trim()
    return this
  }

  getUrl() {
    return this.url
  }

  // Find canvas, it's the parent that has no parent
  protected getCanvas(container: GraphObject = this): GraphCanvas {
    if (!container.parent) {
      return container as GraphCanvas
    }
    return container.getCanvas(container.parent)
  }

  /**
   * Set label. Label is a complex object that will be parsed and parts of it
   * extracted to textColor and potentially URL
   */
  setLabel(label: string) {
    // Destructure all variables in the label
    for (const [variable, value] of Object.entries(this.getCanvas().VARIABLES)) {
      label = label.replace(new RegExp(`\\$\\(${variable}\\)`, 'g'), value)
    }

    // debug(`  setLabel(${label.trim()}) this=${this.getName()} cons=${this.constructor.name}`)
    if (label) {
      label = label.trim().replace(/"/gi, '')
      // Take out COLOR if present
      let m = label.match(/^(#[A-Fa-f0-9]{6,6})(.*)$/)
      if (m !== null && m.length >= 3) {
        this.setTextColor(m[1])
        if (m.length >= 2) {
          label = m[2].trim()
        }
      }
      // if label has an URL, remove that
      m = label.match(/^(.*)(?<url>\[[^\]]+\])(.*)$/)
      if (m !== null && m.length >= 3) {
        m[0] = ''
        this.setUrl(m[2].replace('[', '').replace(']', '').trim())
        label = m[1].trim()
        if (m.length > 3) {
          label += ' ' + m[3].trim()
        }
      }
      this.label = label.trim()
    }
    return this
  }

  getLabel() {
    return this.label
  }

  fetchAndSetContainerDefaults(setup: DefaultAndCallback[]) {
    if (this.parent) {
      setup.forEach(check => {
        this.getDefaultAttribute(this.parent as GraphContainer, check.attrName, check.callback)
      });
    }
  }

  /**
   * Get default attribute vertexcolor,edgecolor,groupcolor and bubble upwards if
   * otherwise 'unobtainable'
   *
   * @param graphCanvas
   * @param attrname Name of the default attribute. If not found, returns undefined
   * @param  [callback] Pass the attribute to the this function as only argument - if attribute WAS actually defined!
   */
  private getDefaultAttribute(container: GraphContainer,
    attrname: DefaultSettingKey,
    callback?: (defaultAttr: string) => void): string | undefined {

    let loops = 0
    while (container) {
      const value = container.getDefault(attrname);
      if (value && callback) {
        callback(value)
        return value
      }
      if (container.parent) {
        container = container.parent as GraphContainer
      } else {
        break;
      }
    }
  }


  toString() {
    return 'GraphObject'
  }
};
