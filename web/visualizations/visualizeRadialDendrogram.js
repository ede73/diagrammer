// https://medium.com/analytics-vidhya/creating-a-radial-tree-using-d3-js-for-javascript-be943e23b74e
function visualizeRadialDendrogram(jsonData) {
    const radius = 450;

    const margin = 120;
    const angle = 360;
    const cluster = d3.layout.cluster()
        .size([angle, radius - margin]);

    const diagonal = d3.svg.diagonal.radial()
        .projection(function (d) { return [d.y, d.x / 180 * Math.PI]; });

    const svg = make_svg(2 * radius, 2 * radius)
        .attr("transform", "translate(" + radius + "," + radius + ")");

    const nodes = cluster.nodes(root);
    const links = cluster.links(nodes);

    const link = svg.selectAll(".link")
        .data(links)
        .join("path")
        .attr("class", "link")
        .attr("d", d3.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y));

    const node = svg.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });

    node.append("circle")
        .attr("r", 4.5);

    node.append("text")
        .attr("dy", ".31em")
        .attr("text-anchor", function (d) { return d.x < 180 ? "start" : "end"; })
        .attr("transform", function (d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
        .text(function (d) { return d.data.name; });

    console.log("Done visualizing RadialDendrogram");
}
