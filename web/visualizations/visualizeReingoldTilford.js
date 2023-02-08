function visualizeReingoldTilford(jsonData) {

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

    const svg = make_svg(width, height)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    const links = root.links();
    const link = svg.selectAll("path.link")
        .data(links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y));

    const nodes = root.descendants();
    const node = svg.selectAll("g.node")
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
