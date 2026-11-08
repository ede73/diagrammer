import * as d3 from 'd3';
import { makeSVG, removeOldVisualizations } from '../d3support.js';
export async function visualizeReingoldTilford(generatorResult) {
    var _a;
    try {
        JSON.parse(generatorResult);
    }
    catch (e) {
        console.error(e, generatorResult);
    }
    const jsonData = JSON.parse(generatorResult);
    removeOldVisualizations();
    const svgimg = makeSVG();
    const svgelement = (_a = svgimg.node()) === null || _a === void 0 ? void 0 : _a.parentNode;
    const width = Number(svgelement.width.baseVal.valueAsString);
    const height = Number(svgelement.height.baseVal.valueAsString);
    svgimg.attr('transform', `translate(${width / 2},${height / 2})`);
    const radius = Math.min(width, height);
    const tree = d3.tree()
        .size([2 * Math.PI, radius])
        .separation((a, b) => {
        return (a.parent === b.parent ? 1 : 2) / a.depth;
    });
    const data = d3.hierarchy(jsonData);
    const treeData = tree(data);
    const links = treeData.links();
    const nodes = treeData.descendants();
    const getRadial = (d) => {
        return d.y;
    };
    svgimg.selectAll('.link')
        .data(links)
        .join('path')
        .attr('class', 'link')
        .attr('stroke', d => {
        if (d.source.data.edgecolor) {
            return d.source.data.edgecolor;
        }
        if (d.target.data.edgecolor) {
            return d.target.data.edgecolor;
        }
        return 'yellow';
    })
        .attr('d', d3.linkRadial()
        .angle((d, i) => d.x)
        .radius((d, i) => getRadial(d)));
    const node = svgimg.selectAll('g.node')
        .data(nodes)
        .enter().append('g')
        .style('font', '10px sans-serif')
        .attr('class', 'node')
        .attr('transform', (d) => {
        return `rotate(${d.x * 180 / Math.PI - 90}) translate(${getRadial(d)})`;
    });
    node.append('circle')
        .attr('r', 4.5);
    node.append('text')
        .attr('fill', (d) => {
        if (d.data.nodecolor) {
            return d.data.nodecolor;
        }
        return 'blue';
    })
        .attr('dx', (d) => {
        return d.children ? -8 : 8;
    })
        .attr('dy', 3)
        .attr('text-anchor', (d) => {
        return d.children ? 'end' : 'start';
    })
        .attr('transform', (d) => {
        return `rotate(${-(d.x * 180 / Math.PI - 90)})`;
    })
        .append('a')
        .attr('fill', (d) => {
        if (d.data.nodecolor) {
            return d.data.nodecolor;
        }
        return 'blue';
    })
        .attr('href', (d) => {
        const label = d.data.nodelabel;
        if (label === null || label === void 0 ? void 0 : label.includes('::')) {
            const [, url] = label.split('::');
            return url;
        }
        return '';
    })
        .attr('target', '_blank')
        .text((d) => {
        const label = d.data.nodelabel;
        if (label === null || label === void 0 ? void 0 : label.includes('::')) {
            const [head] = label.split('::');
            return head;
        }
        if (label) {
            return label;
        }
        return d.data.name;
    });
    d3.select(self.frameElement).style('height', `${height}px`);
}
