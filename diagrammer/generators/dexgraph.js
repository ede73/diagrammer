function dexgraph(yy) {
    var depth = 0;

    function indent(msg) {
        if (msg.trim() == "")
            return "";
        var prefix = "";
        for (var i = 0; i < depth; i++) {
            prefix += "  ";
        }
        return (prefix + msg).trim();
    }

    var processANode = function (o) {
        var nattrs = [];
        var styles = [];
        getAttrFmt(o, 'color', 'fillcolor="{0}"', nattrs);
        getAttrFmt(o, 'color', 'filled', styles);
        getAttrFmt(o, 'style', '{0}', styles);
        var url = getAttr(o, 'url');
        if (url) {
            nattrs.push('"[[' + url.trim() + ']]"');
        }
        if (styles.length > 0) {
            if (styles.join("").indexOf('singularity') !== -1) {
                // invis node is not singularity!, circle with minimal
                // width/height IS!
                nattrs.push('circle');
            } else {
                nattrs.push(styles.join(","));
            }
        }
        getAttrFmt(o, 'image', 'image="icons{0}"', nattrs);
        getAttrFmt(o, 'textcolor', 'fontcolor="{0}"', nattrs);
        getAttrFmt(o, 'label', '"{0}"', nattrs);
        var t = "";
        if (nattrs.length > 0)
            t =  nattrs.join(",");
        yy.result(indent('t_'+o.getName() + ' ' + o.getName() + ' ' + t));
    };

    var processAType = function (o) {
        var nattrs = [];
        var styles = [];
        getAttrFmt(o, 'color', '"{0}"', nattrs);
        //getAttrFmt(o, 'style', '{0}', styles);
        //if (styles.length > 0) {
        //    nattrs.push('"' + styles.join(",") + '"');
        //}
        //getAttrFmt(o, 'image', 'image="icons{0}"', nattrs);
        //getAttrFmt(o, 'textcolor', 'f"{0}"', nattrs);
        var r = getShape(shapes.digraph, o.shape, '{0}');
        if (r) {
            nattrs.push(r);
        } else {
            nattrs.push('circle');
        }
        var t = "";
        if (nattrs.length > 0)
            t = nattrs.join("|");
        yy.result(indent('(type t_' + o.getName() + t+')'));
    };

    var r = getGraphRoot(yy);
    if (r.getVisualizer()) {
        yy.result("/* render:" + r.getVisualizer() + "*/")
    }
    yy.result("GRAPH:");
    depth++;
	yy.result('fff');
    var fixgroup = function (c) {
        for (var i in c.OBJECTS) {
            if (!c.OBJECTS.hasOwnProperty(i))continue;
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
	yy.result('zzz');

    function getFirstLink(grp) {
        // yy.result("FIRST NODE"+JSON.stringify(grp));
        for (var i in yy.LINKS) {
            if (!yy.LINKS.hasOwnProperty(i))continue;
            var l = yy.LINKS[i];
            for (var j in grp.OBJECTS) {
                if (!grp.OBJECTS.hasOwnProperty(j))continue;
                var n = grp.OBJECTS[j];
                if (n == l.left) {
                    // yy.result("ReturnF "+n);
                    return n;
                }
            }
        }
        return undefined;
    }
	yy.result('xxx');

    function getLastLink(grp) {
        var nod = undefined;
        // yy.result("LAST NODE"+JSON.stringify(grp));
        for (var i in yy.LINKS) {
            if (!yy.LINKS.hasOwnProperty(i))continue;
            var l = yy.LINKS[i];
            for (var j in grp.OBJECTS) {
                if (!grp.OBJECTS.hasOwnProperty(j))continue;
                var n = grp.OBJECTS[j];
                if (n == l.left)
                    nod = n;
                if (n == l.right)
                    nod = n;
            }
        }
        return nod;
    }

	yy.result('+++');
    var dumpTypes = function traverseObjects(r) {
        for (var i in r.OBJECTS) {
            if (!r.OBJECTS.hasOwnProperty(i))continue;
            var o = r.OBJECTS[i];
            if (o instanceof Group) {
            } else if (o instanceof Node) {
                processAType(o);
            } else {
                throw new Error("Not a node nor a group, NOT SUPPORTED");
            }
        }
    }(r);
	yy.result('----');

    var lastexit = undefined;
    var lastendif = undefined;
    var traverseObjects = function traverseObjects(r) {
        for (var i in r.OBJECTS) {
            if (!r.OBJECTS.hasOwnProperty(i))continue;
            var o = r.OBJECTS[i];
            if (o instanceof Group) {
                var cond = getAttr(o, 'conditional');
                var processAGroup = function (o) {
                    debug(JSON.stringify(o));
                    yy.result(indent('subgraph cluster_' + o.getName() + ' {'));
                    if (o.isSubGraph){
                        yy.result('graph[style=invis];');
                    }
                    depth++;
                    if (o.getLabel())
                        yy.result(indent(getAttrFmt(o, 'label',
                            '   label="{0}";')));
                    if (o.getColor() !== undefined) {
                        yy.result(indent("style=filled;"));
                        yy.result(indent(getAttrFmt(o, 'color',
                            '   color="{0}";\n')));
                    }
                    depth++;
                    traverseObjects(o);
                    depth--;
                    depth--;
                    yy.result(indent("}//3end of " + o.getName() + " " + cond));
                    if (cond) {
                        yy.result(indent("//COND " + o.getName() + " " + cond));
                        if (cond == "endif") {
                            //never reached
                            var exitlink = getAttr(o, 'exitlink');
                            if (exitlink) {
                                yy.result(indent(lastexit + "->" + exitlink + "[color=red];"));
                                yy.result(indent(lastendif + "->" + exitlink + ";"));
                            }
                        } else {
                            var sn = "entry" + getAttr(o, 'exitnode');
                            if (!lastendif) {
                                lastendif = "endif" + getAttr(o, 'exitnode');
                                yy.result(indent(lastendif + "[shape=circle,label=\"\",width=0.01,height=0.01];"));
                            }
                            //TODO:else does not need diamond
                            yy.result(indent(sn + "[shape=diamond,fixedsize=true,width=1,height=1,label=\"" + o.getLabel() + "\"];"));
                            if (cond == "if") {
                                //entrylink!
                                yy.result(indent(getAttr(o, 'entrylink').getName() + "->" + sn + ";"));
                            }
                            // FIRST node of group and LAST node in group..
                            var fn = getFirstLink(o);
                            var ln = getLastLink(o);
                            // decision node
                            //var en = "exit" + getAttr(o, 'exitnode');

                            if (lastexit) {
                                yy.result(indent(lastexit + "->" + sn + "[label=\"NO\",color=red];"));
                                //lastexit = undefined;
                            }
                            // YES LINK to first node of the group
                            yy.result(indent(sn + "->" + fn.getName() + "[label=\"YES\",color=green,lhead=cluster_" + o.getName() + "];"));
                            yy.result(indent(ln.getName() + "->" + lastendif + "[label=\"\"];"));
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

    yy.result("//links start");
    for (var i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i))continue;
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

        // yy.result(indent("//"+lr));
        if (lr instanceof Group ) {
            // just pick ONE Node from group and use lhead
            // TODO: Assuming it is Node (if Recursive groups implemented, it
            // could be smthg else)
            if (!lr.isSubGraph)
                attrs.push(" lhead=cluster_" + lr.getName());
            lr = lr.OBJECTS[0];
            if (lr == undefined) {
                // TODO:Bad thing, EMPTY group..add one invisible node there...
                // But should add already at TOP
            }
        }
        if (ll instanceof Group) {
            if (!ll.isSubGraph)
                attrs.push(" ltail=cluster_" + ll.getName());
            ll = ll.OBJECTS[0];
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
        yy.result(indent(ll.getName() + getAttrFmt(l, 'lcompass', '{0}').trim() + lt + lr.getName() + getAttrFmt(l, 'rcompass', '{0}').trim() + t + ";"));
    }
    yy.result("}");
}
