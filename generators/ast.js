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
    var skipEntrances = function (key,value) {
        if (key === 'entrance' || key === 'exit') {
            return value;
        }
        return value;
    };    
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
                    var n = JSON.parse(JSON.stringify(o, skipEntrances));
                    n.OBJECTS = undefined;
                    yy.result(indent(JSON.stringify({
                        group: n
                    })));
                    depth++;
                    yy.result('    {');
                    traverseObjects(o);
                    depth--;
                    yy.result('    }');
                }(o);
            } else if (o instanceof SubGraph) {
                var processASubGraph = function (o) {
                    var n = JSON.parse(JSON.stringify(o, skipEntrances));
                    n.OBJECTS = undefined;
                    yy.result(indent(JSON.stringify({
                        subgraph: n
                    })));
                    depth++;
                    yy.result('    {');
                    traverseObjects(o);
                    yy.result('    }');
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
        yy.result(indent(JSON.stringify({link:n})));
    }
    --depth;
    yy.result(indent("}"));
}
