function digraph(yy) {
    // TODO: See splines control
    // http://www.graphviz.org/doc/info/attrs.html#d:splines
    // TODO: Start note fdp/neato
    // http://www.graphviz.org/doc/info/attrs.html#d:start
    var depth = 0;

    var skipEntrances = function (key,value) {
        if (key === 'entrance' || key === 'exit') {
            return null;
        }
        return value;
    };

    function indent(msg) {
        if (msg.trim() == "")
            return "";
        var prefix = "";
        for (var i = 0; i < depth; i++) {
            prefix += "  ";
        }
        return prefix + msg;
    }

function hasOutwardLink(yy,node) {
    for (var i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i))continue;
        var r = yy.LINKS[i];
        if (r.left.name === node.name){
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
        yy.result(indent(o.getName() + t + ';'));
    };

    var r = getGraphRoot(yy);
    if (r.getVisualizer()) {
        yy.result("/* render:" + r.getVisualizer() + "*/")
    }
    yy.result("digraph {");
    depth++;
    //yy.result(indent("edge[weight=1]"))
    //yy.result(indent("ranksep=0.75"))
    //yy.result(indent("nodesep=0.75"))

    yy.result(indent("compound=true;"));
    if (r.getDirection() === "portrait") {
        yy.result(indent("rankdir=LR;"));
    } else {
        yy.result(indent("rankdir=TD;"));
    }
    // This may FORWARD DECLARE a node...which creates problems with coloring
    var s = r.getStart();
    if (s != undefined && s != "") {
        var fwd = getNode(yy, s);
        processANode(fwd);
        // {$$=" {rank = same;null}\n {rank = same; "+$2+"}\n null
        // [shape=plaintext,
        // label=\"\"];\n"+$2+"[shape=doublecircle];\nnull->"+$2+";\n";}
        yy
            .result(indent("//startnode setup\n  {rank = same;null} {rank = same; " + s + "}\n  null [shape=plaintext, label=\"\"];\n  " + s + "[shape=doublecircle];\n  null->" + s + ";\n"));
    }
    // This may FORWARD DECLARE a node...which creates problems with coloring
    if (r.getEqual() != undefined && r.getEqual().length > 0) {
        yy.result(indent("{rank=same;"));
        for (var x = 0; x < r.getEqual().length; x++) {
            yy.result(indent(r.getEqual()[x].getName() + ";"));
        }
        yy.result("}");
    }
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

    function getFirstLinkOfTheGroup(grp) {
        //yy.result("FIRST NODE"+JSON.stringify(grp));
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

    function getLastLinkInGroup(grp) {
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
        // yy.result("ReturnL "+nod);
        return nod;
    }

    var lastexit = undefined;
    var lastendif = undefined;
    var traverseObjects = function traverseObjects(r) {
        for (var i in r.OBJECTS) {
            if (!r.OBJECTS.hasOwnProperty(i))continue;
            var o = r.OBJECTS[i];
            if (o instanceof Group) {
                var cond = getAttr(o, 'conditional');
                //	if (cond=="endif")continue;
                // Group name,OBJECTS,get/setEqual,toString
                var processAGroup = function (o) {
                    debug(JSON.stringify(o,skipEntrances));
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
                    yy.result(indent("}//end of " + o.getName() + " " + cond));
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
                            var fn = getFirstLinkOfTheGroup(o);
                            var ln = getLastLinkInGroup(o);
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

        //yy.result(indent("// link from "+ll+" to "+lr));
        if (lr instanceof Group ) {
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
            if (ll instanceof SubGraph && ll.getExit()!==undefined){
              //get containers all nodes that have no outward links...(TODO:should be in model actually!)
              //perhaps when linking SUBGRAPH to a node (or another SUBGRAPH which might be very tricky)
              var exits=[];
              for(var i in ll.OBJECTS){
               if (!ll.OBJECTS.hasOwnProperty(i))continue;
                var go = ll.OBJECTS[i];
                if (!hasOutwardLink(yy,go)){
                //debug('test node '+go);
                  exits.push(go);
                }
              }
              ll=exits;
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
          ll.forEach(function(element, index, array){
            yy.result(indent(element.getName() + getAttrFmt(l, 'lcompass', '{0}').trim() + lt + lr.getName() + getAttrFmt(l, 'rcompass', '{0}').trim() + t + ";"));
          });
        } else {
          yy.result(indent(ll.getName() + getAttrFmt(l, 'lcompass', '{0}').trim() + lt + lr.getName() + getAttrFmt(l, 'rcompass', '{0}').trim() + t + ";"));
        }
    }
    yy.result("}");
}
