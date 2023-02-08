/**
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
@param {GraphMeta} graphmeta
*/
function mscgen(graphmeta) {
    output(graphmeta, "msc {", true);
    const root = graphmeta.GRAPHROOT;
    let comma = false;
    // print out all node declarations FIRST (if any)
    traverseObjects(root, obj => {
        if (obj instanceof Group) {
            output(graphmeta, ' /*' + obj.getName() + getAttrFmt(obj, 'label', ' {0}') + '*/');
            traverseObjects(obj, z => {
                let tmp = getAttrFmt(z, 'color', ',color="{0}"') + getAttrFmt(z, 'style', ',style={0}') + getAttrFmt(z, 'label', ',label="{0}"');
                if (tmp.trim() != "")
                    tmp = "[" + tmp.trim().substring(1) + "]";
                output(graphmeta, (comma ? "," : "") + "    " + z.getName() + tmp);
                comma = true;
            });
        } else if (obj instanceof Node) {
            let tmp = getAttrFmt(obj, 'color', ',textbgcolor="{0}"') + getAttrFmt(obj, 'style', ',style={0}') + getAttrFmt(obj, 'label', ',label="{0}"');
            if (tmp.trim() != "")
                tmp = "[" + tmp.trim().substring(1) + "]";
            output(graphmeta, (comma ? "," : "") + "  " + obj.getName() + tmp);
            comma = true;
        }
    });

    output(graphmeta, ";");
    let id = 1;
    traverseLinks(graphmeta, link => {
        let linkType = "";
        let rhs = link.right;
        let lhs = link.left;

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
        let rightName = rhs.getName();

        const dot = link.isDotted();
        const dash = link.isDashed()
        const broken = link.isBroken();

        let swap = false;
        const attrs = [];
        let label = link.label;
        const color = link.color;
        const url = link.url;
        let note = "";
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
        if (link.isBidirectional()) {
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
        } else if (link.isLeftLink()) {
            const tmpl = lhs;
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
        } else if (link.isRightLink()) {
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
            output(graphmeta, "...[" + attrs.join(",") + "];");
            return;
        } else if (dash) {
            // dashed
            if (color) {
                attrs.push('textcolor="' + color + '"');
            }
            output(graphmeta, "---[" + attrs.join(",") + "];");
            return;
        } else {
            output(graphmeta, "ERROR: SHOULD NOT HAPPEN");
        }

        output(graphmeta, lhs.getName() + linkType + rightName + "[" + attrs.join(",") + "];");
        if (note != "")
            // output(grpahmeta,ll.getName() +' abox '
            // +lr.getName()+'[label="'+note+'"];');
            output(graphmeta, rhs.getName() + ' abox ' + rhs.getName() + '[label="' + note + '"];');
        // if (swap)
        // output(graphmeta,lr.getName() + lt + ll.getName() + t + ";");
    });
    output(false);
    output(graphmeta, "}");
}
generators.set('mscgen', mscgen);