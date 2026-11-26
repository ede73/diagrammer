import * as d3 from 'd3';
import { makeSVG, removeOldVisualizations } from '../d3support.js';
import { adaptColorForDark } from '../perceptualTheme.js';

export async function visualizeReingoldTilford(generatorResult) {
    let jsonData;
    try {
        jsonData = JSON.parse(generatorResult);
    } catch (e) {
        console.error('Failed to parse Reingold-Tilford JSON data:', e, generatorResult);
        return;
    }

    removeOldVisualizations();

    const data = d3.hierarchy(jsonData);
    const leaves = data.leaves();
    const leafCount = Math.max(1, leaves.length);
    const maxDepth = Math.max(1, data.height);

    // Dynamic horizontal tidy tree spacing:
    // dx = vertical distance between adjacent sibling nodes (18-24px)
    // dy = horizontal distance between hierarchy levels (140-200px based on depth)
    const dx = 22;
    const dy = 170;

    const tree = d3.tree()
        .nodeSize([dx, dy])
        .separation((a, b) => (a.parent === b.parent ? 1.0 : 1.3));

    const treeData = tree(data);
    const links = treeData.links();
    const nodes = treeData.descendants();

    // Compute bounding box across all nodes
    let minX = Infinity;
    let maxX = -Infinity;
    nodes.forEach(d => {
        if (d.x < minX) minX = d.x;
        if (d.x > maxX) maxX = d.x;
    });

    const contentHeight = (maxX - minX) + dx * 4;
    const contentWidth = (maxDepth + 1) * dy + 320;
    const paddingLeft = 100;
    const paddingTop = -minX + dx * 2;

    const svgimg = makeSVG(contentWidth, contentHeight);
    svgimg.attr('class', 'diagrammer-reingold-tilford-svg')
        .style('overflow', 'visible');

    const svgElement = svgimg.node() ? (svgimg.node().ownerSVGElement || svgimg.node().parentElement) : null;
    if (svgElement && svgElement.setAttribute) {
        svgElement.setAttribute('viewBox', `0 0 ${contentWidth} ${contentHeight}`);
    }

    const g = svgimg.append('g')
        .attr('transform', `translate(${paddingLeft}, ${paddingTop})`);

    // Helper for dark-mode adapted color
    const resolveColor = (colorStr, fallback = '#f1f5f9', isFg = true) => {
        if (!colorStr || colorStr === 'inherit' || colorStr === 'none') return fallback;
        try {
            return adaptColorForDark(colorStr, isFg);
        } catch (_) {
            return colorStr;
        }
    };

    // Render smooth horizontal cubic bezier links (Reingold-Tilford Tidy Tree)
    g.selectAll('.link')
        .data(links)
        .join('path')
        .attr('class', 'link')
        .attr('fill', 'none')
        .attr('stroke', d => {
            const edgeColor = d.source.data.edgecolor || d.target.data.edgecolor;
            if (edgeColor) {
                return resolveColor(edgeColor, '#64748b', true);
            }
            return '#334155';
        })
        .attr('stroke-opacity', 0.65)
        .attr('stroke-width', d => (d.source.depth === 0 ? 2.0 : 1.3))
        .attr('d', d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x)
        );

    // Render tree nodes
    const node = g.selectAll('g.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`);

    // Node bullet / circle
    node.append('circle')
        .attr('r', d => (d.children ? 4.5 : 3.5))
        .attr('fill', d => {
            if (d.data.nodecolor) {
                return resolveColor(d.data.nodecolor, '#38bdf8', false);
            }
            return d.children ? '#818cf8' : '#38bdf8';
        })
        .attr('stroke', '#090d16')
        .attr('stroke-width', 1.3);

    // Text labels placed cleanly:
    // - Internal nodes: label sits to the LEFT of the fork (end-aligned)
    // - Leaf nodes: label sits to the RIGHT of the leaf bullet (start-aligned)
    // No rotation, perfectly legible horizontal text without overlap!
    const textGroup = node.append('text')
        .attr('dy', '0.32em')
        .attr('x', d => (d.children ? -8 : 8))
        .attr('text-anchor', d => (d.children ? 'end' : 'start'))
        .attr('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
        .attr('font-size', '11px')
        .attr('font-weight', d => (d.children ? '600' : '400'))
        .style('paint-order', 'stroke fill')
        .attr('stroke', '#090d16')
        .attr('stroke-width', '2.5px')
        .attr('stroke-linejoin', 'round')
        .attr('fill', d => {
            if (d.data.nodecolor) {
                return resolveColor(d.data.nodecolor, '#f1f5f9', true);
            }
            return d.children ? '#94a3b8' : '#f8fafc';
        });

    // Handle clickable hyperlinks (::url syntax)
    textGroup.each(function(d) {
        const el = d3.select(this);
        const label = d.data.nodelabel || d.data.name || '';
        let displayText = label;
        let url = '';

        if (label.includes('::')) {
            const parts = label.split('::');
            displayText = parts[0] || parts[1];
            url = parts[1];
        }

        if (url) {
            el.append('a')
                .attr('href', url)
                .attr('target', '_blank')
                .attr('fill', 'inherit')
                .style('text-decoration', 'none')
                .text(displayText);
        } else {
            el.text(displayText);
        }
    });

    if (typeof window !== 'undefined' && window.fitGraph) {
        requestAnimationFrame(() => {
            window.fitGraph();
        });
    }
}
