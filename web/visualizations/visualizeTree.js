import { getHTMLElement } from '../uiComponentAccess.js';
import { removeAllChildNodes } from '../d3support.js';

export async function visualizeTree(svgString) {
    const vizContainer = getHTMLElement('diagrammer-graph');
    if (!vizContainer) return;
    removeAllChildNodes(vizContainer);

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, 'image/svg+xml');
        const svg = doc.documentElement;
        if (svg && svg.nodeName.toLowerCase() === 'svg') {
            vizContainer.appendChild(svg);
        } else {
            vizContainer.innerHTML = svgString;
        }
    } catch (err) {
        console.error('Failed to render Tree/Dendrogram SVG:', err);
        vizContainer.innerHTML = svgString;
    }
}
