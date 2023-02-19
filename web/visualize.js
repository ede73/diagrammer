// @ts-check
import { removeAllChildNodes, removeOldVisualizations } from './d3support.js'
import { getHTMLElement, getInputElement, openImage, setError, updateImage } from './uiComponentAccess.js'
import { visualizations } from './globals.js'
import { makeHTTPPost } from './ajax.js'

function makeNewImageHolder (imageName) {
  const imgdiv = getHTMLElement('diagrammer-graph')
  const img = document.createElement('img')
  img.align = 'bottom'
  // using % here fails (even if it works directly in HTML)
  img.width = 400
  img.height = 400
  img.id = 'image'
  // auto adjusts
  img.style.height = 'auto'
  img.src = imageName
  img.onclick = () => openImage(`web/${imageName}`)
  imgdiv.appendChild(img)
}

function beautify (generatedCode) {
  let data
  try {
    data = JSON.parse(generatedCode)
  } catch (ex) {
    setError('Failed parsing generated code, perhaps not JSON?')
    return
  }
  // Get DOM-element for inserting json-tree
  const wrapper = document.getElementById('diagrammer-beautified')
  // @ts-ignore
  // eslint-disable-next-line no-undef, no-unused-vars
  const tree = jsonTree.create(data, wrapper)
}

export function clearBeautified () {
  const result = getInputElement('diagrammer-beautified')
  removeAllChildNodes(result)
}

// TODO: move to editor (or elsewhere, but this really isn't parser thingy anymore)
export function visualize (visualizer) {
  /** @type {HTMLInputElement} */
  const result = getInputElement('diagrammer-result')
  const generatedResult = result.value

  beautify(generatedResult)

  if (!visualizer) {
    throw new Error('Visualizer not defined')
  }
  const visualizeUrl = `web/visualize.php?visualizer=${visualizer}`
  removeOldVisualizations()
  makeHTTPPost(visualizeUrl, generatedResult,
    (image) => {
      makeNewImageHolder(image)
      updateImage(image)
    },
    (statusCode, statusText, responseText) => {
      alert(`Visualize failed, error: ${responseText} status: ${statusText}`)
    })

  /*
        <img align="bottom" id="image" width="30%" src="web/result.png"
            onclick="javascript:openImage('web/result.png');" />
    */

  if (visualizations.has(visualizer)) {
    // this is web only visualization
    console.log(`Visualize using ${visualizer}`)
    visualizations.get(visualizer)(result.value)
    console.log(`Finished visualizing ${visualizer}`)
  } else if (visualizer === 'dot') {
    // hack to get Viz display graphviz as comparison..
    try {
      // TODO: Bring back viz/canviz
      // @ts-ignore
      // eslint-disable-next-line no-undef
      getHTMLElement('viz_container').innerHTML = Viz(generatedResult, 'vin_container')
    } catch (err) {
      console.error(err)
    }
    // try{
    // const canviz = new Canviz('canviz_container');
    // canviz.load("http://192.168.11.215/~ede/state/post.txt");
    // }catch(err){
    // console.log(err);
    // }
    // TODO: Use visualizations/generators maps
  }
}
