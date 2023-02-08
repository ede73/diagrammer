console.log("Reset generator and visualizer");
const VERBOSE = false;

function openImage(imageUrl) {
    window.open(imageUrl + '?x=' + new Date().getTime());
}

function visualize(visualizer) {
    const statelang = document.getElementById("result").value;
    if (!visualizer) {
        visualizer = getVisualizer();
    }
    const visualizeUrl = "web/visualize.php?visualizer=" + visualizer;
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
        // const canviz = new Canviz('graph_container');
        // canviz.load("http://192.168.11.215/~ede/state/post.txt");
        // }catch(err){
        // console.log(err);
        // }
    } else if (visualizer == "radialdendrogram") {
        visualizeRadialDendrogram(JSON.parse(result.value));
    } else if (visualizer == "circlepacked") {
        visualizeCirclePacked(JSON.parse(result.value));
    } else if (visualizer == "reingoldtilford") {
        visualizeReingoldTilford(JSON.parse(result.value));
    } else if (visualizer == "parsetree") {
        visualizeParseTree(JSON.parse(result.value));
    } else if (visualizer == "layerbands") {
        visualizeLayerBands(JSON.parse(result.value));
    } else if (visualizer == "umlclass") {
        visualizeUmlClass(JSON.parse(result.value));
    } else {
        console.log("Unkknown WEB UI visualizer " + visualizer);
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
}

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
}

