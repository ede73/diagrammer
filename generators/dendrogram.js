function dendrogram(yy) {
    var processANode = function (o) {
    };
    output(yy,"{",true);

    var r = getGraphRoot(yy);
    if (r.getVisualizer())
        output(yy,JSON.stringify({
            visualizer: r.getVisualizer()
        }));
    if (r.getDirection())
        output(yy,JSON.stringify({
            direction: r.getDirection()
        }));
    if (r.getStart())
        output(yy,JSON.stringify({
            start: r.getStart()
        }));
    if (r.getEqual())
        output(yy,JSON.stringify({
            equal: r.getEqual()
        }));

    var parseObject = function (o) {
        if (o instanceof Group) {
            var processAGroup = function (o) {
                var n = JSON.parse(JSON.stringify(o));
                n.OBJECTS = undefined;
                output(yy,JSON.stringify({
                    group: n
                }));
		output(true);
                traverseObjects(o, parseObject);
		output(false);
            }(o);
        } else if (o instanceof Node) {
            output(yy,JSON.stringify({
                node: o
            }));
        } else {
            throw new Error("Not a node nor a group, NOT SUPPORTED");
        }
    };
    traverseObjects(r,parseObject);

    traverseLinks(yy, function(l) {
        var n = JSON.parse(JSON.stringify(l));
        n.container.OBJECTS = undefined;
        n.container.label = undefined;
        n.container.conditional = undefined;
        output(yy,JSON.stringify(n));
    });

    output(yy,"}");
}
