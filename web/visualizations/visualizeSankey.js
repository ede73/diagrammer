import { makeSVG, removeOldVisualizations } from '../d3support.js';
import * as d4 from 'd3';

const SANKEY_PALETTE = [
    '#38bdf8', // Sky Blue
    '#818cf8', // Indigo
    '#34d399', // Emerald
    '#fbbf24', // Amber
    '#f472b6', // Pink
    '#a78bfa', // Purple
    '#2dd4bf', // Teal
    '#fb923c', // Orange
    '#60a5fa', // Blue
    '#e879f9', // Fuchsia
    '#4ade80', // Mint
    '#c084fc', // Violet
];

export async function visualizeSankey(generatorResult) {
    const jsonData = JSON.parse(generatorResult);
    const width = 964;
    const height = 600;

    const _sankey = d3.sankey()
        .nodeWidth(18)
        .nodePadding(14)
        .extent([[24, 24], [width - 24, height - 24]]);

    const sankey = ({ nodes, links }) => _sankey({
        nodes: nodes.map((d) => Object.assign({}, d)),
        links: links.map((d) => Object.assign({}, d))
    });

    const f = d4.format(',.0f');
    const format = (d) => `${f(d)}`;

    const colorMap = new Map();
    const color = (name) => {
        if (!colorMap.has(name)) {
            const idx = colorMap.size % SANKEY_PALETTE.length;
            colorMap.set(name, SANKEY_PALETTE[idx]);
        }
        return colorMap.get(name);
    };

    removeOldVisualizations();
    const svgimg = makeSVG(width, height);
    svgimg.attr('class', 'diagrammer-sankey-svg')
        .style('overflow', 'visible');

    const { nodes, links } = sankey(jsonData);

    // Defs for linear gradients
    const defs = svgimg.append('defs');
    links.forEach((d, i) => {
        const id = `sankey-gradient-${i}`;
        d.uid = `url(#${id})`;
        const gradient = defs.append('linearGradient')
            .attr('id', id)
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', d.source.x1)
            .attr('x2', d.target.x0);

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', color(d.source.name));

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', color(d.target.name));
    });

    // Links Layer
    const linkGroup = svgimg.append('g')
        .attr('class', 'sankey-links')
        .attr('fill', 'none');

    const link = linkGroup.selectAll('path')
        .data(links)
        .join('path')
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke', d => d.uid)
        .attr('stroke-width', d => Math.max(1.5, d.width))
        .attr('stroke-opacity', 0.45)
        .style('transition', 'stroke-opacity 0.2s ease')
        .on('mouseenter', function() {
            d4.select(this).attr('stroke-opacity', 0.85);
        })
        .on('mouseleave', function() {
            d4.select(this).attr('stroke-opacity', 0.45);
        });

    link.append('title')
        .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)}`);

    // Nodes Layer
    const nodeGroup = svgimg.append('g')
        .attr('class', 'sankey-nodes');

    const node = nodeGroup.selectAll('g')
        .data(nodes)
        .join('g')
        .attr('class', 'sankey-node');

    node.append('rect')
        .attr('x', d => d.x0)
        .attr('y', d => d.y0)
        .attr('height', d => Math.max(2, d.y1 - d.y0))
        .attr('width', d => d.x1 - d.x0)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('fill', d => color(d.name))
        .attr('stroke', 'rgba(255, 255, 255, 0.2)')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .append('title')
        .text(d => `${d.name.replace(/\\n/g, ' ')}\n${format(d.value)}`);

    // Labels Layer with dark-halo for readability
    const labelGroup = svgimg.append('g')
        .attr('class', 'sankey-labels');

    labelGroup.selectAll('text')
        .data(nodes)
        .join('text')
        .attr('fill', '#f1f5f9')
        .attr('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .style('paint-order', 'stroke fill')
        .attr('stroke', '#0f172a')
        .attr('stroke-width', '3.5px')
        .attr('stroke-linejoin', 'round')
        .attr('x', d => (d.x0 < width / 2 ? d.x1 + 8 : d.x0 - 8))
        .attr('y', d => (d.y1 + d.y0) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', d => (d.x0 < width / 2 ? 'start' : 'end'))
        .each(function(d) {
            const el = d4.select(this);
            const raw = d.name || '';
            const lines = raw.replace(/\\n/g, '\n').split('\n');
            if (lines.length === 1) {
                el.text(lines[0]);
            } else {
                el.text('');
                const isLeft = d.x0 < width / 2;
                lines.forEach((line, i) => {
                    el.append('tspan')
                        .attr('x', isLeft ? d.x1 + 8 : d.x0 - 8)
                        .attr('dy', i === 0 ? `-${(lines.length - 1) * 0.55}em` : '1.15em')
                        .text(line);
                });
            }
        });
}
