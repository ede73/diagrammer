function ast(yy) {
    var processANode = function (o) {
    };

    output(yy, "{");
    var skipEntrances = function (key, value) {
        if (key === 'entrance' || key === 'exit') {
            return value;
        }
        return value;
    };
    var r = getGraphRoot(yy);
    if (r.getVisualizer())
        output(yy, JSON.stringify({
            visualizer: r.getVisualizer()
        }));
    if (r.getDirection())
        output(yy, JSON.stringify({
            direction: r.getDirection()
        }));
    if (r.getStart())
        output(yy, JSON.stringify({
            start: r.getStart()
        }));
    if (r.getEqual())
        output(yy, JSON.stringify({
            equal: r.getEqual()
        }));

    var objectHandler = function (o) {
        output(true);
        if (o instanceof Group) {
            var processAGroup = function (o) {
                var n = JSON.parse(JSON.stringify(o, skipEntrances));
                n.OBJECTS = undefined;
                output(yy, JSON.stringify({
                    group: n
                }) + ",");
                output(yy, '{');
                traverseObjects(o, objectHandler);
                output(yy, '},');
            }(o);
        } else if (o instanceof SubGraph) {
            var processASubGraph = function (o) {
                var n = JSON.parse(JSON.stringify(o, skipEntrances));
                n.OBJECTS = undefined;
                output(yy, JSON.stringify({
                    subgraph: n
                }) + ",");
                output(yy, '{');
                traverseObjects(o, objectHandler);
                output(yy, '},');
            }(o);
        } else if (o instanceof Node) {
            output(yy, JSON.stringify({
                node: o
            }) + ",");
        } else {
            throw new Error("Not a node nor a group, NOT SUPPORTED");
        }
        output(false);
    };
    traverseObjects(r, objectHandler);

    output(true);
    traverseLinks(yy, function (l) {
        var n = JSON.parse(JSON.stringify(l, skipEntrances));
        n.left = n.left.name;
        n.right = n.right.name;
        n.container.OBJECTS = undefined;
        n.container.label = undefined;
        n.container.isSubGraph = undefined;
        n.container.entrance = n.container.entrance ? n.container.entrance.name : undefined;
        n.container.exitnode = n.container.exitnode ? n.container.exitnode.name : undefined;
        n.container.conditional = undefined;
        n.container = n.container.name;
        output(yy, JSON.stringify({ link: n }) + ",");
    });
    output(false);
    output(yy, "}", false);
}
