//node js/parse.js state2.txt actdiag |actdiag -Tpng -o a.png - && open a.png
/**
a>b>c,d
a>e;link text
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
  a -> e[label = "link text"];
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
            traverseObjects(obj, (z) => {
                let colorShapeLabel = getAttrFmt(z, 'color', ',color="{0}"') +
                    getShape(shapes.actdiag, z.shape, ',shape={0}') +
                    getAttrFmt(z, 'label', ',label="{0}"');
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
            let style = getAttrFmt(obj, 'style', ',style="{0}"');
            if (style != "" && style.match(/(dotted|dashed|solid)/) == null) {
                style = "";
            }

            // ICON does not work, using background
            let colorIconShapeLabel = getAttrFmt(obj, 'color', ',color="{0}"') +
                getAttrFmt(obj, 'image', ',background="icons{0}"') +
                style +
                getShape(shapes.actdiag, obj.shape, ',shape={0}') +
                getAttrFmt(obj, 'label', ',label="{0}"');
            if (colorIconShapeLabel.trim() != "")
                colorIconShapeLabel = "[" + colorIconShapeLabel.trim().substring(1) + "]";
            output(graphmeta, obj.getName() + colorIconShapeLabel + ';');
        }
        output(false);
    };
    traverseObjects(r, parseObjects);

    traverseLinks(graphmeta, (link) => {
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
generators.set('actdiag', actdiag);