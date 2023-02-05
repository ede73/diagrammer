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
node js/parse.js verbose mscgen.test mscgen
*/
function mscgen(yy) {
    output(yy, "msc {", true);
    const root = getGraphRoot(yy);
    var comma = false;
    // print out all node declarations FIRST (if any)
    traverseObjects(root, obj => {
        var tmp;
        if (obj instanceof Group) {
            output(yy, ' /*' + obj.getName() + getAttrFmt(obj, 'label', ' {0}') + '*/');
            traverseObjects(obj, z => {
                tmp = getAttrFmt(z, 'color', ',color="{0}"') + getAttrFmt(z, 'style', ',style={0}') + getAttrFmt(z, 'label', ',label="{0}"');
                if (tmp.trim() != "")
                    tmp = "[" + tmp.trim().substring(1) + "]";
                output(yy, (comma ? "," : "") + "    " + z.getName() + tmp);
                comma = true;
            });
        } else if (obj instanceof Node) {
            tmp = getAttrFmt(obj, 'color', ',textbgcolor="{0}"') + getAttrFmt(obj, 'style', ',style={0}') + getAttrFmt(obj, 'label', ',label="{0}"');
            if (tmp.trim() != "")
                tmp = "[" + tmp.trim().substring(1) + "]";
            output(yy, (comma ? "," : "") + "  " + obj.getName() + tmp);
            comma = true;
        }
    });

    output(yy, ";");
    var id = 1;
    traverseLinks(yy, link => {
        var linkType = "";
        var rhs = link.right;
        var lhs = link.left;

        if (rhs instanceof Group) {
            // just pick ONE Node from group and use lhead
            // TODO: Assuming it is Node (if Recursive groups implemented, it
            // could be smthg else)
            linkType += " lhead=cluster_" + rhs.getName();
            rhs = rhs.OBJECTS[0];
            if (!rhs) {
                // TODO:Bad thing, EMPTY group..add one invisible node there...
                // But should add already at TOP
            }
        }
        // TODO:Assuming producing DIGRAPH
        // For GRAPH all edges are type --
        // but we could SET arrow type if we'd like
        var rightName = rhs.getName();

        var dot = false;
        var dash = false;
        var broken = false;
        if (link.linkType.indexOf(".") !== -1) {
            dot = true;
        } else if (link.linkType.indexOf("-") !== -1) {
            dash = true;
        } else if (link.linkType.indexOf("/") !== -1) {
            broken = true;
        }
        var swap = false;
        const attrs = [];
        var label = link.label;
        const color = link.color;
        var url = link.url;
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
        if (link.linkType.indexOf("<") !== -1 && link.linkType.indexOf(">") !== -1) {
            // Broadcast type (<>)
            // hmh..since seqdiag uses a<>a as broadcast and
            // a<>b as autoreturn, could we do as well?
            if (lhs == rhs) {
                linkType = "->";
                rightName = "*";
            } else {
                linkType = "<=>";
                swap = true;
            }
        } else if (link.linkType.indexOf("<") !== -1) {
            var tmpl = lhs;
            lhs = rhs;
            rhs = tmpl;
            if (dot)
                linkType = ">>";
            else if (dash)
                linkType = "->";
            else if (broken)
                linkType = "-x";
            else
                linkType = "=>";
            rightName = rhs.getName();
        } else if (link.linkType.indexOf(">") !== -1) {
            if (dot)
                linkType = ">>";
            else if (dash)
                linkType = "->";
            else if (broken)
                linkType = "-x";
            else
                linkType = "=>";
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

        output(yy, lhs.getName() + linkType + rightName + "[" + attrs.join(",") + "];");
        if (note != "")
            // output(yy,ll.getName() +' abox '
            // +lr.getName()+'[label="'+note+'"];');
            output(yy, rhs.getName() + ' abox ' + rhs.getName() + '[label="' + note + '"];');
        // if (swap)
        // output(yy,lr.getName() + lt + ll.getName() + t + ";");
    });
    output(false);
    output(yy, "}");
}
