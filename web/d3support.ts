// @ts-check

import { getHTMLElement } from './uiComponentAccess.js'
import * as d3 from 'd3'

export function makeSVG(width?: number, height?: number) {
  if (!width) {
    width = 800
  }
  if (!height) {
    height = 800
  }
  d3.select('#the_SVG_ID').remove()
  const svgElement = d3.select('#diagrammer-graph').append('svg')
    .attr('id', 'the_SVG_ID')
    .attr('width', width)
    .attr('height', height)

  // https://www.d3indepth.com/zoom-and-pan/
  // https://www.upgradecrb.net/@d3/zoom-canvas-rescaled?_=%2F%40d3%2Fzoom-canvas-rescaled%232NMjB6UohcKJ%2FFYIA1uADNI3R35Qp1Dr
  const zoom = d3.zoom()
    .on('zoom', (e) => {
      console.log(e)
      // svgElement.attr('transform', 'translate(' + d3.event.translate[0] + ',' + d3.event.translate[1] + ') scale(' + d3.event.scale + ')')

      console.log(`translate(${e.transform.x}, ${e.transform.y}) scale(${e.transform.k})`)
      d3.select('svg g')
        //   .attr('transform', e.transform)
        // TODO: offload to caller, centering only works for radials (that we've translated 50% wid/height)
        .attr('transform', `translate(${(width * e.transform.k) / 2 + e.transform.x}, ${(height * e.transform.k) / 2 + e.transform.y}) scale(${e.transform.k})`)
    }).scaleExtent([1, 5]) // no inifinte scaling
  // .translateExtent([[0, 0], [width, height]]) TODO: doesnt seem to be working well with radial graphs

  d3.select('svg').call(zoom)
  return svgElement.append('g')
}

// TODO: Discrepancy between d3.js and GoJS, former results in #diagrammer-graph/(div#default_,svg) latter #graphVisualizerionHere/div#default_/svg
/**
 * Remove all old visualizations sitting under predefined element id (diagrammer-graph).
 *
 * Will create idName of default_ named under there, ie. final result
 * <div id='diagrammer-graph'><div id='${idName}|default_/></div>
 *
 * @param  [idName] If givem , will create such IDd div element under diagrammer-graph
 * @returns the inner div
 */
export function removeOldVisualizations(idName?: string) {
  const element = getHTMLElement('diagrammer-graph')
  removeAllChildNodes(element)
  const newDiv = document.createElement('div')
  newDiv.setAttribute('id', idName || 'default_')
  element.appendChild(newDiv)
  return newDiv
}

export function removeAllChildNodes(parent: HTMLElement) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild)
  }
}
