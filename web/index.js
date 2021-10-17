console.log("Reset generator and visualizer");
VERBOSE = false;

parser.yy.parseError = function (str, hash) {
    var pe = "Parsing error:\n" + str + "\n" + hash;
    console.log("pe");
    document.getElementById("error").innerText = pe;
    cancelVTimer();
    throw new Error(str);
};
// called line by line...
parser.yy.result = function (line) {
    if (parsingStarted) {
        console.log("Parsing results coming in for " + parser.yy.OUTPUT + " / " + parser.yy.VISUALIZER);
        parsingStarted = false;
        result.value = "";
    }
    result.value = result.value + line + "\n";
}

parser.trace = function (x) {
    console.log("TRACE:" + x);
}

function openImage(imageUrl) {
    window.open(imageUrl + '?x=' + new Date().getTime());
}

function getSavedGraph() {
    var data = {};
    if (!localStorage.getItem("graphs")) {
        localStorage.setItem("graphs", JSON.stringify(data));
        return data;
    }
    var graph = localStorage.getItem("graphs");
    // console.log("Have graph"+graph);
    data = eval("(" + graph + ")");
    return data;
}

function getSavedFiles() {
    var t = "";
    for (var k in getSavedGraph()) {
        console.log("Stored file:" + k);
        t += '<option value="' + k + '">' + k + '</option>';
    }
    var e = document.getElementById("saved");
    e.innerHTML = t;
}

function save() {
    var filename = document.getElementById("filename").value;
    var editable = getText();
    var data = getSavedGraph();
    data[filename] = editable;
    var jd = JSON.stringify(data);
    localStorage.setItem("graphs", jd);
    // clipboardData.setData("text",jd);
}

function load() {
    var filename = document.getElementById("filename").value;
    var data = getSavedGraph();
    if (data[filename])
        setText(data[filename]);
}

function exportGraphs() {
    $.ajax({
        type: "POST",
        async: true,
        cache: false,
        url: "web/saveExport.php",
        data: JSON.stringify(getSavedGraph()),
        contentType: "application/json; charset=utf-8",
        // dataType: "json",
        success: function (msg) {
            alert("Exported");
        },
        error: function (err) {
            alert("ERROR: " + JSON.stringify(err));
            if (err.status == 200) {
                ParseResult(err);
            } else {
                alert('Error:' + err.responseText + '  Status: ' + err.status);
            }
        }
    });

}

function importGraphs() {
    $.ajax({
        type: "GET",
        async: true,
        cache: false,
        // url: "web/localstorage.json",
        url: "web/loadExport.php",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (msg) {
            // alert(JSON.stringify(msg));
            localStorage.setItem("graphs", JSON.stringify(msg));
        },
        error: function (err) {
            alert("ERROR: " + JSON.stringify(err));
            if (err.status == 200) {
                ParseResult(err);
            } else {
                alert('Error:' + err.responseText + '  Status: ' + err.status);
            }
        }
    });
}

function visualize(visualizer) {
    var statelang = document.getElementById("result").value;
    if (!visualizer) {
        visualizer = getVisualizer();
    }
    var visualizeUrl = "web/visualize.php?visualizer=" + visualizer;
    $.ajax({
        type: "POST",
        async: true,
        cache: false,
        url: visualizeUrl,
        data: statelang,
        // data: {body:statelang},
        // contentType: "application/json; charset=utf-8",
        // dataType: "json",
        success: function (msg) {
            // UseReturnedData(msg.d);
            // alert(msg);
            document.getElementById("image").setAttribute("src", msg);
            reloadImg('image');
        },
        error: function (err) {
            alert("ERROR: " + JSON.stringify(err));
            if (err.status == 200) {
                ParseResult(err);
            } else {
                alert('Error:' + err.responseText + '  Status: ' + err.status);
            }
        }
    });
    if (visualizer == "dot") {
        try {
            document.getElementById('svg').innerHTML = Viz(statelang, 'svg');
        } catch (err) {
            console.log(err);
        }
        // try{
        // var canviz = new Canviz('graph_container');
        // canviz.load("http://192.168.11.215/~ede/state/post.txt");
        // }catch(err){
        // console.log(err);
        // }
    } else if (visualizer == "radialdendrogram") {
        radialdendroit(JSON.parse(result.value));
    } else if (visualizer == "circlepacked") {
        circlepacked(JSON.parse(result.value));
    } else if (visualizer == "reingoldtilford") {
        reingoldit(JSON.parse(result.value));
    } else if (visualizer == "parsetree") {
        parsetree(""/*JSON.parse(result.value)*/);
    } else {
        console.log("UNKNOWN vISUALIZER " + visualizer);
        document.getElementById('svg').innerHTML = "only for dotty";
    }
}

