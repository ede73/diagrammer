/*
a>b>c,d
a>e;link text
a;node text

to
@startuml
autonumber
participant  "node text" as  a
participant  b
participant  c
participant  d
participant  e
a->b
b->c
b->d
a->e:link text
@enduml

node js/parse.js verbose plantuml_sequence.test plantuml_sequence
*/
function plantuml_sequence(yy) {
    var processANode = function (o, sbgraph) {
        var nattrs = [];
        var styles = [];
        // getAttrFmt(o, 'color', 'fillcolor="{0}"',nattrs);
        // getAttrFmt(o,'color','filled',styles);
        getAttrFmt(o, 'style', '{0}', styles);
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
        var t = "";
        if (nattrs.length > 0)
            t = "[" + nattrs.join(",") + "]";
        //yy.result(indent("participant " + getAttrFmt(o, 'label', '"{0}" as') + " " + o.getName() + t));
        output(yy, "participant {0} {1} {2}".format(
            getAttrFmt(o, 'label', '"{0}" as'),
            o.getName(),
            t));
    };

    var r = getGraphRoot(yy);
    if (r.getVisualizer()) {
        outputFmt(yy, "/* render: {0} */", [r.getVisualizer()])
    }
    output(yy, "@startuml");
    output(yy, "autonumber", true);
    /*
     * if (r.getDirection() === "portrait") { output(yy, indent("rankdir=LR;")); }
     * else { output(yy, indent("rankdir=TD;")); }
     */
    // This may FORWARD DECLARE a node...which creates problems with coloring
    var s = r.getStart();
    if (s != undefined && s != "") {
        var fwd = getNode(yy, s);
        processANode(fwd, false);
    }
    // print only NON PRINTED container links. If first non printed link is NOT
    // for this container, break out immediately
    // this is to emulate ORDERED nodes of plantuml
    // (node=edge,node,link.group...all in order for this fucker)
    var printLinks = function printLinks(container, sbgraph) {
        for (var i in yy.LINKS) {
            if (!yy.LINKS.hasOwnProperty(i)) continue;
            var l = yy.LINKS[i];
            if (l.printed)
                continue;
            // if container given, print ONLY THOSE links that match this
            // container!
            if (l.container !== container)
                break;
            l.printed = true;
            //var attrs = [];
            var note = "";
            var label = getAttr(l, 'label');
            if (label) {
                if (label.indexOf("::") !== -1) {
                    label = label.split("::");
                    note = label[1].trim();
                    label = label[0].trim();
                }
            }
            var color = getAttrFmt(l, 'color', '[{0}]').trim();
            // getAttrFmt(l, ['textcolor','color'] ,'fontcolor="{0}"',attrs);
            var lt;
            var lr = l.right;
            var ll = l.left;

            // output(yy, indent("//"+lr));
            if (lr instanceof Group) {
                // just pick ONE Node from group and use lhead
                // TODO: Assuming it is Node (if Recursive groups implemented,
                // it could be smthg else)
                // attrs.push(" lhead=cluster_" + lr.getName());
                // TODO:
                lr = lr.OBJECTS[0];
                if (lr == undefined) {
                    // TODO:Bad thing, EMPTY group..add one invisible node
                    // there...
                    // But should add already at TOP
                }
            }
            if (ll instanceof Group) {
                // attrs.push(" ltail=cluster_" + ll.getName());
                // TODO:
                ll = ll.OBJECTS[0];
                if (ll == undefined) {
                    // Same as above
                }
            }
            // TODO:Assuming producing DIGRAPH
            // For GRAPH all edges are type --
            // but we could SET arrow type if we'd like
            if (l.linkType.indexOf("/") !== -1) {
                // TODO: Somehow denote better this "quite does not reach"
                // even though such an edge type MAKES NO SENSE in a graph
                // attrs.push('arrowhead="tee"');
                // TODO:
            }
            var dot = false;
            var dash = false;
            //var broken = false;
            if (l.linkType.indexOf(".") !== -1) {
                dot = true;
            } else if (l.linkType.indexOf("-") !== -1) {
                dash = true;
            } else if (l.linkType.indexOf("/") !== -1) {
                // attrs.push("failed");
                // TODO:
            }
            var swap = false;
            if (l.linkType.indexOf("<") !== -1 && l.linkType.indexOf(">") !== -1) {
                lt = (dot ? "-" : "") + "-" + color + ">";
                swap = true;
            } else if (l.linkType.indexOf("<") !== -1) {
                var tmp = ll;
                ll = lr;
                lr = tmp;
                lt = (dot ? "-" : "") + "-" + color + ">";
            } else if (l.linkType.indexOf(">") !== -1) {
                lt = (dot ? "-" : "") + "-" + color + ">";
            } else if (dot) {
                // dotted
                output(yy, getAttrFmt(l, 'label', '...{0}...'));
                continue;
            } else if (dash) {
                // dashed
                output(yy, getAttrFmt(l, 'label', '=={0}=='));
                continue;
            } else {
                // is dotted or dashed no direction
                lt = "-" + color + ">";
                // attrs.push("dir=none");
            }
            var t = "";
            // if (attrs.length>0)
            // t = "[" + attrs.join(",") + "]";
            if (label)
                label = ":" + label;
            else
                label = "";
            output(yy, ll.getName() + lt + lr.getName() + t + label);
            if (swap)
                output(yy, lr.getName() + lt + ll.getName() + t + label);
            if (sbgraph) {
                if (!lr.active) {
                    output(yy, "activate " + lr.getName(), true);
                    lr.active = true;
                } else {
                    ll.active = false;
                    output(false);
                    output(yy, "deactivate " + ll.getName());
                }
            } else {
                if (ll.active) {
                    ll.active = false;
                    output(false);
                    output(yy, "deactivate " + ll.getName());
                }
            }
            if (note != "") {
                output(yy, "note over " + lr.getName());
                outputFmt(yy, note.replace(/\\n/g, "\n"));
                output(yy, "end note");
            }
        }
    };

    var traverseObjects = function traverseObjects(r, isSubGraph) {
        // Dump this groups participants first...
        var i;
        var o;
        for (i in r.OBJECTS) {
            if (!r.OBJECTS.hasOwnProperty(i)) continue;
            o = r.OBJECTS[i];
            if (o instanceof Node)
                processANode(o, isSubGraph);
        }
        printLinks(r, isSubGraph);
        for (i in r.OBJECTS) {
            if (!r.OBJECTS.hasOwnProperty(i)) continue;
            o = r.OBJECTS[i];
            if (o instanceof Group) {
                // TODO:
                // Group name,OBJECTS,get/setEqual,toString
                var processAGroup = function (o) {
                    debug('processAGroup:' + JSON.stringify(o));
                    var cond = getAttr(o, 'conditional');
                    var nodeIsSubGraph = getAttr(o, 'isSubGraph');
                    if (cond) {
                        if (cond == "if")
                            cond = "alt";
                        else if (cond == "elseif")
                            cond = "else";
                        else if (cond == "else")
                            cond = "else";
                        else if (cond == "endif")
                            cond = "end";
                        output(yy, cond + ' ' + o.getLabel());
                    } else {
                        cond = "";//cond = "ref";
                    }
                    if (o.getColor() !== undefined) {
                        output(yy, "style=filled;");
                        output(yy, getAttrFmt(o, 'color',
                            '   color="{0}";\n'));
                    }
                    traverseObjects(o, nodeIsSubGraph);
                    printLinks(o);
                    // output(yy, indent("}//end of " + o.getName()));
                }(o);
            } else if (!o instanceof Node) {
                throw new Error("Not a node nor a group, NOT SUPPORTED");
            }
        }
    }(r, false);
    printLinks(r);
    output(false);
    output(yy, "@enduml");
}
