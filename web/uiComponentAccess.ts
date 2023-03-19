// @ts-check

import { findGeneratorForVisualization, visualizations } from '../js/config.js'

// Various modules operate on UI
// Provide type safe access here

export function getHTMLElement(name: string) {
  const element = document.getElementById(name) as HTMLElement
  if (!element) {
    console.error(`Trying to load HTML Element named ${name} but one isn't found!`)
  }
  return element
}

/**
 * Set a generator, only if loaded neweb/uiComponentAccess.tsw content (storage, example)
 * it was just parsed AND it had a 'generator' directive
 */
export function setGenerator(generator: string, visualizer?: string) {
  console.warn('TODO: Stop using setGenerator, it makes no sense on visualizing WEB UI, just use visualizer (ast maybe exception)')
  // Change the generator via UI
  const select: HTMLInputElement = document.querySelector('#diagrammer-generator') as HTMLInputElement
  if (visualizer) {
    // ok, we know EXACTLY what to select!
    select.value = visualizer
  } else {
    console.warn('TODO: Remove the use of generator from WEB UI, it makes no sense (mostly, ast maybe only exception). We visualize, and that determines the generator')
    // ok, we're given a generator, but no visualizer, so we pick the first one
    const firstMatchingViz = visualizations.find(p => p.generator.name.toLocaleLowerCase() === generator.toLocaleLowerCase().replace('_', ''))
    if (!firstMatchingViz) {
      throw Error(`Cannot find visualization for generator (${generator})`)
    }
    select.value = firstMatchingViz.name
  }
  if (getSelectedGenerator() !== generator.toLocaleLowerCase().replace('_', '')) {
    console.error(`Somewhy generator change did not go thru, we wanted ${generator} and have ${getSelectedGenerator()}`)
  }
  if (visualizer) {
    if (getSelectedVisualizer() !== visualizer) {
      console.error(`Somewhy visualizer change did not go thru, we wanted ${visualizer} and have ${getSelectedVisualizer()}`)
    }
  }
}

/**
 * getElementById returns HTMLElement, but depending on actual type
 * it may have other interfaces available, e.g. HTMLInputElement
 * Which contains .value where as the HTMLElement doesn't
 * This is just to keep typescript happy
 */
export function getInputElement(name: string) {
  return getHTMLElement(name) as HTMLInputElement
}

export function getSelectElement(name: string) {
  return getHTMLElement(name) as HTMLSelectElement
}

export function getCurrentFilename() {
  return getInputElement('diagrammer-filename').value
}

/**
 * Set error on UI
 */
export function setError(text: string) {
  const element = document.getElementById('diagrammer-error') as HTMLElement
  if (text) {
    console.error(text)
  }
  element.innerText = text
}

/**
 * @returns Return parse error(if any)
 */
export function getError() {
  return document.getElementById('diagrammer-error')?.innerText ?? ''
}

export function openImage(imageBase64: string) {
  // window.open(`<img src="data:image/png;base64,${imageBase64}"/>`)
  const w = window.open('about:blank')
  if (!w) return
  // FireFox seems to require a setTimeout for this to work.
  setTimeout(() => {
    w.document.body.appendChild(w.document.createElement('iframe')).src = `data:image/png;base64,${imageBase64}`
    w.document.body.style.margin = '0'
    w.document.getElementsByTagName('iframe')[0].style.width = '100%'
    w.document.getElementsByTagName('iframe')[0].style.height = '100%'
    w.document.getElementsByTagName('iframe')[0].style.border = '0'
  }, 0)
}

export function openPicWindow() {
  window.open('web/result.png', 'extpic') as Window
}

// Get currently selected generator
export function getSelectedGenerator() {
  const e = getSelectElement('diagrammer-generator')
  const viz = e.options[e.selectedIndex].value
  return findGeneratorForVisualization(viz)
}

export function getSelectedVisualizer() {
  const e = getSelectElement('diagrammer-generator')
  const gen = e.options[e.selectedIndex].value
  if (gen.includes(':')) {
    return gen.split(':')[1]
  }
  return gen
}
