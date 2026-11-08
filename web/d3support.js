import { getHTMLElement } from './uiComponentAccess.js';
import * as d3 from 'd3';
export function makeSVG(width = 800, height = 800) {
    d3.select('#the_SVG_ID').remove();
    const svgElement = d3.select('#diagrammer-graph').append('svg')
        .attr('id', 'the_SVG_ID')
        .attr('width', width)
        .attr('height', height);
    const zoom = d3.zoom()
        .on('zoom', (e) => {
        d3.select('svg g')
            .attr('transform', `translate(${(width * e.transform.k) / 2 + e.transform.x}, ${(height * e.transform.k) / 2 + e.transform.y}) scale(${e.transform.k})`);
    }).scaleExtent([1, 5]);
    d3.select('svg').call(zoom);
    return svgElement.append('g');
}
export function removeOldVisualizations(idName) {
    const element = getHTMLElement('diagrammer-graph');
    removeAllChildNodes(element);
    const newDiv = document.createElement('div');
    newDiv.setAttribute('id', idName || 'default_');
    element.appendChild(newDiv);
    return newDiv;
}
export function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}
