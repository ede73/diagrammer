function digraph(yy) {
    //TODO: See splines control http://www.graphviz.org/doc/info/attrs.html#d:splines
    //TODO: Start note fdp/neato http://www.graphviz.org/doc/info/attrs.html#d:start
    var r = getGraphRoot(yy);
    if (r.getVisualizer()) {
        yy.result("/* render:" + r.getVisualizer() + "*/")
    }
    yy.result("digraph {");
    yy.result("  compound=true;");
    if (r.getDirection() === "portrait") {
        yy.result("  rankdir=LR;");
    } else {
        yy.result("  rankdir=TD;");
    }
    var s = r.getStart();
    if (s != undefined && s != "") {
        //    {$$="  {rank = same;null}\n  {rank = same; "+$2+"}\n  null [shape=plaintext, label=\"\"];\n"+$2+"[shape=doublecircle];\nnull->"+$2+";\n";}
        yy.result("  {rank = same;null} {rank = same; " + s + "} null [shape=plaintext, label=\"\"];\n" + s + "[shape=doublecircle];\nnull->" + s + ";\n");
    }
    if (r.getEqual() != undefined && r.getEqual().length > 0) {
        yy.result("  {rank=same;");
        for (var x = 0; x < r.getEqual().length; x++) {
            yy.result(r.getEqual()[x].getName() + ";");
        }
        yy.result("}");
    }
    var fixgroup = function(c) {
        for (var i in c.OBJECTS) {
            var o = c.OBJECTS[i];
            if (o instanceof Group) {
                if (o.OBJECTS.length == 0) {
                    o.OBJECTS.push(new Node("invis_" + o.getName()).setStyle("invis"));
                } else {
                    //A group...non empty...parse inside
                    fixgroup(o);
                }
            }
        }
    }(r.OBJECTS);

    var processANode = function(o) {
        var s = getAttrFmt(o, 'color', ',fillcolor="{0}",style="filled"') +
            getAttrFmt(o, 'image', ',image="icons{0}"') +
            getShape(shapes.digraph, o.shape, ',shape="{0}"') +
            getAttrFmt(o, 'style', ',style={0}') +
        /*getAttrFmt(o,'shape',',shape="{0}"')+*/
        getAttrFmt(o, 'label', ',label="{0}"');
        if (s.trim() != "")
            s = "[" + s.trim().substring(1) + "]";
        yy.result("  " + o.getName() + s + ';');
    };


    var traverseObjects = function traverseObjects(r) {
        for (var i in r.OBJECTS) {
            var o = r.OBJECTS[i];
            if (o instanceof Group) {
                //Group name,OBJECTS,get/setEqual,toString
                var processAGroup = function(o) {
                    debug(JSON.stringify(o));
                    yy.result('  subgraph cluster_' + o.getName() + ' {');
                    yy.result(getAttrFmt(o, 'label', '   label="{0}";'));
                    if (o.getColor() != undefined) {
                        yy.result("    style=filled;");
                        yy.result(getAttrFmt(o, 'color', '   color="{0}";\n'));
                    }
                    traverseObjects(o);
                    yy.result("  }//end of "+o.getName());
                }(o);
            } else if (o instanceof Node) {
                processANode(o);
            } else {
                throw new Error("Not a node nor a group, NOT SUPPORTED");
            }
        }
    }(r);

    for (var i in yy.LINKS) {
        var l = yy.LINKS[i];
        var t = getAttrFmt(l, 'label', ',label="{0}"') +
            getAttrFmt(l, 'color', ',color="{0}"') +
            getAttrFmt(l, 'color', ',fontcolor="{0}"');
        var lt;
        var lr = l.right;
        var ll = l.left;

        if (lr instanceof Group) {
            //just pick ONE Node from group and use lhead
            //TODO: Assuming it is Node (if Recursive groups implemented, it could be smthg else)
            t += " lhead=cluster_" + lr.getName();
            lr = lr.OBJECTS[0];
            if (lr == undefined) {
                //TODO:Bad thing, EMPTY group..add one invisible node there...
                //But should add already at TOP
            }
        }
        //TODO:Assuming producing DIGRAPH
        //For GRAPH all edges are type --
        //but we could SET arrow type if we'd like
        if (t.trim() != "")
            t = t.trim().substring(1);
        if (l.linkType.indexOf(".") !== -1) {
            t += ' style="dotted" ';
        } else if (l.linkType.indexOf("-") !== -1) {
            t += ' style="dashed" ';
        }
        if (l.linkType.indexOf("<") !== -1 &&
            l.linkType.indexOf(">") !== -1) {
            lt = "->";
            t += "dir=both";
        } else if (l.linkType.indexOf("<") !== -1) {
            var tmp = ll;
            ll = lr;
            lr = tmp;
            lt = "->";
        } else if (l.linkType.indexOf(">") !== -1) {
            lt = "->";
        } else {
            //is dotted or dashed no direction
            lt = "->";
            t += "dir=none";
        }
        if (t.trim() != "")
            t = "[" + t + "]";
        yy.result(ll.getName() + lt + lr.getName() + t + ";");
    }
    yy.result("}");
}
