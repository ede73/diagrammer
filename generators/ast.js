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
    output(yy, indent("{"));
    depth++;
    var skipEntrances = function (key,value) {
        if (key === 'entrance' || key === 'exit') {
            return value;
        }
        return value;
    };    
    var r = getGraphRoot(yy);
    if (r.getVisualizer())
        output(yy, indent(JSON.stringify({
            visualizer: r.getVisualizer()
        })));
    if (r.getDirection())
        output(yy, indent(JSON.stringify({
            direction: r.getDirection()
        })));
    if (r.getStart())
        output(yy, indent(JSON.stringify({
            start: r.getStart()
        })));
    if (r.getEqual())
        output(yy, indent(JSON.stringify({
            equal: r.getEqual()
        })));

    var traverseObjects = function traverseObjects(r) {
        for (var i in r.OBJECTS) {
            if (!r.OBJECTS.hasOwnProperty(i))continue;
            var o = r.OBJECTS[i];
            if (o instanceof Group) {
                var processAGroup = function (o) {
                    var n = JSON.parse(JSON.stringify(o, skipEntrances));
                    n.OBJECTS = undefined;
                    output(yy, indent(JSON.stringify({
                        group: n
                    }))+",");
                    depth++;
                    output(yy, '    {');
                    traverseObjects(o);
                    depth--;
                    output(yy, '    },');
                }(o);
            } else if (o instanceof SubGraph) {
                var processASubGraph = function (o) {
                    var n = JSON.parse(JSON.stringify(o, skipEntrances));
                    n.OBJECTS = undefined;
                    output(yy, indent(JSON.stringify({
                        subgraph: n
                    }))+",");
                    depth++;
                    output(yy, '    {');
                    traverseObjects(o);
                    output(yy, '    },');
                    depth--;
                }(o);
            } else if (o instanceof Node) {
                output(yy, indent(JSON.stringify({
                    node: o
                }))+",");
            } else {
                throw new Error("Not a node nor a group, NOT SUPPORTED");
            }
        }
    }(r);

    for (var i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i))continue;
        var l = yy.LINKS[i];
        var n = JSON.parse(JSON.stringify(l, skipEntrances));
        n.left = n.left.name;
        n.right = n.right.name;
        n.container.OBJECTS = undefined;
        n.container.label = undefined;
        n.container.isSubGraph = undefined;
        n.container.entrance = n.container.entrance?n.container.entrance.name:undefined;
        n.container.exitnode = n.container.exitnode?n.container.exitnode.name:undefined;
        n.container.conditional = undefined;
        n.container = n.container.name;
        output(yy, indent(JSON.stringify({link:n}))+",");
    }
    --depth;
    output(yy, indent("}"));
}
