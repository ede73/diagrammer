// @ts-check
import { removeAllChildNodes, removeOldVisualizations } from './d3support.js'
import { getHTMLElement, getInputElement, openImage } from './uiComponentAccess.js'
import { visualizations } from './globals.js'
import { makeHTTPPost } from './ajax.js'

function _makeNewImageHolder(pngBase64: string) {
  const imgdiv = getHTMLElement('diagrammer-graph')
  const img = document.createElement('img')
  img.align = 'bottom'
  // using % here fails (even if it works directly in HTML)
  img.width = 400
  img.height = 400
  img.id = 'image'
  // auto adjusts
  img.style.height = 'auto'
  img.src = `data:image/png;base64,${pngBase64}`
  img.onclick = () => openImage(`${pngBase64}`)
  imgdiv.appendChild(img)
}

function beautify(generatedCode: string) {
  let data
  try {
    data = JSON.parse(generatedCode)
  } catch (ex) {
    // too aggressive for the use... many generated code not actually JSON
    console.log('Failed parsing generated code, perhaps not JSON(digraph etc)?')
    return
  }
  // Get DOM-element for inserting json-tree
  const wrapper = document.getElementById('diagrammer-beautified')
  // @ts-ignore
  // eslint-disable-next-line no-undef, no-unused-vars
  const tree = jsonTree.create(data, wrapper)
}

export function clearBeautified() {
  const result = getInputElement('diagrammer-beautified')
  removeAllChildNodes(result)
}

// TODO: move to editor (or elsewhere, but this really isn't parser thingy anymore)
export async function visualize(visualizer: string) {
  const result = getInputElement('diagrammer-result')
  const generatedResult = result.value

  beautify(generatedResult)

  if (!visualizer) {
    throw new Error('Visualizer not defined')
  }
  removeOldVisualizations()

  // TODO: let generator decide visualizer
  if (visualizer === 'ast_record') {
    visualizer = 'dot'
  }

  if (visualizations.has(visualizer)) {
    // this is web only visualization
    console.log(`Visualize using ${visualizer}`)
    visualizations.get(visualizer)(generatedResult)
    console.log(`Finished visualizing ${visualizer}`)
  } else {
    // backend visualizer (unless if we want use Viz)
    const visualizeUrl = `web/visualize.php?visualizer=${visualizer}`
    makeHTTPPost(visualizeUrl, generatedResult,
      (pngBase64) => {
        _makeNewImageHolder(pngBase64)
      },
      (statusCode, statusText, responseText) => {
        alert(`Visualize failed, error: ${responseText} status: ${statusText}`)
      })
  }
}
