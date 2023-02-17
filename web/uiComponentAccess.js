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

export function openImage (imageUrl) {
  window.open(`${imageUrl}?x=${new Date().getTime()}`)
}

let win
export function openPicWindow () {
  win = window.open('web/result.png', 'extpic')
}

export function reloadImg (id) {
  const obj = getInputElement(id)
  let src = obj.src
  const pos = src.indexOf('?')
  if (pos >= 0) {
    src = src.substr(0, pos)
  }
  const date = new Date()
  obj.src = src + '?v=' + date.getTime()
  if (win) { win.location.reload() }
  return false
}

/**
 * Set image source (and reload the image)
 * Always updates 'image' ID'd image
 * @param {string} imageSource URI
 */
export function updateImage (imageSource) {
  if (!document.getElementById('image')) {
    console.log('OH NO...image component not found')
    return
  }
  document.getElementById('image').setAttribute('src', imageSource)
  reloadImg('image')
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
