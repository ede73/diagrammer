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
//node js/parse.js state2.txt actdiag |actdiag -Tpng -o a.png - && open a.png
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
node js/parse.js verbose nwdiag.test nwdiag
@param {GraphMeta} graphmeta
*/
function nwdiag(graphmeta) {
    graphmeta.result("nwdiag{\n default_fontsize = 16\n");
    const r = graphmeta.GRAPHROOT;
    for (const i in r.OBJECTS) {
        if (!r.OBJECTS.hasOwnProperty(i)) continue;
        const obj = r.OBJECTS[i];
        if (obj instanceof Group) {
            // split the label to two, NAME and address
            graphmeta.result('  network ' + obj.getName() + '{');
            if (obj.getLabel() != "")
                graphmeta.result('    address="' + obj.getLabel() + '"');
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
                graphmeta.result("    " + z.getName() + tmp + ';');
            }
            // find if there are ANY edges that have this GROUP as participant!
            for (const il in graphmeta.EDGES) {
                if (!graphmeta.EDGES.hasOwnProperty(il)) continue;
                const edge = graphmeta.EDGES[il];
                tmp = getAttributeAndFormat(edge, 'label', '[address="{0}"]');
                if (edge.left == obj) {
                    graphmeta.result("  " + edge.right.getName() + tmp + ";");
                }
                if (edge.right == obj) {
                    graphmeta.result("  " + edge.left.getName() + tmp + ";");
                }
            }
            graphmeta.result("  }");
        } else {
            if (obj.shape && !NetworkDiagShapeMap[obj.shape]) {
                throw new Error("Missing shape mapping");
            }
            const mappedShape = NetworkDiagShapeMap[obj.shape] ? NetworkDiagShapeMap[obj.shape] : ActDiagShapeMap['default'];
            // ICON does not work, using background
            let tmp = getAttributeAndFormat(obj, 'color', ',color="{0}"') +
                getAttributeAndFormat(obj, 'image', ',background="icons{0}"') + ',shape="{0}"'.format(mappedShape) +
                getAttributeAndFormat(obj, 'label', ',label="{0}"');
            if (tmp.trim() != "")
                tmp = "[" + tmp.trim().substring(1) + "]";
            graphmeta.result("    " + obj.getName() + tmp + ';');
        }
    }

    traverseEdges(graphmeta, edge => {
        if (!(edge.left instanceof Group || edge.right instanceof Group)) {
            graphmeta.result(edge.left.getName() + " -- " + edge.right.getName() + ";");
        }
    });
    graphmeta.result("}");
}
generators.set('nwdiag', nwdiag);