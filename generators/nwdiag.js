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
    const r = getGraphRoot(yy);
    for (const i in r.OBJECTS) {
        if (!r.OBJECTS.hasOwnProperty(i)) continue;
        const o = r.OBJECTS[i];
        if (o instanceof Group) {
            // split the label to two, NAME and address
            yy.result('  network ' + o.getName() + '{');
            if (o.getLabel() != "")
                yy.result('    address="' + o.getLabel() + '"');
            for (const j in o.OBJECTS) {
                if (!o.OBJECTS.hasOwnProperty(j)) continue;
                const z = o.OBJECTS[j];
                let tmp = getAttrFmt(z, 'color', ',color="{0}"') + getShape(shapes.actdiag, z.shape, ',shape="{0}"') + getAttrFmt(z, 'label', ',address="{0}"');
                if (tmp.trim() != "")
                    tmp = "[" + tmp.trim().substring(1) + "]";
                yy.result("    " + z.getName() + tmp + ';');
            }
            // find if there are ANY links that have this GROUP as participant!
            for (const il in yy.LINKS) {
                if (!yy.LINKS.hasOwnProperty(il)) continue;
                const link = yy.LINKS[il];
                tmp = getAttrFmt(link, 'label', '[address="{0}"]');
                if (link.left == o) {
                    yy.result("  " + link.right.getName() + tmp + ";");
                }
                if (link.right == o) {
                    yy.result("  " + link.left.getName() + tmp + ";");
                }
            }
            yy.result("  }");
        } else {
            // ICON does not work, using background
            let tmp = getAttrFmt(o, 'color', ',color="{0}"') + getAttrFmt(o, 'image', ',background="icons{0}"') + getShape(shapes.actdiag, o.shape, ',shape="{0}"') + getAttrFmt(o, 'label', ',label="{0}"');
            if (tmp.trim() != "")
                tmp = "[" + tmp.trim().substring(1) + "]";
            yy.result("    " + o.getName() + tmp + ';');
        }
    }
    for (const i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i)) continue;
        const l1 = yy.LINKS[i];
        if (l1.left instanceof Group || l1.right instanceof Group)
            continue;
        yy.result(l1.left.getName() + " -- " + l1.right.getName() + ";");
    }
    yy.result("}");
}
