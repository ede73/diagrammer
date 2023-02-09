import { generators } from '../model/graphcanvas.js';
import { getAttributeAndFormat } from '../model/support.js';
import { traverseEdges } from '../model/model.js';
import { GraphGroup } from '../model/graphgroup.js';

const NetworkDiagShapeMap =
{
    default: "box",
    invis: "invis",
    record: "box",
    doublecircle: "endpoint",
    box: "box",
    rect: "box",
    rectangle: "box",
    square: "square",
    roundedbox: "roundedbox",
    dots: "dots",
    circle: "circle",
    ellipse: "ellipse",
    diamond: "diamond",
    minidiamond: "minidiamond",
    minisquare: "minidiamond",
    note: "note",
    mail: "mail",
    cloud: "cloud",
    actor: "actor",
    beginpoint: "flowchart.beginpoint",
    endpoint: "flowchart.endpoint",
    condition: "flowchart.condition",
    database: "flowchart.database",
    terminator: "flowchart.terminator",
    input: "flowchart.input",
    loopin: "flowchart.loopin",
    loop: "flowchart.loop",
    loopstart: "flowchart.loopin",
    loopout: "flowchart.loopout",
    loopend: "flowchart.loopout",
};
//node js/diagrammer.js state2.txt actdiag |actdiag -Tpng -o a.png - && open a.png
/**
a>b>c,d
a>e;edge text
a;node text

to
nwdiag{
 default_fontsize = 16

    a[label="node text"];
    b;
    c;
    d;
    e;
a -- b;
b -- c;
b -- d;
a -- e;
}

http://blockdiag.com/en/nwdiag/

node js/diagrammer.js verbose nwdiag.test nwdiag
@param {GraphCanvas} graphcanvas
*/
export function nwdiag(graphcanvas) {
    graphcanvas.result("nwdiag{\n default_fontsize = 16\n");
    for (const i in graphcanvas.OBJECTS) {
        if (!graphcanvas.OBJECTS.hasOwnProperty(i)) continue;
        const obj = graphcanvas.OBJECTS[i];
        if (obj instanceof GraphGroup) {
            // split the label to two, NAME and address
            graphcanvas.result('  network ' + obj.getName() + '{');
            if (obj.getLabel() != "")
                graphcanvas.result('    address="' + obj.getLabel() + '"');
            for (const j in obj.OBJECTS) {
                if (!obj.OBJECTS.hasOwnProperty(j)) continue;
                const z = obj.OBJECTS[j];

                if (z.shape && !NetworkDiagShapeMap[z.shape]) {
                    throw new Error("Missing shape mapping");
                }
                const mappedShape = NetworkDiagShapeMap[z.shape] ? NetworkDiagShapeMap[z.shape] : NetworkDiagShapeMap['default'];

                let tmp = getAttributeAndFormat(z, 'color', ',color="{0}"') + ',shape="{0}"'.format(mappedShape) +
                    getAttributeAndFormat(z, 'label', ',address="{0}"');
                if (tmp.trim() != "")
                    tmp = "[" + tmp.trim().substring(1) + "]";
                graphcanvas.result("    " + z.getName() + tmp + ';');
            }
            // find if there are ANY edges that have this GROUP as participant!
            for (const il in graphcanvas.EDGES) {
                if (!graphcanvas.EDGES.hasOwnProperty(il)) continue;
                const edge = graphcanvas.EDGES[il];
                let tmp = getAttributeAndFormat(edge, 'label', '[address="{0}"]');
                if (edge.left == obj) {
                    graphcanvas.result("  " + edge.right.getName() + tmp + ";");
                }
                if (edge.right == obj) {
                    graphcanvas.result("  " + edge.left.getName() + tmp + ";");
                }
            }
            graphcanvas.result("  }");
        } else {
            if (obj.shape && !NetworkDiagShapeMap[obj.shape]) {
                throw new Error("Missing shape mapping");
            }
            const mappedShape = NetworkDiagShapeMap[obj.shape] ? NetworkDiagShapeMap[obj.shape] : NetworkDiagShapeMap['default'];
            // ICON does not work, using background
            let tmp = getAttributeAndFormat(obj, 'color', ',color="{0}"') +
                getAttributeAndFormat(obj, 'image', ',background="icons{0}"') + ',shape="{0}"'.format(mappedShape) +
                getAttributeAndFormat(obj, 'label', ',label="{0}"');
            if (tmp.trim() != "")
                tmp = "[" + tmp.trim().substring(1) + "]";
            graphcanvas.result("    " + obj.getName() + tmp + ';');
        }
    }

    traverseEdges(graphcanvas, edge => {
        if (!(edge.left instanceof GraphGroup || edge.right instanceof GraphGroup)) {
            graphcanvas.result(edge.left.getName() + " -- " + edge.right.getName() + ";");
        }
    });
    graphcanvas.result("}");
}
generators.set('nwdiag', nwdiag);