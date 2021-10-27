/*
a>b>c,d
a>e;link text
a;node text

to
digraph {
    compound=true;
    rankdir=TD;
    a[label="node text"];
    b;
    c;
    d;
    e;
    //links start
    a->b;
    b->c;
    b->d;
    a->e[label="link text"];
}
node parse.js verbose parsetree.test digraph
*/
function digraph(yy) {
    // TODO: See splines control
    // http://www.graphviz.org/doc/info/attrs.html#d:splines
    // TODO: Start note fdp/neato
    // http://www.graphviz.org/doc/info/attrs.html#d:start

    var skipEntrances = function (key, value) {
        if (key === 'entrance' || key === 'exit') {
            return null;
        }
        return value;
    };

    function hasOutwardLink(yy, node) {
        for (var i in yy.LINKS) {
            if (!yy.LINKS.hasOwnProperty(i)) continue;
            var r = yy.LINKS[i];
            if (r.left.name === node.name) {
                return true;
            }
        }
        return false;
    }

    var processANode = function (o) {
        var nattrs = [];
        var styles = [];
        getAttrFmt(o, 'color', 'fillcolor="{0}"', nattrs);
        getAttrFmt(o, 'color', 'filled', styles);
        getAttrFmt(o, 'style', '{0}', styles);
        // if (getAttr(o,'free')===true){
        // nattrs.push("constraint=false");
        // }
        var url = getAttr(o, 'url');
        if (url) {
            nattrs.push('URL="' + url.trim() + '"');
        }
        if (styles.length > 0) {
            if (styles.join("").indexOf('singularity') !== -1) {
                // invis node is not singularity!, circle with minimal
                // width/height IS!
                nattrs.push('shape="circle"');
                nattrs.push('label=""');
                nattrs.push("width=0.01");
                nattrs.push("weight=0.01");
            } else {
                nattrs.push('style="' + styles.join(",") + '"');
            }
        }
        getAttrFmt(o, 'image', 'image="icons{0}"', nattrs);
        getAttrFmt(o, 'textcolor', 'fontcolor="{0}"', nattrs);
        var r = getShape(shapes.digraph, o.shape, 'shape="{0}"');
        if (r) {
            nattrs.push(r);
        }
        getAttrFmt(o, 'label', 'label="{0}"', nattrs);
        var t = "";
        if (nattrs.length > 0)
            t = "[" + nattrs.join(",") + "]";
        output(yy, o.getName() + t + ';');
    };

    var r = getGraphRoot(yy);
    if (r.getVisualizer()) {
        output(yy, "/* render:" + r.getVisualizer() + "*/")
    }
    output(yy, "digraph {", true);
    //output(yy,"edge[weight=1]")
    //output(yy,"ranksep=0.75")
    //output(yy,"nodesep=0.75")

    output(yy, "compound=true;");
    if (r.getDirection() === "portrait") {
        output(yy, "rankdir=LR;");
    } else {
        output(yy, "rankdir=TD;");
    }
    // This may FORWARD DECLARE a node...which creates problems with coloring
    var s = r.getStart();
    if (s != undefined && s != "") {
        var fwd = getNode(yy, s);
        processANode(fwd);
        // {$$=" {rank = same;null}\n {rank = same; "+$2+"}\n null
        // [shape=plaintext,
        // label=\"\"];\n"+$2+"[shape=doublecircle];\nnull->"+$2+";\n";}
        output(yy, "//startnode setup\n  {rank = same;null} {rank = same; " + s + "}\n  null [shape=plaintext, label=\"\"];\n  " + s + "[shape=doublecircle];\n  null->" + s + ";\n");
    }
    // This may FORWARD DECLARE a node...which creates problems with coloring
    if (r.getEqual() != undefined && r.getEqual().length > 0) {
        output(yy, "{rank=same;", true);
        for (var x = 0; x < r.getEqual().length; x++) {
            output(yy, r.getEqual()[x].getName() + ";");
        }
        output(yy, "}", false);
    }
    var fixgroup = function (c) {
        for (var i in c.OBJECTS) {
            if (!c.OBJECTS.hasOwnProperty(i)) continue;
            var o = c.OBJECTS[i];
            if (o instanceof Group) {
                if (o.OBJECTS.length == 0) {
                    o.OBJECTS.push(new Node("invis_" + o.getName())
                        .setStyle("invis"));
                } else {
                    // A group...non empty...parse inside
                    fixgroup(o);
                }
            }
        }
    }(r.OBJECTS);

    function getFirstLinkOfTheGroup(grp) {
        //output(yy,"FIRST NODE"+JSON.stringify(grp));
        for (var i in yy.LINKS) {
            if (!yy.LINKS.hasOwnProperty(i)) continue;
            var l = yy.LINKS[i];
            for (var j in grp.OBJECTS) {
                if (!grp.OBJECTS.hasOwnProperty(j)) continue;
                var n = grp.OBJECTS[j];
                if (n == l.left) {
                    // output(yy,"ReturnF "+n);
                    return n;
                }
            }
        }
        return undefined;
    }

    function getLastLinkInGroup(grp) {
        var nod = undefined;
        // output(yy,"LAST NODE"+JSON.stringify(grp));
        for (var i in yy.LINKS) {
            if (!yy.LINKS.hasOwnProperty(i)) continue;
            var l = yy.LINKS[i];
            for (var j in grp.OBJECTS) {
                if (!grp.OBJECTS.hasOwnProperty(j)) continue;
                var n = grp.OBJECTS[j];
                if (n == l.left)
                    nod = n;
                if (n == l.right)
                    nod = n;
            }
        }
        // output(yy,"ReturnL "+nod);
        return nod;
    }

    var lastexit = undefined;
    var lastendif = undefined;
    var traverseObjects = function traverseObjects(r) {
        for (var i in r.OBJECTS) {
            if (!r.OBJECTS.hasOwnProperty(i)) continue;
            var o = r.OBJECTS[i];
            if (o instanceof Group) {
                var cond = getAttr(o, 'conditional');
                //	if (cond=="endif")continue;
                // Group name,OBJECTS,get/setEqual,toString
                var processAGroup = function (o) {
                    debug(JSON.stringify(o, skipEntrances));
                    output(yy, 'subgraph cluster_' + o.getName() + ' {', true);
                    if (o.isSubGraph) {
                        output(yy, 'graph[style=invis];');
                    }
                    if (o.getLabel())
                        output(yy, getAttrFmt(o, 'label',
                            '   label="{0}";'));
                    if (o.getColor() !== undefined) {
                        output(yy, "style=filled;");
                        output(yy, getAttrFmt(o, 'color',
                            '   color="{0}";\n'));
                    }
                    traverseObjects(o);
                    output(false);
                    output(yy, "}//end of " + o.getName() + " " + cond);
                    if (cond) {
                        output(yy, "//COND " + o.getName() + " " + cond);
                        if (cond == "endif") {
                            //never reached
                            var exitlink = getAttr(o, 'exitlink');
                            if (exitlink) {
                                output(yy, lastexit + "->" + exitlink + "[color=red];");
                                output(yy, lastendif + "->" + exitlink + ";");
                            }
                        } else {
                            var sn = "entry" + getAttr(o, 'exitnode');
                            if (!lastendif) {
                                lastendif = "endif" + getAttr(o, 'exitnode');
                                output(yy, lastendif + "[shape=circle,label=\"\",width=0.01,height=0.01];");
                            }
                            //TODO:else does not need diamond
                            output(yy, sn + "[shape=diamond,fixedsize=true,width=1,height=1,label=\"" + o.getLabel() + "\"];");
                            if (cond == "if") {
                                //entrylink!
                                output(yy, getAttr(o, 'entrylink').getName() + "->" + sn + ";");
                            }
                            // FIRST node of group and LAST node in group..
                            var fn = getFirstLinkOfTheGroup(o);
                            var ln = getLastLinkInGroup(o);
                            // decision node
                            //var en = "exit" + getAttr(o, 'exitnode');

                            if (lastexit) {
                                output(yy, lastexit + "->" + sn + "[label=\"NO\",color=red];");
                                //lastexit = undefined;
                            }
                            // YES LINK to first node of the group
                            output(yy, sn + "->" + fn.getName() + "[label=\"YES\",color=green,lhead=cluster_" + o.getName() + "];");
                            output(yy, ln.getName() + "->" + lastendif + "[label=\"\"];");
                            lastexit = sn;
                        }
                    }
                }(o);
            } else if (o instanceof Node) {
                processANode(o);
            } else {
                throw new Error("Not a node nor a group, NOT SUPPORTED");
            }
        }
    }(r);

    output(yy, "//links start");
    for (var i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i)) continue;
        var l = yy.LINKS[i];
        var attrs = [];
        var label = getAttr(l, 'label');
        if (label) {
            if (label.indexOf("::") !== -1) {
                label = label.split("::");
                attrs.push('label="' + label[0].trim() + '"');
                attrs.push('xlabel="' + label[1].trim() + '"');
            } else {
                attrs.push('label="' + label.trim() + '"');
            }
        }
        var url = getAttr(l, 'url');
        if (url) {
            attrs.push('URL="' + url.trim() + '"');
        }
        getAttrFmt(l, 'color', 'color="{0}"', attrs);
        getAttrFmt(l, ['textcolor', 'color'], 'fontcolor="{0}"', attrs);
        var lt;
        var lr = l.right;
        var ll = l.left;

        //output(yy,"// link from "+ll+" to "+lr);
        if (lr instanceof Group) {
            //debug('huuhuu');
            // just pick ONE Node from group and use lhead
            // TODO: Assuming it is Node (if Recursive groups implemented, it
            // could be smthg else)
            if (!lr.isSubGraph)
                attrs.push(" lhead=cluster_" + lr.getName());
            lr = lr.OBJECTS[0];
            //debug('lr is '+lr);
            if (lr == undefined) {
                // TODO:Bad thing, EMPTY group..add one invisible node there...
                // But should add already at TOP
            }
        }
        if (ll instanceof Group) {
            if (!ll.isSubGraph)
                attrs.push(" ltail=cluster_" + ll.getName());
            if (ll instanceof SubGraph && ll.getExit() !== undefined) {
                //get containers all nodes that have no outward links...(TODO:should be in model actually!)
                //perhaps when linking SUBGRAPH to a node (or another SUBGRAPH which might be very tricky)
                var exits = [];
                for (var i in ll.OBJECTS) {
                    if (!ll.OBJECTS.hasOwnProperty(i)) continue;
                    var go = ll.OBJECTS[i];
                    if (!hasOutwardLink(yy, go)) {
                        //debug('test node '+go);
                        exits.push(go);
                    }
                }
                ll = exits;
                //debug('got '+exits);
            } else {
                ll = ll.OBJECTS[0];
            }
            //debug('ll is.. '+ll);
            //debug('lr is '+lr);
            if (ll == undefined) {
                // Same as above
            }
        }
        // TODO:Assuming producing DIGRAPH
        // For GRAPH all edges are type --
        // but we could SET arrow type if we'd like
        if (l.linkType.indexOf(".") !== -1) {
            attrs.push('style="dotted"');
        } else if (l.linkType.indexOf("-") !== -1) {
            attrs.push('style="dashed"');
        }
        if (l.linkType.indexOf("/") !== -1) {
            // TODO: Somehow denote better this "quite does not reach"
            // even though such an edge type MAKES NO SENSE in a graph
            attrs.push('arrowhead="tee"');
        }
        if (l.linkType.indexOf("<") !== -1 && l.linkType.indexOf(">") !== -1) {
            lt = "->";
            attrs.push("dir=both");
        } else if (l.linkType.indexOf("<") !== -1) {
            var tmp = ll;
            ll = lr;
            lr = tmp;
            lt = "->";
        } else if (l.linkType.indexOf(">") !== -1) {
            lt = "->";
        } else {
            // is dotted or dashed no direction
            lt = "->";
            attrs.push("dir=none");
        }
        var t = "";
        if (attrs.length > 0)
            t = "[" + attrs.join(",") + "]";
        //debug('print ll '+ll);
        //debug('print lr '+lr);
        if (ll instanceof Array) {
            ll.forEach(function (element, index, array) {
                output(yy, element.getName() + getAttrFmt(l, 'lcompass', '{0}').trim() + lt + lr.getName() + getAttrFmt(l, 'rcompass', '{0}').trim() + t + ";");
            });
        } else {
            output(yy, ll.getName() + getAttrFmt(l, 'lcompass', '{0}').trim() + lt + lr.getName() + getAttrFmt(l, 'rcompass', '{0}').trim() + t + ";");
        }
    }
    output(false);
    output(yy, "}");
}
