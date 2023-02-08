// use ../manual_test_diagrams/layerbands.d
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
    console.log("Done visualizing LayerBands");
}

