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
 * Set a visualizer, only if loaded neweb/uiComponentAccess.tsw content (storage, example)
 * it was just parsed AND it had a 'visualizer' directive
 */
export function setVisualizer(visualizer: string) {
  // Change the generator via UI
  const select: HTMLInputElement = document.querySelector('#diagrammer-generator') as HTMLInputElement
  if (visualizer) {
    // ok, we know EXACTLY what to select!
    select.value = visualizer
  }
  if (getSelectedVisualizer() !== visualizer) {
    console.error(`Somewhy visualizer change did not go thru, we wanted ${visualizer} and have ${getSelectedVisualizer()}`)
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
export function setError(text: string, exception?: any) {
  const element = document.getElementById('diagrammer-error') as HTMLElement
  if (text) {
    console.error(text)
    if (exception) {
      console.error(exception)
    }
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
