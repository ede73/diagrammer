import * as d3 from 'd3';
import { makeSVG, removeOldVisualizations } from '../d3support.js';
import { adaptColorForDark } from '../perceptualTheme.js';

export async function visualizeRadialDendrogram(generatorResult) {
    let jsonData;
    try {
        jsonData = JSON.parse(generatorResult);
    } catch (e) {
        console.error('Failed to parse Radial Dendrogram JSON data:', e, generatorResult);
        return;
    }

    removeOldVisualizations();

    const data = d3.hierarchy(jsonData);
    const leaves = data.leaves();
    const leafCount = Math.max(1, leaves.length);
    const maxDepth = Math.max(1, data.height);

    // Dynamic radius: give each leaf at least 15px of arc space
    const minLeafArc = 15;
    const computedRadius = Math.max(460, (leafCount * minLeafArc) / (2 * Math.PI) + maxDepth * 30);
    const width = (computedRadius + 220) * 2;
    const height = width;

    const svgimg = makeSVG(width, height);
    svgimg.attr('class', 'diagrammer-radial-dendrogram-svg')
        .style('overflow', 'visible');

    svgimg.attr('transform', `translate(${width / 2},${height / 2})`);

    const radius = computedRadius;

    const cluster = d3.cluster()
        .size([2 * Math.PI, radius])
        .separation((a, b) => {
            return (a.parent === b.parent ? 1 : 2) / (a.depth || 1);
        });

    const clusterData = cluster(data);
    const links = clusterData.links();
    const nodes = clusterData.descendants();

    const getRadial = (d) => d.y;

    const resolveColor = (colorStr, fallback = '#f1f5f9', isFg = true) => {
        if (!colorStr || colorStr === 'inherit' || colorStr === 'none') return fallback;
        try {
            return adaptColorForDark(colorStr, isFg);
        } catch (_) {
            return colorStr;
        }
    };

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

    const node = svgimg.selectAll('g.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${getRadial(d)})`);

    node.append('circle')
        .attr('r', d => (d.children ? 4 : 3))
        .attr('fill', d => {
            if (d.data.nodecolor) {
                return resolveColor(d.data.nodecolor, '#38bdf8', false);
            }
            return d.children ? '#818cf8' : '#38bdf8';
        })
        .attr('stroke', '#090d16')
        .attr('stroke-width', 1.2);

    // In dense radial trees, suppress internal node labels for deep levels (depth > 2)
    // to prevent radial starburst collisions. Leaf nodes always render outward.
    const isDenseTree = nodes.length > 50;
    const visibleTextNodes = node.filter(d => !isDenseTree || !d.children || d.depth <= 2);

    const textGroup = visibleTextNodes.append('text')
        .attr('dy', '0.31em')
        .attr('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
        .attr('font-size', isDenseTree ? '9px' : '10px')
        .attr('font-weight', d => (d.children ? '600' : '400'))
        .style('paint-order', 'stroke fill')
        .attr('stroke', '#090d16')
        .attr('stroke-width', '2px')
        .attr('stroke-linejoin', 'round')
        .attr('text-anchor', d => {
            // Leaf: outward. Internal: inward
            const isOutward = !d.children;
            if (isOutward) {
                return d.x < Math.PI ? 'start' : 'end';
            } else {
                return d.x < Math.PI ? 'end' : 'start';
            }
        })
        .attr('transform', d => {
            const isOutward = !d.children;
            if (isOutward) {
                return d.x < Math.PI ? 'translate(6)' : 'rotate(180) translate(-6)';
            } else {
                return d.x < Math.PI ? 'translate(-6)' : 'rotate(180) translate(6)';
            }
        })
        .attr('fill', d => {
            if (d.data.nodecolor) {
                return resolveColor(d.data.nodecolor, '#f1f5f9', true);
            }
            return d.children ? '#94a3b8' : '#f8fafc';
        });

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
