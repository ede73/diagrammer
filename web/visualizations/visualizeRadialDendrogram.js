// @ts-check
// Started working ONLY after
// apt install npm 
// # btw. which also failed, had to apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Check-Date=false update
// # something to do with WSL2 and time, maybe apt install ntp helps (some said)
// # clock and TZ were spot on though!
// npm i --save-dev @types/d3

// I did also add dependencies to package.json 
// while this work on VSCode, it doesn't run on browser currently, TODO
//import * as d3 from 'd3';
//import * as d3 from "https://cdn.skypack.dev/d3@7.8.2";
//import * as d3 from "https://cdn.observableusercontent.com/npm/d3@7.8.2/dist/d3.min.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { make_svg, removeOldVisualizations } from "../d3support";

//<script src="https://d3js.org/d3.v7.min.js"></script>

/*
https://github.com/d3/d3/issues/3469
https://www.npmjs.com/package/@types/d3
https://formidable.com/blog/2022/victory-esm/ ??
 */
// https://medium.com/analytics-vidhya/creating-a-radial-tree-using-d3-js-for-javascript-be943e23b74e
export function visualizeRadialDendrogram(jsonData) {
    const radius = 450;
    const width = 400,
        height = 400;

    let tree = d3.tree()
        .size([2 * Math.PI, radius])
        .separation(function (a, b) {
            return (a.parent == b.parent ? 1 : 2) / a.depth;
        });
    let data = d3.hierarchy(jsonData);
    let treeData = tree(data);
    let nodes = treeData.descendants();
    let links = treeData.links();

    removeOldVisualizations();
    const svgimg = make_svg(width, height)
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const link = svgimg.selectAll(".link")
        .data(links)
        .join("path")
        .attr("class", "link")
        .attr("d", d3.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y));

    const node = svgimg.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) { return `rotate(${d.x - 90})translate(${d.y})`; });

    node.append("circle")
        .attr("r", 4.5);

    node.append("text")
        .attr("dy", ".31em")
        .attr("text-anchor", function (d) { return d.x < 180 ? "start" : "end"; })
        .attr("transform", function (d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
        .text(function (d) { return d.data.name; });
}
