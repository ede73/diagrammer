// @ts-check

// Various modules operate on UI
// Provide type safe access here

export function getHTMLElement (name) {
  // @ts-ignore
  const element = document.getElementById(name)
  if (!element) {
    console.log(`Trying to load HTML Element named ${name} but one isn't found!`)
  }
  return element
}

/**
 * Set a generator, only if loaded new content (storage, example)
 * it was just parsed AND it had a 'generator' directive
 * @param {string} generator
 */
export function setGenerator (generator, visualizer = undefined) {
  const genViz = generator + (visualizer ? ':' + visualizer : '')
  console.log(`setGenerator(${generator}:${visualizer}) ie. '${genViz}'`)
  // Change the generator via UI
  /** @type {HTMLInputElement} */
  const select = document.querySelector('#diagrammer-generator')
  select.value = genViz
  if (getGenerator() !== generator) {
    console.error(`Somewhy generator change did not go thru, we wanted ${generator} and have ${getGenerator()}`)
  }
  if (visualizer) {
    if (getVisualizer() !== visualizer) {
      console.error(`Somewhy visualizer change did not go thru, we wanted ${visualizer} and have ${getVisualizer()}`)
    }
  }
  console.log(` final result is generator=${getGenerator()} visualizer=${getVisualizer()}`)
}

/**
 * getElementById returns HTMLElement, but depending on actual type
 * it may have other interfaces available, e.g. HTMLInputElement
 * Which contains .value where as the HTMLElement doesn't
 * This is just to keep typescript happy
 * @param {string} name
 * @returns  {HTMLInputElement}
 */
export function getInputElement (name) {
  // @ts-ignore
  return getHTMLElement(name)
}

/**
 * @param {string} name
 * @returns {HTMLSelectElement}
 */
export function getSelectElement (name) {
  // @ts-ignore
  return getHTMLElement(name)
}

export function getCurrentFilename () {
  return getInputElement('diagrammer-filename').value
}

/**
 * Set error on UI
 * @param {string} text
 */
export function setError (text) {
  document.getElementById('diagrammer-error').innerText = text
}

/**
 * @returns {string} Return parse error(if any)
 */
export function getError () {
  return document.getElementById('diagrammer-error').innerText
}

export function openImage (imageBase64) {
  // window.open(`<img src="data:image/png;base64,${imageBase64}"/>`)
  const w = window.open('about:blank')

  // FireFox seems to require a setTimeout for this to work.
  setTimeout(() => {
    w.document.body.appendChild(w.document.createElement('iframe')).src = `data:image/png;base64,${imageBase64}`
    w.document.body.style.margin = '0'
    w.document.getElementsByTagName('iframe')[0].style.width = '100%'
    w.document.getElementsByTagName('iframe')[0].style.height = '100%'
    w.document.getElementsByTagName('iframe')[0].style.border = '0'
  }, 0)
}

let win
export function openPicWindow () {
  // TODO:
  win = window.open('web/result.png', 'extpic')
}

// Get currently selected generator
export function getGenerator () {
  const e = getSelectElement('diagrammer-generator')
  const gen = e.options[e.selectedIndex].value
  if (gen.indexOf(':') > -1) {
    return gen.split(':')[0]
  }
  return gen
}

export function getVisualizer () {
  const e = getSelectElement('diagrammer-generator')
  const gen = e.options[e.selectedIndex].value
  if (gen.indexOf(':') > -1) {
    return gen.split(':')[1]
  }
  return gen
}
