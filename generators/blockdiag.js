//http://blockdiag.com/en/blockdiag/examples.html#simple-diagram
//node js/parse.js state2.txt blockdiag |blockdiag -Tpng -o a.png - && open a.png
//available shapes
//box,square,roundedbox,dots
//circle,ellipse,diamond,minidiamond
//note,mail,cloud,actor
//flowchart.beginpoint,flowchart.endpoint
//flowchart.condition,flowchart.database,flowchart.terminator,flowchart.input
//flowchart.loopin,flowchart.loopout
/**
a>b>c,d
a>e;link text
a;node text

to
blockdiag{
 default_fontsize = 14
  orientation=landscape
a[label="node text"];
b;
c;
d;
e;
  a -> b;
  b -> c;
  b -> d;
  a -> e[label = "link text"];
}
node js/parse.js verbose blockdiag.test blockdiag
@param {GraphMeta} graphmeta
*/
function blockdiag(graphmeta) {
    output(graphmeta, "blockdiag{\n default_fontsize = 14");
    const root = graphmeta.GRAPHROOT;
    if (root.getDirection() === "portrait") {
        output(graphmeta, "  orientation=portrait");
    } else {
        // DEFAULT
        output(graphmeta, "  orientation=landscape");
    }
    let tmp = root.getStart();

    /**
     * @param {(Node|Group)} obj
     */
    const parseObjects = (obj)=> {
        output(true);
        if (obj instanceof Group) {
            output(graphmeta, ' group "' + obj.getLabel() + '"{', true);
            output(graphmeta, getAttrFmt(obj, 'color', '   color="{0}"'));
            output(graphmeta, getAttrFmt(obj, 'label', '   label="{0}"'));
            if (tmp && tmp.trim() != "")
                tmp = "[" + tmp.trim().substring(1) + "]";
            traverseObjects(obj, function (z) {
                const tmp = getAttrFmt(z, 'color', ',color="{0}"') +
                    getShape(shapes.blockdiag, z.shape, ',shape={0}') +
                    getAttrFmt(z, 'label', ',label="{0}"');
                if (tmp.trim() != "")
                    tmp = "[" + tmp.trim().substring(1) + "]";
                output(graphmeta, z.getName() + tmp + ';');
            });
            output(false);
            output(graphmeta, "}");
        } else {
            // dotted,dashed,solid
            // NOT invis,bold,rounded,diagonals
            // ICON does not work, using background
            let style = getAttrFmt(obj, 'style', ',style="{0}"');
            if (style != "" && style.match(/(dotted|dashed|solid)/) == null) {
                style = "";
            }

            let colorIconShapeLabel = getAttrFmt(obj, 'color', ',color="{0}"') +
                getAttrFmt(obj, 'image', ',background="icons{0}"') +
                style +
                getShape(shapes.blockdiag, obj.shape, ',shape="{0}"') +
                getAttrFmt(obj, 'label', ',label="{0}"');
            if (colorIconShapeLabel.trim() != "")
                colorIconShapeLabel = "[" + colorIconShapeLabel.trim().substring(1) + "]";
            output(graphmeta, obj.getName() + colorIconShapeLabel + ';');
        }
        output(false);
    };

    traverseObjects(root, parseObjects);

    traverseLinks(graphmeta , (link)=> {
        let t = "";
        if (link.isDotted()) {
            t += ',style="dotted" ';
        } else if (link.isDashed()) {
            t += ',style="dashed" ';
        }
        const labelAndItsColor = getAttrFmt(link, 'label', ',label = "{0}"' + getAttrFmt(link, ['color', 'textcolor'], 'textcolor="{0}"'));
        const color = getAttrFmt(link, 'color', ',color="{0}"');
        t += labelAndItsColor + color;
        t = t.trim();
        if (t.substring(0, 1) == ",")
            t = t.substring(1).trim();
        if (t != "")
            t = "[" + t + "]";
        output(graphmeta, "  " + link.left.getName() + " -> " + link.right.getName() + t + ";");
    });
    output(graphmeta, "}");
}
generators.set('blockdiag', blockdiag);