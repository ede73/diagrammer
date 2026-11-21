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

    // Use generous canvas so large taxonomy trees have room
    const width = 1100;
    const height = 1100;
    const svgimg = makeSVG(width, height);
    svgimg.attr('class', 'diagrammer-reingold-tilford-svg')
        .style('overflow', 'visible');

    // Center in the viewport
    svgimg.attr('transform', `translate(${width / 2},${height / 2})`);

    // Radius must fit within the half-width minus label padding
    const radius = Math.min(width, height) / 2 - 140;

    const tree = d3.tree()
        .size([2 * Math.PI, radius])
        .separation((a, b) => {
            return (a.parent === b.parent ? 1 : 2) / (a.depth || 1);
        });

    const data = d3.hierarchy(jsonData);
    const treeData = tree(data);
    const links = treeData.links();
    const nodes = treeData.descendants();

    const getRadial = (d) => d.y;

    // Helper for dark-mode adapted color
    const resolveColor = (colorStr, fallback = '#f1f5f9', isFg = true) => {
        if (!colorStr || colorStr === 'inherit' || colorStr === 'none') return fallback;
        try {
            return adaptColorForDark(colorStr, isFg);
        } catch (_) {
            return colorStr;
        }
    };

    // Render radial tree links
    svgimg.selectAll('.link')
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
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', d => (d.source.depth === 0 ? 1.8 : 1.2))
        .attr('d', d3.linkRadial()
            .angle(d => d.x)
            .radius(d => getRadial(d))
        );

    // Render tree nodes
    const node = svgimg.selectAll('g.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${getRadial(d)})`);

    // Node bullet / circle
    node.append('circle')
        .attr('r', d => (d.children ? 4 : 3))
        .attr('fill', d => {
            if (d.data.nodecolor) {
                return resolveColor(d.data.nodecolor, '#38bdf8', false);
            }
            return d.children ? '#818cf8' : '#38bdf8';
        })
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 1.2);

    // Text labels oriented along spokes with dark halo
    const textGroup = node.append('text')
        .attr('dy', '0.31em')
        .attr('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
        .attr('font-size', '10.5px')
        .attr('font-weight', d => (d.children ? '700' : '500'))
        .style('paint-order', 'stroke fill')
        .attr('stroke', '#0f172a')
        .attr('stroke-width', '3px')
        .attr('stroke-linejoin', 'round')
        .attr('text-anchor', d => (d.x < Math.PI ? 'start' : 'end'))
        .attr('transform', d => (d.x < Math.PI ? 'translate(7)' : 'rotate(180) translate(-7)'))
        .attr('fill', d => {
            if (d.data.nodecolor) {
                return resolveColor(d.data.nodecolor, '#f1f5f9', true);
            }
            return d.children ? '#e2e8f0' : '#cbd5e1';
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
