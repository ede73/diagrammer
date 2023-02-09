/**
a>b>c,d
a>e;edge text
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
    a=>e[label="edge text",id="4"];
}
node js/parse.js verbose mscgen.test mscgen
@param {GraphMeta} graphmeta
*/
function mscgen(graphmeta) {
    output(graphmeta, "msc {", true);
    const root = graphmeta.GRAPHROOT;
    let comma = false;
    // print out all node declarations FIRST (if any)
    traverseVertices(root, obj => {
        if (obj instanceof GraphGroup) {
            output(graphmeta, ' /*' + obj.getName() + getAttributeAndFormat(obj, 'label', ' {0}') + '*/');
            traverseVertices(obj, z => {
                let tmp = getAttributeAndFormat(z, 'color', ',color="{0}"') +
                    getAttributeAndFormat(z, 'style', ',style={0}') +
                    getAttributeAndFormat(z, 'label', ',label="{0}"');
                if (tmp.trim() != "")
                    tmp = "[" + tmp.trim().substring(1) + "]";
                output(graphmeta, (comma ? "," : "") + "    " + z.getName() + tmp);
                comma = true;
            });
        } else if (obj instanceof GraphVertex) {
            let tmp = getAttributeAndFormat(obj, 'color', ',textbgcolor="{0}"') +
                getAttributeAndFormat(obj, 'style', ',style={0}') +
                getAttributeAndFormat(obj, 'label', ',label="{0}"');
            if (tmp.trim() != "")
                tmp = "[" + tmp.trim().substring(1) + "]";
            output(graphmeta, (comma ? "," : "") + "  " + obj.getName() + tmp);
            comma = true;
        }
    });

    output(graphmeta, ";");
    let id = 1;
    traverseEdges(graphmeta, edge => {
        let edgeType = "";
        let rhs = edge.right;
        let lhs = edge.left;

        if (rhs instanceof GraphGroup) {
            // just pick ONE Vertex from group and use lhead
            // TODO: Assuming it is Vertex (if Recursive groups implemented, it
            // could be smthg else)
            edgeType += " lhead=cluster_" + rhs.getName();
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

        const dot = edge.isDotted();
        const dash = edge.isDashed()
        const broken = edge.isBroken();

        let swap = false;
        const attrs = [];
        let label = edge.label;
        const color = edge.color;
        const url = edge.url;
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
        if (edge.isBidirectional()) {
            // Broadcast type (<>)
            // hmh..since seqdiag uses a<>a as broadcast and
            // a<>b as autoreturn, could we do as well?
            if (lhs == rhs) {
                edgeType = "->";
                rightName = "*";
            } else {
                edgeType = "<=>";
                swap = true;
            }
        } else if (edge.isLeftPointingEdge()) {
            const tmpl = lhs;
            lhs = rhs;
            rhs = tmpl;
            if (dot)
                edgeType = ">>";
            else if (dash)
                edgeType = "->";
            else if (broken)
                edgeType = "-x";
            else
                edgeType = "=>";
            rightName = rhs.getName();
        } else if (edge.isRightPointingEdge()) {
            if (dot)
                edgeType = ">>";
            else if (dash)
                edgeType = "->";
            else if (broken)
                edgeType = "-x";
            else
                edgeType = "=>";
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

        output(graphmeta, lhs.getName() + edgeType + rightName + "[" + attrs.join(",") + "];");
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