function make_svg(width, height) {
    d3.select("#the_SVG_ID").remove();
    return d3.select("#D3JSIMAGES").append("svg")
        .attr('id', 'the_SVG_ID')
        .attr("width", width)
        .attr("height", height)
        .append("g");
}

function reingoldit(jsonData) {

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
}

// https://medium.com/analytics-vidhya/creating-a-radial-tree-using-d3-js-for-javascript-be943e23b74e
function radialdendroit(jsonData) {
    const radius = 450;

    const margin = 120;
    const angle = 360;
    var cluster = d3.layout.cluster()
        .size([angle, radius - margin]);

    var diagonal = d3.svg.diagonal.radial()
        .projection(function (d) { return [d.y, d.x / 180 * Math.PI]; });

    const svg = make_svg(2 * radius, 2 * radius)
        .attr("transform", "translate(" + radius + "," + radius + ")");

    var nodes = cluster.nodes(root);
    var links = cluster.links(nodes);

    var link = svg.selectAll(".link")
        .data(links)
        .join("path")
        .attr("class", "link")
        .attr("d", d3.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y));

    var node = svg.selectAll(".node")
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
}

// https://observablehq.com/@d3/circle-packing
function circlepacked(jsonData) {
    const width = 400, height = 400;
    //pack = data => d3.pack()
    //    .size([width, height])
    //    .padding(3)
    ///    (d3.hierarchy(data)
    //        .sum(d => d.value)
    //        .sort((a, b) => b.value - a.value))

    //const root = pack(JSON.parse(parseResult));
    //       d3.select(self.frameElement).style("height", height + "px");
}

