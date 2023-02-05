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
node js/parse.js verbose digraph.test digraph
*/
function digraph(yy) {
    // TODO: See splines control
    // http://www.graphviz.org/doc/info/attrs.html#d:splines
    // TODO: Start note fdp/neato
    // http://www.graphviz.org/doc/info/attrs.html#d:start

    const skipEntrances = (key, value) => {
        if (key === 'entrance' || key === 'exit') {
            return null;
        }
        return value;
    };

    const processANode = obj => {
        const nattrs = [];
        const styles = [];
        getAttrFmt(obj, 'color', 'fillcolor="{0}"', nattrs);
        getAttrFmt(obj, 'color', 'filled', styles);
        getAttrFmt(obj, 'style', '{0}', styles);
        // if (getAttr(o,'free')===true){
        // nattrs.push("constraint=false");
        // }
        const url = obj.url;
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
        getAttrFmt(obj, 'image', 'image="icons{0}"', nattrs);
        getAttrFmt(obj, 'textcolor', 'fontcolor="{0}"', nattrs);
        const r = getShape(shapes.digraph, obj.shape, 'shape="{0}"');
        if (r) {
            nattrs.push(r);
        }
        getAttrFmt(obj, 'label', 'label="{0}"', nattrs);
        var t = "";
        if (nattrs.length > 0)
            t = "[" + nattrs.join(",") + "]";
        output(yy, obj.getName() + t + ';');
    };

    const r = getGraphRoot(yy);
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
    const s = r.getStart();
    if (s) {
        const fwd = getNode(yy, s);
        processANode(fwd);
        // {$$=" {rank = same;null}\n {rank = same; "+$2+"}\n null
        // [shape=plaintext,
        // label=\"\"];\n"+$2+"[shape=doublecircle];\nnull->"+$2+";\n";}
        output(yy, "//startnode setup\n  {rank = same;null} {rank = same; " + s + "}\n  null [shape=plaintext, label=\"\"];\n  " + s + "[shape=doublecircle];\n  null->" + s + ";\n");
    }
    // This may FORWARD DECLARE a node...which creates problems with coloring
    if (r.getEqual() && r.getEqual().length > 0) {
        output(yy, "{rank=same;", true);
        for (var x = 0; x < r.getEqual().length; x++) {
            output(yy, r.getEqual()[x].getName() + ";");
        }
        output(yy, "}", false);
    }
    const fixgroup = (c => {
        for (var i in c.OBJECTS) {
            if (!c.OBJECTS.hasOwnProperty(i)) continue;
            const o = c.OBJECTS[i];
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
    })(r.OBJECTS);

    function getFirstLinkOfTheGroup(grp) {
        //output(yy,"FIRST NODE"+JSON.stringify(grp));
        for (var i in yy.LINKS) {
            if (!yy.LINKS.hasOwnProperty(i)) continue;
            const l = yy.LINKS[i];
            for (var j in grp.OBJECTS) {
                if (!grp.OBJECTS.hasOwnProperty(j)) continue;
                const n = grp.OBJECTS[j];
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
            const l = yy.LINKS[i];
            for (var j in grp.OBJECTS) {
                if (!grp.OBJECTS.hasOwnProperty(j)) continue;
                const n = grp.OBJECTS[j];
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
    const traverseObjects = function traverseObjects(root) {
        for (var i in root.OBJECTS) {
            if (!root.OBJECTS.hasOwnProperty(i)) continue;
            const obj = root.OBJECTS[i];
            if (obj instanceof Group) {
                const cond = obj.conditional;
                //	if (cond=="endif")continue;
                // Group name,OBJECTS,get/setEqual,toString
                const processAGroup = (grp => {
                    debug(JSON.stringify(grp, skipEntrances));
                    output(yy, 'subgraph cluster_' + grp.getName() + ' {', true);
                    if (grp.isSubGraph) {
                        output(yy, 'graph[style=invis];');
                    }
                    if (grp.getLabel())
                        output(yy, getAttrFmt(grp, 'label',
                            '   label="{0}";'));
                    if (grp.getColor()) {
                        output(yy, "style=filled;");
                        output(yy, getAttrFmt(grp, 'color',
                            '   color="{0}";\n'));
                    }
                    traverseObjects(grp);
                    output(false);
                    output(yy, "}//end of " + grp.getName() + " " + cond);
                    if (cond) {
                        output(yy, "//COND " + grp.getName() + " " + cond);
                        if (cond == "endif") {
                            //never reached
                            const exitlink = grp.exitlink;
                            if (exitlink) {
                                output(yy, lastexit + "->" + exitlink + "[color=red];");
                                output(yy, lastendif + "->" + exitlink + ";");
                            }
                        } else {
                            const sn = "entry" + grp.exitnode;
                            if (!lastendif) {
                                lastendif = "endif" + grp.exitnode;
                                output(yy, lastendif + "[shape=circle,label=\"\",width=0.01,height=0.01];");
                            }
                            //TODO:else does not need diamond
                            output(yy, sn + "[shape=diamond,fixedsize=true,width=1,height=1,label=\"" + grp.getLabel() + "\"];");
                            if (cond == "if") {
                                //entrylink!
                                output(yy, grp.entrylink.getName() + "->" + sn + ";");
                            }
                            // FIRST node of group and LAST node in group..
                            const lastLink = getFirstLinkOfTheGroup(grp);
                            const ln = getLastLinkInGroup(grp);
                            // decision node
                            //var en = "exit" + getAttr(o, 'exitnode');

                            if (lastexit) {
                                output(yy, lastexit + "->" + sn + "[label=\"NO\",color=red];");
                                //lastexit = undefined;
                            }
                            // YES LINK to first node of the group
                            output(yy, sn + "->" + lastLink.getName() + "[label=\"YES\",color=green,lhead=cluster_" + grp.getName() + "];");
                            output(yy, ln.getName() + "->" + lastendif + "[label=\"\"];");
                            lastexit = sn;
                        }
                    }
                })(obj);
            } else if (obj instanceof Node) {
                processANode(obj);
            } else {
                throw new Error("Not a node nor a group, NOT SUPPORTED");
            }
        }
    }(r);

    output(yy, "//links start");
    for (var i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i)) continue;
        const link = yy.LINKS[i];
        const attrs = [];
        var label = link.label;
        if (label) {
            if (label.indexOf("::") !== -1) {
                label = label.split("::");
                attrs.push('label="' + label[0].trim() + '"');
                attrs.push('xlabel="' + label[1].trim() + '"');
            } else {
                attrs.push('label="' + label.trim() + '"');
            }
        }
        const url = link.url;
        if (url) {
            attrs.push('URL="' + url.trim() + '"');
        }
        getAttrFmt(link, 'color', 'color="{0}"', attrs);
        getAttrFmt(link, ['textcolor', 'color'], 'fontcolor="{0}"', attrs);
        var linkType;
        var rhs = link.right;
        var lhs = link.left;

        debug("// link from "+lhs+" to "+rhs);
        if (rhs instanceof Group) {
            //debug('huuhuu');
            // just pick ONE Node from group and use lhead
            // TODO: Assuming it is Node (if Recursive groups implemented, it
            // could be smthg else)
            if (!rhs.isSubGraph) {
                attrs.push(" lhead=cluster_" + rhs.getName());
            }
            if (rhs.OBJECTS[0]) {
                rhs = rhs.OBJECTS[0];
            }
        }
        if (lhs instanceof Group) {
            if (!lhs.isSubGraph)
                attrs.push(" ltail=cluster_" + lhs.getName());
            if (lhs instanceof SubGraph && lhs.getExit()) {
                //get containers all nodes that have no outward links...(TODO:should be in model actually!)
                //perhaps when linking SUBGRAPH to a node (or another SUBGRAPH which might be very tricky)
                const exits = [];
                for (var i in lhs.OBJECTS) {
                    if (!lhs.OBJECTS.hasOwnProperty(i)) continue;
                    var go = lhs.OBJECTS[i];
                    if (!hasOutwardLink(yy, go)) {
                        //debug('test node '+go);
                        exits.push(go);
                    }
                }
                lhs = exits;
                //debug('got '+exits);
            } else {
                lhs = lhs.OBJECTS[0];
            }
            //debug('ll is.. '+ll);
            //debug('lr is '+lr);
            if (!lhs ) {
                // Same as above
            }
        }
        // TODO:Assuming producing DIGRAPH
        // For GRAPH all edges are type --
        // but we could SET arrow type if we'd like
        if (link.linkType.indexOf(".") !== -1) {
            attrs.push('style="dotted"');
        } else if (link.linkType.indexOf("-") !== -1) {
            attrs.push('style="dashed"');
        }
        if (link.linkType.indexOf("/") !== -1) {
            // TODO: Somehow denote better this "quite does not reach"
            // even though such an edge type MAKES NO SENSE in a graph
            attrs.push('arrowhead="tee"');
        }
        if (link.linkType.indexOf("<") !== -1 && link.linkType.indexOf(">") !== -1) {
            linkType = "->";
            attrs.push("dir=both");
        } else if (link.linkType.indexOf("<") !== -1) {
            const tmp = lhs;
            lhs = rhs;
            rhs = tmp;
            linkType = "->";
        } else if (link.linkType.indexOf(">") !== -1) {
            linkType = "->";
        } else {
            // is dotted or dashed no direction
            linkType = "->";
            attrs.push("dir=none");
        }
        var t = "";
        if (attrs.length > 0)
            t = "[" + attrs.join(",") + "]";
        debug('print lhs '+lhs);
        debug('print rhs '+rhs);
        if (lhs instanceof Array) {
            lhs.forEach((element, index, array) => {
                output(yy, element.getName() + getAttrFmt(link, 'lcompass', '{0}').trim() + linkType + rhs.getName() + getAttrFmt(link, 'rcompass', '{0}').trim() + t + ";");
            });
        } else {
            output(yy, lhs.getName() + getAttrFmt(link, 'lcompass', '{0}').trim() + linkType + rhs.getName() + getAttrFmt(link, 'rcompass', '{0}').trim() + t + ";");
        }
    }
    output(false);
    output(yy, "}");
}
