//node js/parse.js state2.txt actdiag |actdiag -Tpng -o a.png - && open a.png
/*
a>b>c,d
a>e;link text
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
*/
function nwdiag(yy) {
    yy.result("nwdiag{\n default_fontsize = 16\n");
    var r = getGraphRoot(yy);
    //var s = r.getStart();
    var i;
    var tmp;
    for (i in r.OBJECTS) {
        if (!r.OBJECTS.hasOwnProperty(i)) continue;
        var o = r.OBJECTS[i];
        if (o instanceof Group) {
            // split the label to two, NAME and address
            yy.result('  network ' + o.getName() + '{');
            if (o.getLabel() != "")
                yy.result('    address="' + o.getLabel() + '"');
            for (var j in o.OBJECTS) {
                if (!o.OBJECTS.hasOwnProperty(j)) continue;
                var z = o.OBJECTS[j];
                tmp = getAttrFmt(z, 'color', ',color="{0}"') + getShape(shapes.actdiag, z.shape, ',shape="{0}"') + getAttrFmt(z, 'label', ',address="{0}"');
                if (tmp.trim() != "")
                    tmp = "[" + tmp.trim().substring(1) + "]";
                yy.result("    " + z.getName() + tmp + ';');
            }
            // find if there are ANY links that have this GROUP as participant!
            for (var il in yy.LINKS) {
                if (!yy.LINKS.hasOwnProperty(il)) continue;
                var l = yy.LINKS[il];
                tmp = getAttrFmt(l, 'label', '[address="{0}"]');
                if (l.left == o) {
                    yy.result("  " + l.right.getName() + tmp + ";");
                }
                if (l.right == o) {
                    yy.result("  " + l.left.getName() + tmp + ";");
                }
            }
            yy.result("  }");
        } else {
            // ICON does not work, using background
            tmp = getAttrFmt(o, 'color', ',color="{0}"') + getAttrFmt(o, 'image', ',background="icons{0}"') + getShape(shapes.actdiag, o.shape, ',shape="{0}"') + getAttrFmt(o, 'label', ',label="{0}"');
            if (tmp.trim() != "")
                tmp = "[" + tmp.trim().substring(1) + "]";
            yy.result("    " + o.getName() + tmp + ';');
        }
    }
    for (i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i)) continue;
        var l1 = yy.LINKS[i];
        if (l1.left instanceof Group || l1.right instanceof Group)
            continue;
        yy.result(l1.left.getName() + " -- " + l1.right.getName() + ";");
    }
    yy.result("}");
}
