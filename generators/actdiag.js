//node js/parse.js state2.txt actdiag |actdiag -Tpng -o a.png - && open a.png
/*
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
*/
function actdiag(yy) {
    output(yy, "actdiag{\n  default_fontsize = 14");
    var r = getGraphRoot(yy);
    /*
     * does not really work..but portrait mode if
     * (r.getDirection()==="portrait"){ output(yy," orientation=portrait");
     * }else{ //DEFAULT output(yy," orientation=landscape"); }
     */
    //var s = r.getStart();
    var i;
    var parseObjects = function (obj) {
        output(true);
        if (obj instanceof Group) {
            output(yy, 'lane "' + obj.getName() + '"{', true);
            traverseObjects(obj, function (z) {
                var colorShapeLabel = getAttrFmt(z, 'color', ',color="{0}"') +
                    getShape(shapes.actdiag, z.shape, ',shape={0}') +
                    getAttrFmt(z, 'label', ',label="{0}"');
                if (colorShapeLabel.trim() != "") {
                    colorShapeLabel = "[" + colorShapeLabel.trim().substring(1) + "]";
                }
                output(yy, z.getName() + colorShapeLabel + ';');
            });
            output(false);
            output(yy, "}");
        } else {
            // dotted,dashed,solid
            // NOT invis,bold,rounded,diagonals
            // ICON does not work, using background
            var style = getAttrFmt(obj, 'style', ',style="{0}"');
            if (style != "" && style.match(/(dotted|dashed|solid)/) == null) {
                style = "";
            }

            // ICON does not work, using background
            var colorIconShapeLabel = getAttrFmt(obj, 'color', ',color="{0}"') +
                getAttrFmt(obj, 'image', ',background="icons{0}"') +
                style +
                getShape(shapes.actdiag, obj.shape, ',shape={0}') +
                getAttrFmt(obj, 'label', ',label="{0}"');
            if (colorIconShapeLabel.trim() != "")
                colorIconShapeLabel = "[" + colorIconShapeLabel.trim().substring(1) + "]";
            output(yy, obj.getName() + colorIconShapeLabel + ';');
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
        var labelAndItsColor = getAttrFmt(l, 'label', ',label = "{0}"' + getAttrFmt(l, ['color', 'textcolor'], 'textcolor="{0}"'));
        var color = getAttrFmt(l, 'color', ',color="{0}"');
        t += labelAndItsColor + color;
        t = t.trim();
        if (t.substring(0, 1) == ",")
            t = t.substring(1).trim();
        if (t != "")
            t = "[" + t + "]";
        output(yy, "  " + l.left.getName() + " -> " + l.right.getName() + t + ";");
    });
    output(yy, "}");
}
