const ActDiagShapeMap =
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
actdiag{
  default_fontsize = 14
a[label="node text"];
b;
c;
d;
e;
  a -> b;
  b -> c;
  b -> d;
  a -> e[label = "edge text"];
}
@param {GraphMeta} graphmeta
*/
function actdiag(graphmeta) {
    output(graphmeta, "actdiag{\n  default_fontsize = 14");
    const r = graphmeta.GRAPHROOT;
    /**
     * does not really work..but portrait mode if
     * (r.getDirection()==="portrait"){ output(graphmeta," orientation=portrait");
     * }else{ //DEFAULT output(graphmeta," orientation=landscape"); }
     * @param {(Vertex|Group)} obj
     */
    const parseObjects = (obj) => {
        output(true);
        if (obj instanceof Group) {
            output(graphmeta, 'lane "' + obj.getName() + '"{', true);
            traverseVertices(obj, (obj) => {
                if (obj.shape && !ActDiagShapeMap[obj.shape]) {
                    throw new Error("Missing shape mapping");
                }
                const mappedShape = ActDiagShapeMap[obj.shape] ? ActDiagShapeMap[obj.shape] : ActDiagShapeMap['default'];

                let colorShapeLabel = getAttributeAndFormat(obj, 'color', ',color="{0}"') +
                    ',shape={0}'.format(mappedShape) +
                    getAttributeAndFormat(z, 'label', ',label="{0}"');
                if (colorShapeLabel.trim() != "") {
                    colorShapeLabel = "[" + colorShapeLabel.trim().substring(1) + "]";
                }
                output(graphmeta, z.getName() + colorShapeLabel + ';');
            });
            output(false);
            output(graphmeta, "}");
        } else {
            // dotted,dashed,solid
            // NOT invis,bold,rounded,diagonals
            // ICON does not work, using background
            let style = getAttributeAndFormat(obj, 'style', ',style="{0}"');
            if (style != "" && style.match(/(dotted|dashed|solid)/) == null) {
                style = "";
            }

            if (obj.shape && !ActDiagShapeMap[obj.shape]) {
                throw new Error("Missing shape mapping");
            }
            const mappedShape = ActDiagShapeMap[obj.shape] ? ActDiagShapeMap[obj.shape] : ActDiagShapeMap['default'];

            // ICON does not work, using background
            let colorIconShapeLabel = getAttributeAndFormat(obj, 'color', ',color="{0}"') +
                getAttributeAndFormat(obj, 'image', ',background="icons{0}"') +
                style +
                ',shape={0}'.format(mappedShape) +
                getAttributeAndFormat(obj, 'label', ',label="{0}"');
            if (colorIconShapeLabel.trim() != "")
                colorIconShapeLabel = "[" + colorIconShapeLabel.trim().substring(1) + "]";
            output(graphmeta, obj.getName() + colorIconShapeLabel + ';');
        }
        output(false);
    };
    traverseVertices(r, parseObjects);

    traverseEdges(graphmeta, (edge) => {
        let t = "";
        if (edge.isDotted()) {
            t += ',style="dotted" ';
        } else if (edge.isDashed()) {
            t += ',style="dashed" ';
        }
        const labelAndItsColor = getAttributeAndFormat(edge, 'label', ',label = "{0}"' + getAttributeAndFormat(edge, ['color', 'textcolor'], 'textcolor="{0}"'));
        const color = getAttributeAndFormat(edge, 'color', ',color="{0}"');
        t += labelAndItsColor + color;
        t = t.trim();
        if (t.substring(0, 1) == ",")
            t = t.substring(1).trim();
        if (t != "")
            t = "[" + t + "]";
        output(graphmeta, "  " + edge.left.getName() + " -> " + edge.right.getName() + t + ";");
    });
    output(graphmeta, "}");
}
generators.set('actdiag', actdiag);