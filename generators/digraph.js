/**
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

@param {GraphMeta} graphmeta
*/
function digraph(graphmeta) {
    // TODO: See splines control
    // http://www.graphviz.org/doc/info/attrs.html#d:splines
    // TODO: Start note fdp/neato
    // http://www.graphviz.org/doc/info/attrs.html#d:start

    /**
     * 
     * @param {string} key 
     * @returns 
     */
    const skipEntrances = (key, value) => {
        if (key === 'entrance' || key === 'exit') {
            return null;
        }
        return value;
    };

    /**
     * @param {GraphObject} obj 
     */
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
        let t = "";
        if (nattrs.length > 0)
            t = "[" + nattrs.join(",") + "]";
        output(graphmeta, obj.getName() + t + ';');
    };

    const r = graphmeta.GRAPHROOT;
    if (r.getVisualizer()) {
        output(graphmeta, "/* render:" + r.getVisualizer() + "*/")
    }
    output(graphmeta, "digraph {", true);
    //output(graphmeta,"edge[weight=1]")
    //output(graphmeta,"ranksep=0.75")
    //output(graphmeta,"nodesep=0.75")

    output(graphmeta, "compound=true;");
    if (r.getDirection() === "portrait") {
        output(graphmeta, "rankdir=LR;");
    } else {
        output(graphmeta, "rankdir=TD;");
    }
    // This may FORWARD DECLARE a node...which creates problems with coloring
    const start = r.getStart();
    if (start) {
        const fwd = getNode(graphmeta.yy, start);
        processANode(fwd);
        // {$$=" {rank = same;null}\n {rank = same; "+$2+"}\n null
        // [shape=plaintext,
        // label=\"\"];\n"+$2+"[shape=doublecircle];\nnull->"+$2+";\n";}
        output(graphmeta, "//startnode setup\n  {rank = same;null} {rank = same; " + start + "}\n  null [shape=plaintext, label=\"\"];\n  " + start + "[shape=doublecircle];\n  null->" + start + ";\n");
    }
    // This may FORWARD DECLARE a node...which creates problems with coloring
    if (r.getEqual() && r.getEqual().length > 0) {
        output(graphmeta, "{rank=same;", true);
        for (let x = 0; x < r.getEqual().length; x++) {
            output(graphmeta, r.getEqual()[x].getName() + ";");
        }
        output(graphmeta, "}", false);
    }
    const fixgroup = (c => {
        for (const i in c.OBJECTS) {
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
        //output(graphmeta,"FIRST NODE"+JSON.stringify(grp));
        for (const i in graphmeta.LINKS) {
            if (!graphmeta.LINKS.hasOwnProperty(i)) continue;
            const l = graphmeta.LINKS[i];
            for (const j in grp.OBJECTS) {
                if (!grp.OBJECTS.hasOwnProperty(j)) continue;
                const n = grp.OBJECTS[j];
                if (n == l.left) {
                    // output(graphmeta,"ReturnF "+n);
                    return n;
                }
            }
        }
        return undefined;
    }

    function getLastLinkInGroup(grp) {
        let nod = undefined;
        // output(graphmeta,"LAST NODE"+JSON.stringify(grp));
        for (const i in graphmeta.LINKS) {
            if (!graphmeta.LINKS.hasOwnProperty(i)) continue;
            const l = graphmeta.LINKS[i];
            for (const j in grp.OBJECTS) {
                if (!grp.OBJECTS.hasOwnProperty(j)) continue;
                const n = grp.OBJECTS[j];
                if (n == l.left)
                    nod = n;
                if (n == l.right)
                    nod = n;
            }
        }
        // output(graphmeta,"ReturnL "+nod);
        return nod;
    }

    let lastexit = undefined;
    let lastendif = undefined;
    const traverseObjects = function traverseObjects(root) {
        for (const i in root.OBJECTS) {
            if (!root.OBJECTS.hasOwnProperty(i)) continue;
            const obj = root.OBJECTS[i];
            if (obj instanceof Group) {
                const cond = obj.conditional;
                //	if (cond=="endif")continue;
                // Group name,OBJECTS,get/setEqual,toString
                const processAGroup = (grp => {
                    debug(JSON.stringify(grp, skipEntrances));
                    output(graphmeta, 'subgraph cluster_' + grp.getName() + ' {', true);
                    if (grp.isSubGraph) {
                        output(graphmeta, 'graph[style=invis];');
                    }
                    if (grp.getLabel())
                        output(graphmeta, getAttrFmt(grp, 'label',
                            '   label="{0}";'));
                    if (grp.getColor()) {
                        output(graphmeta, "style=filled;");
                        output(graphmeta, getAttrFmt(grp, 'color',
                            '   color="{0}";\n'));
                    }
                    traverseObjects(grp);
                    output(false);
                    output(graphmeta, "}//end of " + grp.getName() + " " + cond);
                    if (cond) {
                        output(graphmeta, "//COND " + grp.getName() + " " + cond);
                        if (cond == "endif") {
                            //never reached
                            const exitlink = grp.exitlink;
                            if (exitlink) {
                                output(graphmeta, lastexit + "->" + exitlink + "[color=red];");
                                output(graphmeta, lastendif + "->" + exitlink + ";");
                            }
                        } else {
                            const sn = "entry" + grp.exitnode;
                            if (!lastendif) {
                                lastendif = "endif" + grp.exitnode;
                                output(graphmeta, lastendif + "[shape=circle,label=\"\",width=0.01,height=0.01];");
                            }
                            //TODO:else does not need diamond
                            output(graphmeta, sn + "[shape=diamond,fixedsize=true,width=1,height=1,label=\"" + grp.getLabel() + "\"];");
                            if (cond == "if") {
                                //entrylink!
                                output(graphmeta, grp.entrylink.getName() + "->" + sn + ";");
                            }
                            // FIRST node of group and LAST node in group..
                            const lastLink = getFirstLinkOfTheGroup(grp);
                            const ln = getLastLinkInGroup(grp);
                            // decision node
                            //const en = "exit" + o.exitnode

                            if (lastexit) {
                                output(graphmeta, lastexit + "->" + sn + "[label=\"NO\",color=red];");
                                //lastexit = undefined;
                            }
                            // YES LINK to first node of the group
                            output(graphmeta, sn + "->" + lastLink.getName() + "[label=\"YES\",color=green,lhead=cluster_" + grp.getName() + "];");
                            output(graphmeta, ln.getName() + "->" + lastendif + "[label=\"\"];");
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

    output(graphmeta, "//links start");
    traverseLinks(graphmeta, (link) => {
        const attrs = [];
        let label = link.label;
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
        let linkType;
        let rhs = link.right;
        let lhs = link.left;

        debug("// link from " + lhs + " to " + rhs);
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
                for (const i in lhs.OBJECTS) {
                    if (!lhs.OBJECTS.hasOwnProperty(i)) continue;
                    const go = lhs.OBJECTS[i];
                    if (!hasOutwardLink(graphmeta.yy, go)) {
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
            if (!lhs) {
                // Same as above
            }
        }
        // TODO:Assuming producing DIGRAPH
        // For GRAPH all edges are type --
        // but we could SET arrow type if we'd like
        if (link.isDotted()) {
            attrs.push('style="dotted"');
        } else if (link.isDashed()) {
            attrs.push('style="dashed"');
        }
        if (link.isBroken()) {
            // TODO: Somehow denote better this "quite does not reach"
            // even though such an edge type MAKES NO SENSE in a graph
            attrs.push('arrowhead="tee"');
        }
        if (link.isBidirectional()) {
            linkType = "->";
            attrs.push("dir=both");
        } else if (link.isLeftLink()) {
            const tmp = lhs;
            lhs = rhs;
            rhs = tmp;
            linkType = "->";
        } else if (link.isRightLink()) {
            linkType = "->";
        } else {
            // is dotted or dashed no direction
            linkType = "->";
            attrs.push("dir=none");
        }
        let t = "";
        if (attrs.length > 0)
            t = "[" + attrs.join(",") + "]";
        debug('print lhs ' + lhs);
        debug('print rhs ' + rhs);
        if (lhs instanceof Array) {
            lhs.forEach((element, index, array) => {
                output(graphmeta, element.getName() + getAttrFmt(link, 'lcompass', '{0}').trim() + linkType + rhs.getName() + getAttrFmt(link, 'rcompass', '{0}').trim() + t + ";");
            });
        } else {
            output(graphmeta, lhs.getName() + getAttrFmt(link, 'lcompass', '{0}').trim() + linkType + rhs.getName() + getAttrFmt(link, 'rcompass', '{0}').trim() + t + ";");
        }
    });
    output(false);
    output(graphmeta, "}");
}
generators.set('digraph', digraph);