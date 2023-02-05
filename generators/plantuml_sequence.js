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
    const processANode = function (obj, sbgraph) {
        const nattrs = [];
        const styles = [];
        // getAttrFmt(o, 'color', 'fillcolor="{0}"',nattrs);
        // getAttrFmt(o,'color','filled',styles);
        getAttrFmt(obj, 'style', '{0}', styles);
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
        const shape = getShape(shapes.digraph, obj.shape, 'shape="{0}"');
        if (shape) {
            nattrs.push(shape);
        }
        let t = "";
        if (nattrs.length > 0)
            t = "[" + nattrs.join(",") + "]";
        //yy.result(indent("participant " + getAttrFmt(o, 'label', '"{0}" as') + " " + o.getName() + t));
        output(yy, "participant {0} {1} {2}".format(
            getAttrFmt(obj, 'label', '"{0}" as'),
            obj.getName(),
            t));
    };

    const root = getGraphRoot(yy);
    if (root.getVisualizer()) {
        outputFmt(yy, "/* render: {0} */", [root.getVisualizer()])
    }
    output(yy, "@startuml");
    output(yy, "autonumber", true);
    /*
     * if (r.getDirection() === "portrait") { output(yy, indent("rankdir=LR;")); }
     * else { output(yy, indent("rankdir=TD;")); }
     */
    // This may FORWARD DECLARE a node...which creates problems with coloring
    const s = root.getStart();
    if (s) {
        const fwd = getNode(yy, s);
        processANode(fwd, false);
    }
    // print only NON PRINTED container links. If first non printed link is NOT
    // for this container, break out immediately
    // this is to emulate ORDERED nodes of plantuml
    // (node=edge,node,link.group...all in order for this fucker)
    const printLinks = function printLinks(container, sbgraph) {
        for (const link of iterateLinks(yy)){
            if (link.printed)
                continue;
            // if container given, print ONLY THOSE links that match this
            // container!
            if (link.container !== container)
                break;
            link.printed = true;
            let note = "";
            let label = link.label;
            if (label) {
                if (label.indexOf("::") !== -1) {
                    label = label.split("::");
                    note = label[1].trim();
                    label = label[0].trim();
                }
            }
            const color = getAttrFmt(link, 'color', '[{0}]').trim();
            // getAttrFmt(l, ['textcolor','color'] ,'fontcolor="{0}"',attrs);
            let lt;
            let rhs = link.right;
            let lhs = link.left;

            // output(yy, indent("//"+lr));
            if (rhs instanceof Group) {
                // just pick ONE Node from group and use lhead
                // TODO: Assuming it is Node (if Recursive groups implemented,
                // it could be smthg else)
                // attrs.push(" lhead=cluster_" + lr.getName());
                // TODO:
                rhs = rhs.OBJECTS[0];
                if (!rhs) {
                    // TODO:Bad thing, EMPTY group..add one invisible node
                    // there...
                    // But should add already at TOP
                }
            }
            if (lhs instanceof Group) {
                // attrs.push(" ltail=cluster_" + ll.getName());
                // TODO:
                lhs = lhs.OBJECTS[0];
                if (!lhs ) {
                    // Same as above
                }
            }
            // TODO:Assuming producing DIGRAPH
            // For GRAPH all edges are type --
            // but we could SET arrow type if we'd like
            if (link.isBroken()) {
                // TODO: Somehow denote better this "quite does not reach"
                // even though such an edge type MAKES NO SENSE in a graph
                // attrs.push('arrowhead="tee"');
                // TODO:
            }
            const dot = link.isDotted();
            const dash = link.isDashed();
            let swap = false;
            if (link.linkType.indexOf("<") !== -1 && link.linkType.indexOf(">") !== -1) {
                lt = (dot ? "-" : "") + "-" + color + ">";
                swap = true;
            } else if (link.linkType.indexOf("<") !== -1) {
                const tmp = lhs;
                lhs = rhs;
                rhs = tmp;
                lt = (dot ? "-" : "") + "-" + color + ">";
            } else if (link.linkType.indexOf(">") !== -1) {
                lt = (dot ? "-" : "") + "-" + color + ">";
            } else if (dot) {
                // dotted
                output(yy, getAttrFmt(link, 'label', '...{0}...'));
                continue;
            } else if (dash) {
                // dashed
                output(yy, getAttrFmt(link, 'label', '=={0}=='));
                continue;
            } else {
                // is dotted or dashed no direction
                lt = "-" + color + ">";
                // attrs.push("dir=none");
            }
            let t = "";
            // if (attrs.length>0)
            // t = "[" + attrs.join(",") + "]";
            if (label)
                label = ":" + label;
            else
                label = "";
            output(yy, lhs.getName() + lt + rhs.getName() + t + label);
            if (swap)
                output(yy, rhs.getName() + lt + lhs.getName() + t + label);
            if (sbgraph) {
                if (!rhs.active) {
                    output(yy, "activate " + rhs.getName(), true);
                    rhs.active = true;
                } else {
                    lhs.active = false;
                    output(false);
                    output(yy, "deactivate " + lhs.getName());
                }
            } else {
                if (lhs.active) {
                    lhs.active = false;
                    output(false);
                    output(yy, "deactivate " + lhs.getName());
                }
            }
            if (note != "") {
                output(yy, "note over " + rhs.getName());
                outputFmt(yy, note.replace(/\\n/g, "\n"));
                output(yy, "end note");
            }
        }
    };

    const traverseObjects = function traverseObjects(root, isSubGraph) {
        // Dump this groups participants first...
        for (const i in root.OBJECTS) {
            if (!root.OBJECTS.hasOwnProperty(i)) continue;
            const obj = root.OBJECTS[i];
            if (obj instanceof Node)
                processANode(obj, isSubGraph);
        }
        printLinks(root, isSubGraph);
        for (const i in root.OBJECTS) {
            if (!root.OBJECTS.hasOwnProperty(i)) continue;
            const obj = root.OBJECTS[i];
            if (obj instanceof Group) {
                // TODO:
                // Group name,OBJECTS,get/setEqual,toString
                const processAGroup = function (o) {
                    debug('processAGroup:' + JSON.stringify(o));
                    let cond = o.conditional;
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
                    const nodeIsSubGraph = o.isSubGraph;
                    if (o.getColor()) {
                        output(yy, "style=filled;");
                        output(yy, getAttrFmt(o, 'color',
                            '   color="{0}";\n'));
                    }
                    traverseObjects(o, nodeIsSubGraph);
                    printLinks(o);
                    // output(yy, indent("}//end of " + o.getName()));
                }(obj);
            } else if (!obj instanceof Node) {
                throw new Error("Not a node nor a group, NOT SUPPORTED");
            }
        }
    }(root, false);
    printLinks(root);
    output(false);
    output(yy, "@enduml");
}
