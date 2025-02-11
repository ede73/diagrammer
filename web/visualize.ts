// @ts-check
import { removeAllChildNodes, removeOldVisualizations } from './d3support.js'
import { getHTMLElement, getInputElement, openImage } from './uiComponentAccess.js'
import { visualizations } from '../js/config.js'
import { makeHTTPPost } from './ajax.js'

function _makeNewImageHolder(pngBase64: string) {
  const img = document.createElement('img')
  img.align = 'bottom'
  // using % here fails (even if it works directly in HTML)
  img.width = 400
  img.height = 400
  img.id = 'image'
  // auto adjusts
  img.style.height = 'auto'
  img.src = `data:image/png;base64,${pngBase64}`
  img.onclick = () => { openImage(`${pngBase64}`) }
  getHTMLElement('diagrammer-graph')?.appendChild(img)
}

function beautifyJSON(generatedCode: string) {
  let data
  try {
    data = JSON.parse(generatedCode)
  } catch (ex) {
    // too aggressive for the use... many generated code not actually JSON
    console.debug('Failed beautifying generated code JSON(perhaps digraph etc?)', ex)
    return
  }
  // Get DOM-element for inserting json-tree
  const wrapper = document.getElementById('diagrammer-beautified') as HTMLElement
  // @ts-expect-error TODO: typing
  jsonTree.create(data, wrapper)
}

export function clearBeautified() {
  const result = getInputElement('diagrammer-beautified')
  removeAllChildNodes(result)
}

// TODO: move to editor (or elsewhere, but this really isn't parser thingy anymore)
export function visualize(visualizer: string) {
  const result = getInputElement('diagrammer-result')
  const generatedResult = result.value

  // try, just in case, we've JSON, to beautify it
  beautifyJSON(generatedResult)

  if (!visualizer) {
    throw new Error('Visualizer not defined')
  }
  removeOldVisualizations()

  const vizClass = visualizations.find(p => p.name === visualizer)
  if (!vizClass) {
    console.error(`O-o, could not find visualizer ${visualizer}`)
    return
  }
  if (vizClass.visualization) {
    // this is web only visualization
    vizClass.visualization(generatedResult).catch(rej => { })
  } else {
    // backend visualizer (unless if we want use Viz)
    const visualizeUrl = `/visualize?visualizer=${visualizer}`
    makeHTTPPost(visualizeUrl, generatedResult,
      (pngBase64) => {
        _makeNewImageHolder(pngBase64)
      },
      (statusCode, statusText, responseText) => {
        alert(`Visualize failed, error: ${responseText} status: ${statusText}`)
      })
  }
}