// https://observablehq.com/@d3/circle-packing
function visualizeCirclePacked(jsonData) {
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

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function visualizeParseTree(jsonData) {
    const $ = go.GraphObject.make;  // for conciseness in defining templates

    const element = document.getElementById("D3JSIMAGES");
    removeAllChildNodes(element);
    const newDiv = document.createElement("div");
    newDiv.setAttribute("id", "PARSETREENODE");
    element.appendChild(newDiv);

    myDiagram =
        $(go.Diagram, "PARSETREENODE",
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

    const nodeDataArray = jsonData;

    // create the Model with data for the tree, and assign to the Diagram
    myDiagram.model =
        $(go.TreeModel,
            { nodeDataArray: nodeDataArray });
    const x = 0; const y = 0; const printSize = 300;
    svg = myDiagram.makeSvg({ scale: 1.0, position: new go.Point(x, y), size: printSize });

    const svgimg = document.getElementById('D3JSIMAGES');
    removeAllChildNodes(svgimg);
    svgimg.appendChild(svg);
}

function visualizeLayerBands(jsonData) {
    const HORIZONTAL = true;
    // Perform a TreeLayout where commitLayers is overridden to modify the background Part whose key is "_BANDS".
    function BandedTreeLayout() {
        go.TreeLayout.call(this);
        this.layerStyle = go.TreeLayout.LayerUniform;  // needed for straight layers
    }
    go.Diagram.inherit(BandedTreeLayout, go.TreeLayout);
    BandedTreeLayout.prototype.commitLayers = function (layerRects, offset) {
        // update the background object holding the visual "bands"
        const bands = this.diagram.findPartForKey("_BANDS");
        if (!bands) {
            return;
        }
        const model = this.diagram.model;
        bands.location = this.arrangementOrigin.copy().add(offset);

        // make each band visible or not, depending on whether there is a layer for it
        for (var it = bands.elements; it.next();) {
            const idx = it.key;
            const elt = it.value;  // the item panel representing a band
            elt.visible = idx < layerRects.length;
        }

        // set the bounds of each band via data binding of the "bounds" property
        const arr = bands.data.itemArray;
        for (var i = 0; i < layerRects.length; i++) {
            const itemdata = arr[i];
            if (itemdata) {
                model.setDataProperty(itemdata, "bounds", layerRects[i]);
            }
        }
    };

    function init() {
        var $ = go.GraphObject.make;

        const element = document.getElementById("D3JSIMAGES");
        removeAllChildNodes(element);
        const newDiv = document.createElement("div");
        newDiv.setAttribute("id", "LAYEREDBANDNODE");
        element.appendChild(newDiv);

        myDiagram = $(go.Diagram, "LAYEREDBANDNODE",
            {
                layout: $(BandedTreeLayout,  // custom layout is defined above
                    {
                        angle: HORIZONTAL ? 0 : 90,
                        arrangement: HORIZONTAL ? go.TreeLayout.ArrangementVertical : go.TreeLayout.ArrangementHorizontal
                    }),
                "undoManager.isEnabled": true
            });

        myDiagram.nodeTemplate =
            $(go.Node, go.Panel.Auto,
                $(go.Shape, "Rectangle",
                    { fill: "white" }),
                $(go.TextBlock, { margin: 5 },
                    new go.Binding("text", "key")));

        // There should be at most a single object of this category.
        // This Part will be modified by BandedTreeLayout.commitLayers to display visual "bands"
        // where each "layer" is a layer of the tree.
        // This template is parameterized at load time by the HORIZONTAL parameter.
        // You also have the option of showing rectangles for the layer bands or
        // of showing separator lines between the layers, but not both at the same time,
        // by commenting in/out the indicated code.
        myDiagram.nodeTemplateMap.add("Bands",
            $(go.Part, "Position",
                new go.Binding("itemArray"),
                {
                    isLayoutPositioned: false,  // but still in document bounds
                    locationSpot: new go.Spot(0, 0, HORIZONTAL ? 0 : 16, HORIZONTAL ? 16 : 0),  // account for header height
                    layerName: "Background",
                    pickable: false,
                    selectable: false,
                    itemTemplate:
                        $(go.Panel, HORIZONTAL ? "Vertical" : "Horizontal",
                            new go.Binding("position", "bounds", function (b) { return b.position; }),
                            $(go.TextBlock,
                                {
                                    angle: HORIZONTAL ? 0 : 270,
                                    textAlign: "center",
                                    wrap: go.TextBlock.None,
                                    font: "bold 11pt sans-serif",
                                    background: $(go.Brush, "Linear", { 0: "aqua", 1: go.Brush.darken("aqua") })
                                },
                                new go.Binding("text"),
                                // always bind "width" because the angle does the rotation
                                new go.Binding("width", "bounds", function (r) { return HORIZONTAL ? r.width : r.height; })
                            ),
                            // option 1: rectangular bands:
                            $(go.Shape,
                                { stroke: null, strokeWidth: 0 },
                                new go.Binding("desiredSize", "bounds", function (r) { return r.size; }),
                                new go.Binding("fill", "itemIndex", function (i) { return i % 2 == 0 ? "whitesmoke" : go.Brush.darken("whitesmoke"); }).ofObject())
                        )
                }
            ));

        myDiagram.linkTemplate =
            $(go.Link,
                $(go.Shape));  // simple black line, no arrowhead needed

        // define the tree node data
        const nodearray = [
            { // this is the information needed for the headers of the bands
                key: "_BANDS",
                category: "Bands",
                itemArray: [
                    { text: "Zero" },
                    { text: "One" },
                    { text: "Two" },
                    { text: "Three" },
                    { text: "Four" },
                    { text: "Five" }
                ]
            },
            // these are the regular nodes in the TreeModel
            { key: "root" },
            { key: "oneB", parent: "root" },
            { key: "twoA", parent: "oneB" },
            { key: "twoC", parent: "root" },
            { key: "threeC", parent: "twoC" },
            { key: "threeD", parent: "twoC" },
            { key: "fourB", parent: "threeD" },
            { key: "fourC", parent: "twoC" },
            { key: "fourD", parent: "fourB" },
            { key: "twoD", parent: "root" }
        ];

        myDiagram.model = new go.TreeModel(nodearray);

        x = 0; y = 0; printSize = 300;
        svg = myDiagram.makeSvg({ scale: 1.0, position: new go.Point(x, y), size: printSize });

        const svgimg = document.getElementById('D3JSIMAGES');
        removeAllChildNodes(svgimg);
        svgimg.appendChild(svg);
    }
    init();
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
    let y = -Infinity;
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

function visualizeUmlClass(jsonData) {
    var $ = go.GraphObject.make;

    const element = document.getElementById("D3JSIMAGES");
    removeAllChildNodes(element);
    const newDiv = document.createElement("div");
    newDiv.setAttribute("id", "UMLCLASS");
    element.appendChild(newDiv);

    myDiagram =
        $(go.Diagram, "UMLCLASS",
            {
                "undoManager.isEnabled": true,
                layout: $(go.TreeLayout,
                    { // this only lays out in trees nodes connected by "generalization" links
                        angle: 90,
                        path: go.TreeLayout.PathSource,  // links go from child to parent
                        setsPortSpot: false,  // keep Spot.AllSides for link connection spot
                        setsChildPortSpot: false,  // keep Spot.AllSides
                        // nodes not connected by "generalization" links are laid out horizontally
                        arrangement: go.TreeLayout.ArrangementHorizontal
                    })
            });

    // show visibility or access as a single character at the beginning of each property or method
    function convertVisibility(v) {
        switch (v) {
            case "public": return "+";
            case "private": return "-";
            case "protected": return "#";
            case "package": return "~";
            default: return v;
        }
    }

    // the item template for properties
    var propertyTemplate =
        $(go.Panel, "Horizontal",
            // property visibility/access
            $(go.TextBlock,
                { isMultiline: false, editable: false, width: 12 },
                new go.Binding("text", "visibility", convertVisibility)),
            // property name, underlined if scope=="class" to indicate static property
            $(go.TextBlock,
                { isMultiline: false, editable: true },
                new go.Binding("text", "name").makeTwoWay(),
                new go.Binding("isUnderline", "scope", function (s) { return s[0] === 'c' })),
            // property type, if known
            $(go.TextBlock, "",
                new go.Binding("text", "type", function (t) { return (t ? ": " : ""); })),
            $(go.TextBlock,
                { isMultiline: false, editable: true },
                new go.Binding("text", "type").makeTwoWay()),
            // property default value, if any
            $(go.TextBlock,
                { isMultiline: false, editable: false },
                new go.Binding("text", "default", function (s) { return s ? " = " + s : ""; }))
        );

    // the item template for methods
    const methodTemplate =
        $(go.Panel, "Horizontal",
            // method visibility/access
            $(go.TextBlock,
                { isMultiline: false, editable: false, width: 12 },
                new go.Binding("text", "visibility", convertVisibility)),
            // method name, underlined if scope=="class" to indicate static method
            $(go.TextBlock,
                { isMultiline: false, editable: true },
                new go.Binding("text", "name").makeTwoWay(),
                new go.Binding("isUnderline", "scope", function (s) { return s[0] === 'c' })),
            // method parameters
            $(go.TextBlock, "()",
                // this does not permit adding/editing/removing of parameters via inplace edits
                new go.Binding("text", "parameters", function (parr) {
                    let s = "(";
                    for (var i = 0; i < parr.length; i++) {
                        const param = parr[i];
                        if (i > 0) s += ", ";
                        s += param.name + ": " + param.type;
                    }
                    return s + ")";
                })),
            // method return type, if any
            $(go.TextBlock, "",
                new go.Binding("text", "type", function (t) { return (t ? ": " : ""); })),
            $(go.TextBlock,
                { isMultiline: false, editable: true },
                new go.Binding("text", "type").makeTwoWay())
        );

    // this simple template does not have any buttons to permit adding or
    // removing properties or methods, but it could!
    myDiagram.nodeTemplate =
        $(go.Node, "Auto",
            {
                locationSpot: go.Spot.Center,
                fromSpot: go.Spot.AllSides,
                toSpot: go.Spot.AllSides
            },
            $(go.Shape, { fill: "lightyellow" }),
            $(go.Panel, "Table",
                { defaultRowSeparatorStroke: "black" },
                // header
                $(go.TextBlock,
                    {
                        row: 0, columnSpan: 2, margin: 3, alignment: go.Spot.Center,
                        font: "bold 12pt sans-serif",
                        isMultiline: false, editable: true
                    },
                    new go.Binding("text", "name").makeTwoWay()),
                // properties
                $(go.TextBlock, "Properties",
                    { row: 1, font: "italic 10pt sans-serif" },
                    new go.Binding("visible", "visible", function (v) { return !v; }).ofObject("PROPERTIES")),
                $(go.Panel, "Vertical", { name: "PROPERTIES" },
                    new go.Binding("itemArray", "properties"),
                    {
                        row: 1, margin: 3, stretch: go.GraphObject.Fill,
                        defaultAlignment: go.Spot.Left, background: "lightyellow",
                        itemTemplate: propertyTemplate
                    }
                ),
                $("PanelExpanderButton", "PROPERTIES",
                    { row: 1, column: 1, alignment: go.Spot.TopRight, visible: false },
                    new go.Binding("visible", "properties", function (arr) { return arr.length > 0; })),
                // methods
                $(go.TextBlock, "Methods",
                    { row: 2, font: "italic 10pt sans-serif" },
                    new go.Binding("visible", "visible", function (v) { return !v; }).ofObject("METHODS")),
                $(go.Panel, "Vertical", { name: "METHODS" },
                    new go.Binding("itemArray", "methods"),
                    {
                        row: 2, margin: 3, stretch: go.GraphObject.Fill,
                        defaultAlignment: go.Spot.Left, background: "lightyellow",
                        itemTemplate: methodTemplate
                    }
                ),
                $("PanelExpanderButton", "METHODS",
                    { row: 2, column: 1, alignment: go.Spot.TopRight, visible: false },
                    new go.Binding("visible", "methods", function (arr) { return arr.length > 0; }))
            )
        );

    function convertIsTreeLink(r) {
        return r === "generalization";
    }

    function convertFromArrow(r) {
        switch (r) {
            case "generalization": return "";
            default: return "";
        }
    }

    function convertToArrow(r) {
        switch (r) {
            case "generalization": return "Triangle";
            case "aggregation": return "StretchedDiamond";
            default: return "";
        }
    }

    myDiagram.linkTemplate =
        $(go.Link,
            { routing: go.Link.Orthogonal },
            new go.Binding("isLayoutPositioned", "relationship", convertIsTreeLink),
            $(go.Shape),
            $(go.Shape, { scale: 1.3, fill: "white" },
                new go.Binding("fromArrow", "relationship", convertFromArrow)),
            $(go.Shape, { scale: 1.3, fill: "white" },
                new go.Binding("toArrow", "relationship", convertToArrow))
        );

    // setup a few example class nodes and relationships
    const nodedata = jsonData[0];
    const linkdata = jsonData[1];
    myDiagram.model = $(go.GraphLinksModel,
        {
            copiesArrays: true,
            copiesArrayObjects: true,
            nodeDataArray: nodedata,
            linkDataArray: linkdata
        });
    const x = 0; const y = 0; const printSize = 300;
    svg = myDiagram.makeSvg({ scale: 1.0, position: new go.Point(x, y), size: printSize });

    const svgimg = document.getElementById('D3JSIMAGES');
    removeAllChildNodes(svgimg);
    svgimg.appendChild(svg);
}
