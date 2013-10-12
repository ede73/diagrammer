function ast(yy) {
    var depth = 0;

    function indent(msg) {
        if (msg.trim() == "")
            return "";
        var prefix = "";
        for (var i = 0; i < depth; i++) {
            prefix += "    ";
        }
        return prefix + msg;
    }

    var processANode = function (o) {
    };
    yy.result(indent("{result:"));
    depth++;

    var r = getGraphRoot(yy);
    if (r.getVisualizer())
        yy.result(indent(JSON.stringify({
            visualizer: r.getVisualizer()
        })));
    if (r.getDirection())
        yy.result(indent(JSON.stringify({
            direction: r.getDirection()
        })));
    if (r.getStart())
        yy.result(indent(JSON.stringify({
            start: r.getStart()
        })));
    if (r.getEqual())
        yy.result(indent(JSON.stringify({
            equal: r.getEqual()
        })));

    var traverseObjects = function traverseObjects(r) {
        for (var i in r.OBJECTS) {
            if (!r.OBJECTS.hasOwnProperty(i))continue;
            var o = r.OBJECTS[i];
            if (o instanceof Group) {
                var processAGroup = function (o) {
                    var n = JSON.parse(JSON.stringify(o));
                    n.OBJECTS = undefined;
                    yy.result(indent(JSON.stringify({
                        group: n
                    })));
                    depth++;
                    traverseObjects(o);
                    depth--;
                }(o);
            } else if (o instanceof Node) {
                yy.result(indent(JSON.stringify({
                    node: o
                })));
            } else {
                throw new Error("Not a node nor a group, NOT SUPPORTED");
            }
        }
    }(r);

    for (var i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i))continue;
        var l = yy.LINKS[i];
        var n = JSON.parse(JSON.stringify(l));
        n.container.OBJECTS = undefined;
        n.container.label = undefined;
        n.container.conditional = undefined;
        yy.result(indent(JSON.stringify(n)));
    }
    --depth;
    yy.result(indent("}"));
}
