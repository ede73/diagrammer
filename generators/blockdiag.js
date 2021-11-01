//http://blockdiag.com/en/blockdiag/examples.html#simple-diagram
//node parse.js state2.txt blockdiag |blockdiag -Tpng -o a.png - && open a.png
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
node parse.js verbose blockdiag.test blockdiag
*/
function blockdiag(yy) {
    output(yy, "blockdiag{\n default_fontsize = 14");
    var r = getGraphRoot(yy);
    if (r.getDirection() === "portrait") {
        output(yy, "  orientation=portrait");
    } else {
        // DEFAULT
        output(yy, "  orientation=landscape");
    }
    var tmp = r.getStart();
    var parseObjects = function (o) {
        output(true);
        if (o instanceof Group) {
            output(yy, ' group "' + o.getLabel() + '"{', true);
            output(yy, getAttrFmt(o, 'color', '   color="{0}"'));
            output(yy, getAttrFmt(o, 'label', '   label="{0}"'));
            if (tmp !== undefined && tmp.trim() != "")
                tmp = "[" + tmp.trim().substring(1) + "]";
            traverseObjects(o, function (z) {
                tmp = getAttrFmt(z, 'color', ',color="{0}"') +
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
            var style = getAttrFmt(o, 'style', ',style="{0}"');
            if (style != "" && style.match(/(dotted|dashed|solid)/) == null) {
                style = "";
            }

            var s = getAttrFmt(o, 'color', ',color="{0}"') +
                getAttrFmt(o, 'image', ',background="icons{0}"') +
                style +
                getShape(shapes.blockdiag, o.shape, ',shape="{0}"') +
                getAttrFmt(o, 'label', ',label="{0}"');
            if (s.trim() != "")
                s = "[" + s.trim().substring(1) + "]";
            output(yy, o.getName() + s + ';');
        }
        output(false);
    };

    traverseObjects(r, parseObjects);

    traverseLinks(yy, function (l) {
        var t = "";
        if (l.linkType.indexOf(".") !== -1) {
            t += ',style="dotted" ';
        } else if (l.linkType.indexOf("-") !== -1) {
            t += ',style="dashed" ';
        }
        var lbl = getAttrFmt(l, 'label', ',label = "{0}"' + getAttrFmt(l, ['color', 'textcolor'], 'textcolor="{0}"'));
        var color = getAttrFmt(l, 'color', ',color="{0}"');
        t += lbl + color;
        t = t.trim();
        if (t.substring(0, 1) == ",")
            t = t.substring(1).trim();
        if (t != "")
            t = "[" + t + "]";
        output(yy, "  " + l.left.getName() + " -> " + l.right.getName() + t + ";");
    });
    output(yy, "}");
}
