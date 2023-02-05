//http://blockdiag.com/en/blockdiag/examples.html#simple-diagram
//node js/parse.js state2.txt blockdiag |blockdiag -Tpng -o a.png - && open a.png
//available shapes
//box,square,roundedbox,dots
//circle,ellipse,diamond,minidiamond
//note,mail,cloud,actor
//flowchart.beginpoint,flowchart.endpoint
//flowchart.condition,flowchart.database,flowchart.terminator,flowchart.input
//flowchart.loopin,flowchart.loopout
/*
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
*/
function blockdiag(yy) {
    output(yy, "blockdiag{\n default_fontsize = 14");
    const root = getGraphRoot(yy);
    if (root.getDirection() === "portrait") {
        output(yy, "  orientation=portrait");
    } else {
        // DEFAULT
        output(yy, "  orientation=landscape");
    }
    let tmp = root.getStart();
    const parseObjects = function (obj) {
        output(true);
        if (obj instanceof Group) {
            output(yy, ' group "' + obj.getLabel() + '"{', true);
            output(yy, getAttrFmt(obj, 'color', '   color="{0}"'));
            output(yy, getAttrFmt(obj, 'label', '   label="{0}"'));
            if (tmp && tmp.trim() != "")
                tmp = "[" + tmp.trim().substring(1) + "]";
            traverseObjects(obj, function (z) {
                const tmp = getAttrFmt(z, 'color', ',color="{0}"') +
                    getShape(shapes.blockdiag, z.shape, ',shape={0}') +
                    getAttrFmt(z, 'label', ',label="{0}"');
                if (tmp.trim() != "")
                    tmp = "[" + tmp.trim().substring(1) + "]";
                output(yy, z.getName() + tmp + ';');
            });
            output(false);
            output(yy, "}");
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
            output(yy, obj.getName() + colorIconShapeLabel + ';');
        }
        output(false);
    };

    traverseObjects(root, parseObjects);

    traverseLinks(yy,  (link)=> {
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
        output(yy, "  " + link.left.getName() + " -> " + link.right.getName() + t + ";");
    });
    output(yy, "}");
}
