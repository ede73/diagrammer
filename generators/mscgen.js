/*
a>b>c,d
a>e;link text
a;node text

to
msc {
      a[label="node text"]
    ,  b
    ,  c
    ,  d
    ,  e
    ;
    a=>b[id="1"];
    b=>c[id="2"];
    b=>d[id="3"];
    a=>e[label="link text",id="4"];
}
node parse.js verbose parsetree.test mscgen
*/
function mscgen(yy) {
    output(yy, "msc {", true);
    const r = getGraphRoot(yy);
    var comma = false;
    // print out all node declarations FIRST (if any)
    traverseObjects(r, o => {
        var tmp;
        if (o instanceof Group) {
            output(yy, ' /*' + o.getName() + getAttrFmt(o, 'label', ' {0}') + '*/');
            traverseObjects(o, z => {
                tmp = getAttrFmt(z, 'color', ',color="{0}"') + getAttrFmt(z, 'style', ',style={0}') + getAttrFmt(z, 'label', ',label="{0}"');
                if (tmp.trim() != "")
                    tmp = "[" + tmp.trim().substring(1) + "]";
                output(yy, (comma ? "," : "") + "    " + z.getName() + tmp);
                comma = true;
            });
        } else if (o instanceof Node) {
            tmp = getAttrFmt(o, 'color', ',textbgcolor="{0}"') + getAttrFmt(o, 'style', ',style={0}') + getAttrFmt(o, 'label', ',label="{0}"');
            if (tmp.trim() != "")
                tmp = "[" + tmp.trim().substring(1) + "]";
            output(yy, (comma ? "," : "") + "  " + o.getName() + tmp);
            comma = true;
        }
    });

    output(yy, ";");
    var id = 1;
    traverseLinks(yy, l => {
        var lt = "";
        var lr = l.right;
        var ll = l.left;

        if (lr instanceof Group) {
            // just pick ONE Node from group and use lhead
            // TODO: Assuming it is Node (if Recursive groups implemented, it
            // could be smthg else)
            lt += " lhead=cluster_" + lr.getName();
            lr = lr.OBJECTS[0];
            if (lr == undefined) {
                // TODO:Bad thing, EMPTY group..add one invisible node there...
                // But should add already at TOP
            }
        }
        // TODO:Assuming producing DIGRAPH
        // For GRAPH all edges are type --
        // but we could SET arrow type if we'd like
        var rightName = lr.getName();

        var dot = false;
        var dash = false;
        var broken = false;
        if (l.linkType.indexOf(".") !== -1) {
            dot = true;
        } else if (l.linkType.indexOf("-") !== -1) {
            dash = true;
        } else if (l.linkType.indexOf("/") !== -1) {
            broken = true;
        }
        var swap = false;
        const attrs = [];
        var label = getAttr(l, "label");
        const color = getAttr(l, 'color');
        var url = getAttr(l, "url");
        var note = "";
        if (url) {
            attrs.push('URL="' + url + '"');
        }
        if (color) {
            attrs.push('linecolor="' + color + '"');
        }
        if (label) {
            if (label.indexOf("::") !== -1) {
                label = label.split("::");
                note = label[1].trim();
                attrs.push('label="' + label[0].trim() + '"');
            } else {
                attrs.push('label="' + label.trim() + '"');
            }
        }
        attrs.push('id="' + id++ + '"');
        if (l.linkType.indexOf("<") !== -1 && l.linkType.indexOf(">") !== -1) {
            // Broadcast type (<>)
            // hmh..since seqdiag uses a<>a as broadcast and
            // a<>b as autoreturn, could we do as well?
            if (ll == lr) {
                lt = "->";
                rightName = "*";
            } else {
                lt = "<=>";
                swap = true;
            }
        } else if (l.linkType.indexOf("<") !== -1) {
            var tmpl = ll;
            ll = lr;
            lr = tmpl;
            if (dot)
                lt = ">>";
            else if (dash)
                lt = "->";
            else if (broken)
                lt = "-x";
            else
                lt = "=>";
            rightName = lr.getName();
        } else if (l.linkType.indexOf(">") !== -1) {
            if (dot)
                lt = ">>";
            else if (dash)
                lt = "->";
            else if (broken)
                lt = "-x";
            else
                lt = "=>";
        } else if (dot) {
            // dotted
            if (color) {
                attrs.push('textcolor="' + color + '"');
            }
            output(yy, "...[" + attrs.join(",") + "];");
            return;
        } else if (dash) {
            // dashed
            if (color) {
                attrs.push('textcolor="' + color + '"');
            }
            output(yy, "---[" + attrs.join(",") + "];");
            return;
        } else {
            output(yy, "ERROR: SHOULD NOT HAPPEN");
        }

        output(yy, ll.getName() + lt + rightName + "[" + attrs.join(",") + "];");
        if (note != "")
            // output(yy,ll.getName() +' abox '
            // +lr.getName()+'[label="'+note+'"];');
            output(yy, lr.getName() + ' abox ' + lr.getName() + '[label="' + note + '"];');
        // if (swap)
        // output(yy,lr.getName() + lt + ll.getName() + t + ";");
    });
    output(false);
    output(yy, "}");
}
