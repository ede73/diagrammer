import { getHTMLElement } from './uiComponentAccess.js';
import * as d3 from 'd3';
export function makeSVG(width = 800, height = 800) {
    d3.select('#the_SVG_ID').remove();
    const svgElement = d3.select('#diagrammer-graph').append('svg')
        .attr('id', 'the_SVG_ID')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');
    return svgElement.append('g');
}
export function removeOldVisualizations(idName) {
    const element = getHTMLElement('diagrammer-graph');
    if (element) {
        removeAllChildNodes(element);
    }
}
export function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}
