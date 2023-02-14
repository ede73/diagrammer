import { generators } from '../model/graphcanvas.js';
import { GraphConnectable } from '../model/graphconnectable.js';
import { GraphGroup } from '../model/graphgroup.js';
import { GraphVertex } from '../model/graphvertex.js';
import { debug, getAttributeAndFormat, iterateEdges, output, outputFormattedText } from '../model/support.js';

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
 *
 * node js/diagrammer.js verbose tests/test_inputs/events.txt plantuml_sequence | java -Xmx2048m -jar ext/plantuml.jar -tpng -pipe > output.png && open output.png
 * @param {GraphCanvas} graphcanvas
*/
export function plantuml_sequence(graphcanvas) {
    const processAVertex = function (obj, sbgraph) {
        const nattrs = [];
        const styles = [];

        getAttributeAndFormat(obj, 'style', '{0}', styles);
        if (styles.length > 0) {
            if (styles.join("").indexOf('singularity') !== -1) {
                // invis node is not singularity!, circle with minimal
                // width/height IS!
                nattrs.push('shape="circle"');
                nattrs.push('label=""');
                nattrs.push("width=0.01");
                nattrs.push("weight=0.01");
            } else {
                nattrs.push(`style="${styles.join(",")}"`);
            }
        }
        getAttributeAndFormat(obj, 'image', 'image="icons{0}"', nattrs);
        getAttributeAndFormat(obj, 'textcolor', 'fontcolor="{0}"', nattrs);

        if (obj.shape && !PlantUMLShapeMap[obj.shape]) {
            throw new Error("Missing shape mapping");
        }
        if (obj.shape) {
            const shape = 'shape="{0}"'.format(PlantUMLShapeMap[obj.shape]);
            nattrs.push(shape);
        }
        let t = "";
        if (nattrs.length > 0)
            t = `[${nattrs.join(",")}]`;
        output(graphcanvas, "participant {0} {1} {2}".format(
            getAttributeAndFormat(obj, 'label', '"{0}" as'),
            obj.getName(),
            t));
    };

    output(graphcanvas, "@startuml");
    output(graphcanvas, "autonumber", true);
    /*
     * if (r.getDirection() === "portrait") { output(graphcanvas, indent("rankdir=LR;")); }
     * else { output(graphcanvas, indent("rankdir=TD;")); }
     */
    // This may FORWARD DECLARE a node...which creates problems with coloring
    const s = graphcanvas.getStart();
    if (s) {
        const fwd = getVertex(graphcanvas.yy, s);
        processAVertex(fwd, false);
    }
    /**
     * print only NON PRINTED container edges. If first non printed edge is NOT
     * for this container, break out immediately
     * this is to emulate ORDERED nodes of plantuml
     * (node=edge,node,edge.group...all in order for this fucker)
     * @param {GraphConnectable} container 
     * @param {boolean} sbgraph 
     */
    const printEdges = (container, sbgraph) => {
        for (const edge of iterateEdges(graphcanvas)) {
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
            const color = getAttributeAndFormat(edge, 'color', '[{0}]').trim();
            let lt;
            let rhs = edge.right;
            let lhs = edge.left;

            // output(graphcanvas, indent("//"+lr));
            if (rhs instanceof GraphGroup) {
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
            if (lhs instanceof GraphGroup) {
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
                output(graphcanvas, getAttributeAndFormat(edge, 'label', '...{0}...'));
                continue;
            } else if (dash) {
                // dashed
                output(graphcanvas, getAttributeAndFormat(edge, 'label', '=={0}=='));
                continue;
            } else {
                // is dotted or dashed no direction
                lt = `-${color}>`;
            }
            let t = "";
            if (label)
                label = `:${label}`;
            else
                label = "";
            output(graphcanvas, lhs.getName() + lt + rhs.getName() + t + label);
            if (swap)
                output(graphcanvas, rhs.getName() + lt + lhs.getName() + t + label);
            if (sbgraph) {
                if (!rhs.active) {
                    output(graphcanvas, `activate ${rhs.getName()}`, true);
                    rhs.active = true;
                } else {
                    lhs.active = false;
                    output(false);
                    output(graphcanvas, `deactivate ${lhs.getName()}`);
                }
            } else {
                if (lhs.active) {
                    lhs.active = false;
                    output(false);
                    output(graphcanvas, `deactivate ${lhs.getName()}`);
                }
            }
            if (note != "") {
                output(graphcanvas, `note over ${rhs.getName()}`);
                outputFormattedText(graphcanvas, note.replace(/\\n/g, "\n"));
                output(graphcanvas, "end note");
            }
        }
    };

    const traverseVertices = (/** @type {GraphConnectable}*/root, /** @type {boolean}*/isInnerGraph) => {
        // Dump this groups participants first...
        for (const i in root.OBJECTS) {
            if (!root.OBJECTS.hasOwnProperty(i)) continue;
            const obj = root.OBJECTS[i];
            if (obj instanceof GraphVertex)
                processAVertex(obj, isInnerGraph);
        }
        printEdges(root, isInnerGraph);
        for (const i in root.OBJECTS) {
            if (!root.OBJECTS.hasOwnProperty(i)) continue;
            const obj = root.OBJECTS[i];
            if (obj instanceof GraphGroup) {
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
                        output(graphcanvas, cond + ' ' + o.getLabel());
                    } else {
                        cond = "";//cond = "ref";
                    }
                    const nodeIsSubGraph = o.isInnerGraph;
                    if (o.getColor()) {
                        output(graphcanvas, "style=filled;");
                        output(graphcanvas, getAttributeAndFormat(o, 'color',
                            '   color="{0}";\n'));
                    }
                    traverseVertices(o, nodeIsSubGraph);
                    printEdges(o);
                }(obj);
            } else if (!obj instanceof GraphVertex) {
                throw new Error("Not a node nor a group, NOT SUPPORTED");
            }
        }
    };
    traverseVertices(graphcanvas, false);
    printEdges(graphcanvas);
    output(false);
    output(graphcanvas, "@enduml");
}
generators.set('plantuml_sequence', plantuml_sequence);