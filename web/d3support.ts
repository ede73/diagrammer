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
  return d3.select('#diagrammer-graph').append('svg')
    .attr('id', 'the_SVG_ID')
    .attr('width', width)
    .attr('height', height)
    .append('g')
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