function parsetree(jsonData) {
    var $ = go.GraphObject.make;  // for conciseness in defining templates
    myDiagram =
        $(go.Diagram, "D3JSIMAGES",
            {
                allowCopy: false,
                allowDelete: false,
                allowMove: false,
                initialAutoScale: go.Diagram.Uniform,
                layout:
                    $(FlatTreeLayout,  // custom Layout, defined below
                        {
                            angle: 90,
                            compaction: go.TreeLayout.CompactionNone
                        }),
                "undoManager.isEnabled": true
            });

    myDiagram.nodeTemplate =
        $(go.Node, "Vertical",
            { selectionObjectName: "BODY" },
            $(go.Panel, "Auto", { name: "BODY" },
                $(go.Shape, "RoundedRectangle",
                    new go.Binding("fill"),
                    new go.Binding("stroke")),
                $(go.TextBlock,
                    { font: "bold 12pt Arial, sans-serif", margin: new go.Margin(4, 2, 2, 2) },
                    new go.Binding("text"))
            ),
            $(go.Panel,  // this is underneath the "BODY"
                { height: 17 },  // always this height, even if the TreeExpanderButton is not visible
                $("TreeExpanderButton")
            )
        );

    myDiagram.linkTemplate =
        $(go.Link,
            $(go.Shape, { strokeWidth: 1.5 }));

    // set up the nodeDataArray, describing each part of the sentence
    var nodeDataArray = [
        { key: 1, text: "Sentence", fill: "#f68c06", stroke: "#4d90fe" },
        { key: 2, text: "NP", fill: "#f68c06", stroke: "#4d90fe", parent: 1 },
        { key: 3, text: "DT", fill: "#ccc", stroke: "#4d90fe", parent: 2 },
        { key: 4, text: "A", fill: "#f8f8f8", stroke: "#4d90fe", parent: 3 },
        { key: 5, text: "JJ", fill: "#ccc", stroke: "#4d90fe", parent: 2 },
        { key: 6, text: "rare", fill: "#f8f8f8", stroke: "#4d90fe", parent: 5 },
        { key: 7, text: "JJ", fill: "#ccc", stroke: "#4d90fe", parent: 2 },
        { key: 8, text: "black", fill: "#f8f8f8", stroke: "#4d90fe", parent: 7 },
        { key: 9, text: "NN", fill: "#ccc", stroke: "#4d90fe", parent: 2 },
        { key: 10, text: "squirrel", fill: "#f8f8f8", stroke: "#4d90fe", parent: 9 },
        { key: 11, text: "VP", fill: "#f68c06", stroke: "#4d90fe", parent: 1 },
        { key: 12, text: "VBZ", fill: "#ccc", stroke: "#4d90fe", parent: 11 },
        { key: 13, text: "has", fill: "#f8f8f8", stroke: "#4d90fe", parent: 12 },
        { key: 14, text: "VP", fill: "#f68c06", stroke: "#4d90fe", parent: 11 },
        { key: 15, text: "VBN", fill: "#ccc", stroke: "#4d90fe", parent: 14 },
        { key: 16, text: "become", fill: "#f8f8f8", stroke: "#4d90fe", parent: 15 },
        { key: 17, text: "NP", fill: "#f68c06", stroke: "#4d90fe", parent: 14 },
        { key: 18, text: "NP", fill: "#f68c06", stroke: "#4d90fe", parent: 17 },
        { key: 19, text: "DT", fill: "#ccc", stroke: "#4d90fe", parent: 18 },
        { key: 20, text: "a", fill: "#f8f8f8", stroke: "#4d90fe", parent: 19 },
        { key: 21, text: "JJ", fill: "#ccc", stroke: "#4d90fe", parent: 18 },
        { key: 22, text: "regular", fill: "#f8f8f8", stroke: "#4d90fe", parent: 21 },
        { key: 23, text: "NN", fill: "#ccc", stroke: "#4d90fe", parent: 18 },
        { key: 24, text: "visitor", fill: "#f8f8f8", stroke: "#4d90fe", parent: 23 },
        { key: 25, text: "PP", fill: "#f68c06", stroke: "#4d90fe", parent: 17 },
        { key: 26, text: "TO", fill: "#ccc", stroke: "#4d90fe", parent: 25 },
        { key: 27, text: "to", fill: "#f8f8f8", stroke: "#4d90fe", parent: 26 },
        { key: 28, text: "NP", fill: "#f68c06", stroke: "#4d90fe", parent: 25 },
        { key: 29, text: "DT", fill: "#ccc", stroke: "#4d90fe", parent: 28 },
        { key: 30, text: "a", fill: "#f8f8f8", stroke: "#4d90fe", parent: 29 },
        { key: 31, text: "JJ", fill: "#ccc", stroke: "#4d90fe", parent: 28 },
        { key: 32, text: "suburban", fill: "#f8f8f8", stroke: "#4d90fe", parent: 31 },
        { key: 33, text: "NN", fill: "#ccc", stroke: "#4d90fe", parent: 28 },
        { key: 34, text: "garden", fill: "#f8f8f8", stroke: "#4d90fe", parent: 33 },
        { key: 35, text: ".", fill: "#ccc", stroke: "#4d90fe", parent: 1 },
        { key: 36, text: ".", fill: "#f8f8f8", stroke: "#4d90fe", parent: 35 }
    ]

    // create the Model with data for the tree, and assign to the Diagram
    myDiagram.model =
        $(go.TreeModel,
            { nodeDataArray: nodeDataArray });
    x=0;y=0;printSize=300;
    svg=myDiagram.makeSvg({ scale: 1.0, position: new go.Point(x, y), size: printSize });

    const svgimg=document.getElementById('D3JSIMAGES');
   while (svgimg.firstChild) {
    svgimg.removeChild(svgimg.firstChild);
  }
  svgimg.appendChild(svg);
}

// Customize the TreeLayout to position all of the leaf nodes at the same vertical Y position.
function FlatTreeLayout() {
    go.TreeLayout.call(this);  // call base constructor
}
go.Diagram.inherit(FlatTreeLayout, go.TreeLayout);

// This assumes the TreeLayout.angle is 90 -- growing downward
FlatTreeLayout.prototype.commitLayout = function () {
    go.TreeLayout.prototype.commitLayout.call(this);  // call base method first
    // find maximum Y position of all Nodes
    var y = -Infinity;
    this.network.vertexes.each(function (v) {
        y = Math.max(y, v.node.position.y);
    });
    // move down all leaf nodes to that Y position, but keeping their X position
    this.network.vertexes.each(function (v) {
        if (v.destinationEdges.count === 0) {
            // shift the node down to Y
            v.node.position = new go.Point(v.node.position.x, y);
            // extend the last segment vertically
            v.node.toEndSegmentLength = Math.abs(v.centerY - y);
        } else {  // restore to normal value
            v.node.toEndSegmentLength = 10;
        }
    });
};