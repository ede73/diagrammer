// @ts-check
///import * as d3 from "https://cdn.skypack.dev/d3@7.8.2";
//import * as d3 from 'd3';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { make_svg, removeOldVisualizations } from "../d3support";

export function visualizeReingoldTilford(jsonData) {
    const width = 400,
        height = 400;

    const diameter = height * 0.75;
    const radius = diameter / 2;
    const tree = d3.tree()
        .size([2 * Math.PI, radius])
        .separation(function (a, b) {
            return (a.parent == b.parent ? 1 : 2) / a.depth;
        });

    const data = d3.hierarchy(jsonData);
    const root = tree(data);

    removeOldVisualizations();
    const svgimg = make_svg(width, height)
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const links = root.links();
    const link = svgimg.selectAll("path.link")
        .data(links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y));

    const nodes = root.descendants();
    const node = svgimg.selectAll("g.node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
            return `rotate(${d.x * 180 / Math.PI - 90})`
                + `translate(${d.y}, 0)`;
        });

    node.append("circle")
        .attr("r", 4.5);

    node.append("text")
        .attr("dx", function (d) { return d.children ? -8 : 8; })
        .attr("dy", 3)
        .attr("text-anchor", function (d) { return d.children ? "end" : "start"; })
        .text(function (d) { return d.data.name; });

    d3.select(self.frameElement).style("height", height + "px");
    console.log("Done visualizing ReingoldTilford");
}
