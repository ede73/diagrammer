const PlantUMLShapeMap = {
    default: "box",
    invis: "invis",
    record: "record",
    doublecircle: "doublecircle",
    box: "box",
    rect: "box",
    rectangle: "box",
    square: "square",
    roundedbox: "box",
    dots: "point",
    circle: "circle",
    ellipse: "ellipse",
    diamond: "diamond",
    minidiamond: "Mdiamond",
    minisquare: "Msquare",
    note: "note",
    mail: "tab",
    cloud: "tripleoctagon",
    actor: "cds",
    beginpoint: "circle",
    endpoint: "doublecircle",
    condition: "MDiamond",
    database: "Mcircle",
    terminator: "ellipse",
    input: "parallelogram",
    loopin: "house",
    loop: "house",
    loopstart: "house",
    loopout: "invhouse",
    loopend: "invhouse",
};
/**
a>b>c,d
a>e;edge text
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
a->e:edge text
@enduml

node js/parse.js verbose plantuml_sequence.test plantuml_sequence
@param {GraphMeta} graphmeta
*/
function plantuml_sequence(graphmeta) {
    const processAVertex = function (obj, sbgraph) {
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

        if (obj.shape && !PlantUMLShapeMap[obj.shape]) {
            throw new Error("Missing shape mapping");
        }
        if (obj.shape) {
            const shape = 'shape="{0}"'.format(PlantUMLShapeMap[obj.shape]);
            nattrs.push(shape);
        }
        let t = "";
        if (nattrs.length > 0)
            t = "[" + nattrs.join(",") + "]";
        //graphmeta.result(indent("participant " + getAttrFmt(o, 'label', '"{0}" as') + " " + o.getName() + t));
        output(graphmeta, "participant {0} {1} {2}".format(
            getAttrFmt(obj, 'label', '"{0}" as'),
            obj.getName(),
            t));
    };

    const root = graphmeta.GRAPHROOT;
    if (root.getVisualizer()) {
        outputFmt(graphmeta, "/* render: {0} */", [root.getVisualizer()])
    }
    output(graphmeta, "@startuml");
    output(graphmeta, "autonumber", true);
    /*
     * if (r.getDirection() === "portrait") { output(graphmeta, indent("rankdir=LR;")); }
     * else { output(graphmeta, indent("rankdir=TD;")); }
     */
    // This may FORWARD DECLARE a node...which creates problems with coloring
    const s = root.getStart();
    if (s) {
        const fwd = getVertex(graphmeta.yy, s);
        processAVertex(fwd, false);
    }
    /**
     * print only NON PRINTED container edges. If first non printed edge is NOT
     * for this container, break out immediately
     * this is to emulate ORDERED nodes of plantuml
     * (node=edge,node,edge.group...all in order for this fucker)
     * @param {GraphRoot|Group} container 
     * @param {boolean} sbgraph 
     */
    const printEdges = function printEdges(container, sbgraph) {
        for (const edge of iterateEdges(graphmeta)) {
            if (edge.printed)
                continue;
            // if container given, print ONLY THOSE edges that match this
            // container!
            if (edge.container !== container)
                break;
            edge.printed = true;
            let note = "";
            let label = edge.label;
            if (label) {
                if (label.indexOf("::") !== -1) {
                    label = label.split("::");
                    note = label[1].trim();
                    label = label[0].trim();
                }
            }
            const color = getAttrFmt(edge, 'color', '[{0}]').trim();
            // getAttrFmt(l, ['textcolor','color'] ,'fontcolor="{0}"',attrs);
            let lt;
            let rhs = edge.right;
            let lhs = edge.left;

            // output(graphmeta, indent("//"+lr));
            if (rhs instanceof Group) {
                // just pick ONE Vertex from group and use lhead
                // TODO: Assuming it is Vertex (if Recursive groups implemented,
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
                if (!lhs) {
                    // Same as above
                }
            }
            // TODO:Assuming producing DIGRAPH
            // For GRAPH all edges are type --
            // but we could SET arrow type if we'd like
            if (edge.isBroken()) {
                // TODO: Somehow denote better this "quite does not reach"
                // even though such an edge type MAKES NO SENSE in a graph
                // attrs.push('arrowhead="tee"');
                // TODO:
            }
            const dot = edge.isDotted();
            const dash = edge.isDashed();
            let swap = false;
            if (edge.edgeType.indexOf("<") !== -1 && edge.edgeType.indexOf(">") !== -1) {
                lt = (dot ? "-" : "") + "-" + color + ">";
                swap = true;
            } else if (edge.edgeType.indexOf("<") !== -1) {
                const tmp = lhs;
                lhs = rhs;
                rhs = tmp;
                lt = (dot ? "-" : "") + "-" + color + ">";
            } else if (edge.edgeType.indexOf(">") !== -1) {
                lt = (dot ? "-" : "") + "-" + color + ">";
            } else if (dot) {
                // dotted
                output(graphmeta, getAttrFmt(edge, 'label', '...{0}...'));
                continue;
            } else if (dash) {
                // dashed
                output(graphmeta, getAttrFmt(edge, 'label', '=={0}=='));
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
            output(graphmeta, lhs.getName() + lt + rhs.getName() + t + label);
            if (swap)
                output(graphmeta, rhs.getName() + lt + lhs.getName() + t + label);
            if (sbgraph) {
                if (!rhs.active) {
                    output(graphmeta, "activate " + rhs.getName(), true);
                    rhs.active = true;
                } else {
                    lhs.active = false;
                    output(false);
                    output(graphmeta, "deactivate " + lhs.getName());
                }
            } else {
                if (lhs.active) {
                    lhs.active = false;
                    output(false);
                    output(graphmeta, "deactivate " + lhs.getName());
                }
            }
            if (note != "") {
                output(graphmeta, "note over " + rhs.getName());
                outputFmt(graphmeta, note.replace(/\\n/g, "\n"));
                output(graphmeta, "end note");
            }
        }
    };

    const traverseObjects = function traverseObjects(root, isSubGraph) {
        // Dump this groups participants first...
        for (const i in root.OBJECTS) {
            if (!root.OBJECTS.hasOwnProperty(i)) continue;
            const obj = root.OBJECTS[i];
            if (obj instanceof Vertex)
                processAVertex(obj, isSubGraph);
        }
        printEdges(root, isSubGraph);
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
                        output(graphmeta, cond + ' ' + o.getLabel());
                    } else {
                        cond = "";//cond = "ref";
                    }
                    const nodeIsSubGraph = o.isSubGraph;
                    if (o.getColor()) {
                        output(graphmeta, "style=filled;");
                        output(graphmeta, getAttrFmt(o, 'color',
                            '   color="{0}";\n'));
                    }
                    traverseObjects(o, nodeIsSubGraph);
                    printEdges(o);
                    // output(graphmeta, indent("}//end of " + o.getName()));
                }(obj);
            } else if (!obj instanceof Vertex) {
                throw new Error("Not a node nor a group, NOT SUPPORTED");
            }
        }
    }(root, false);
    printEdges(root);
    output(false);
    output(graphmeta, "@enduml");
}
generators.set('plantuml_sequence', plantuml_sequence);