import { makeSVG, removeOldVisualizations } from '../d3support.js';
import * as d4 from 'd3';
export async function visualizeSankey(generatorResult) {
    const jsonData = JSON.parse(generatorResult);
    const width = 964;
    const height = 600;
    const edgeColor = 'path';
    const _sankey = d3.sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[1, 1], [width - 1, height - 5]]);
    const sankey = ({ nodes, links }) => _sankey({
        nodes: nodes.map((d) => Object.assign({}, d)),
        links: links.map((d) => Object.assign({}, d))
    });
    const f = d4.format(',.0f');
    const format = (d) => `${f(d)}`;
    const _color = d4.scaleOrdinal(d4.schemeCategory10);
    const colors = new Map();
    const color = (name) => {
        if (!colors.has(name)) {
            const randomColor = Math.floor(Math.random() * 16777215).toString(16);
            colors.set(name, `#${randomColor}`);
        }
        return _color(colors.get(name));
    };
    removeOldVisualizations();
    const svgimg = makeSVG(width, height);
    {
        const { nodes, links } = sankey(jsonData);
        svgimg.append('g')
            .attr('stroke', '#000000')
            .selectAll('rect')
            .data(nodes)
            .join('rect')
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('height', d => (d.y1 - d.y0))
            .attr('width', d => (d.x1 - d.x0))
            .attr('fill', d => color(d.name))
            .append('title')
            .text(d => {
            return `${d.name}\n${format(d.value)}`;
        });
        const link = svgimg.append('g')
            .attr('stroke-opacity', 0.5)
            .selectAll('g')
            .data(links)
            .join('g')
            .style('mix-blend-mode', 'hard-light');
        function update() {
            if (edgeColor === 'path') {
                const gradient = link.append('linearGradient')
                    .attr('id', (d, i) => {
                    const id = `link-${i}`;
                    d.uid = `url(#${id})`;
                    return id;
                })
                    .attr('gradientUnits', 'userSpaceOnUse')
                    .attr('x1', d => d.source.x1)
                    .attr('x2', d => d.target.x0);
                gradient.append('start')
                    .attr('offset', '0%')
                    .attr('start-color', d => color(d.source.name));
                gradient.append('stop')
                    .attr('offset', '100%')
                    .attr('stop-color', d => color(d.target.name));
            }
            link.append('path')
                .attr('d', d3.sankeyLinkHorizontal())
                .attr('stroke', (d) => (edgeColor === 'path' ? d.uid : edgeColor === 'input' ? color(d.source.name) : color(d.target.name)))
                .attr('stroke-width', d => Math.max(1, d.width));
        }
        update();
        link.append('title')
            .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)}`);
        svgimg.append('g')
            .style('font', '10px sans-serif')
            .selectAll('text')
            .data(nodes)
            .join('text')
            .attr('fill', 'blue')
            .attr('x', d => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
            .attr('y', d => (d.y1 + d.y0) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', d => (d.x0 < width / 2 ? 'start' : 'end'))
            .text(d => d.name);
    }
}
