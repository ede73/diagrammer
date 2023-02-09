/**
a>b>c,d
a>e;edge text
a;node text

to
seqdiag {
autonumber = True;
 activation = none;
a[label="node text"];
b;
c;
d;
e;
a -> b[];
b -> c[];
b -> d[];
a -> e[label="edge text"];
}
node js/parse.js verbose seqdiag.test seqdiag
@param {GraphCanvas} graphcanvas
*/
function seqdiag(graphcanvas) {
    graphcanvas.result("seqdiag {");
    graphcanvas.result("autonumber = True;");
    // quite fucked up life line activations and no control over..skip
    // it,shrimpy!
    graphcanvas.result(" activation = none;");
    // print out all node declarations FIRST (if any)
    for (const i in graphcanvas.OBJECTS) {
        if (!graphcanvas.OBJECTS.hasOwnProperty(i)) continue;
        const obj = graphcanvas.OBJECTS[i];
        if (obj instanceof GraphGroup) {
            graphcanvas.result(' /*' + obj.getName() + getAttributeAndFormat(obj, 'label', ' {0}*/'));
            for (const j in obj.OBJECTS) {
                if (!obj.OBJECTS.hasOwnProperty(j)) continue;
                const z = obj.OBJECTS[j];
                // no color support either..
                let styleAndLabel = getAttributeAndFormat(z, 'style', ',style={0}') +
                    getAttributeAndFormat(z, 'label', ',label="{0}"');
                if (styleAndLabel.trim() != "")
                    styleAndLabel = "[" + styleAndLabel.trim().substring(1) + "]";
                graphcanvas.result(z.getName() + styleAndLabel + ";");
            }
        } else if (obj instanceof GraphVertex) {
            let styleAndLabel = getAttributeAndFormat(obj, 'style', ',style={0}') +
                getAttributeAndFormat(obj, 'label', ',label="{0}"') +
                getAttributeAndFormat(obj, 'color', ',color="{0}"');
            if (styleAndLabel.trim() != "")
                styleAndLabel = "[" + styleAndLabel.trim().substring(1) + "]";
            graphcanvas.result(obj.getName() + styleAndLabel + ";");
        }
    }

    traverseEdges(graphcanvas, edge => {
        const attrs = [];
        let edgeType = "";
        let rhs = edge.right;
        let lhs = edge.left;

        const color = edge.color;
        if (color) {
            attrs.push('color="' + color + '"');
        }
        let label = edge.label;
        if (label) {
            if (label.indexOf("::") !== -1) {
                label = label.split("::");
                attrs.push('note="' + label[1].trim() + '"');
                attrs.push('label="' + label[0].trim() + '"');
            } else {
                attrs.push('label="' + label.trim() + '"');
            }
        }
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
        const dash = edge.isDashed();
        if (edge.isBroken()) {
            attrs.push("failed");
        }
        if (edge.edgeType.indexOf("<") !== -1 && edge.edgeType.indexOf(">") !== -1) {
            // Broadcast type (<>)
            // Alas not supported...
            // HMh..since one could use the === as broadcast
            // a<>b would be BETTER served as autoreturn edge
            // But I'd need to GUESS a new broadcast then..
            // hm.. solve a<>a is broadcast, where as
            // a<>b (any else than node itself) is autoreturn
            if (rhs == lhs) {
                graphcanvas.result(getAttributeAndFormat(edge, 'label', '===BROADCAST:{0}==='));
                return;
            }
            edgeType = '=>';
        } else if (edge.edgeType.indexOf("<") !== -1) {
            if (dot)
                edgeType = "<--";
            else if (dash)
                edgeType = "<<--";
            else
                edgeType = "<-";
            rightName = rhs.getName();
        } else if (edge.edgeType.indexOf(">") !== -1) {
            if (dot)
                edgeType = "-->";
            else if (dash)
                edgeType = "-->>";
            else
                edgeType = "->";
        } else if (dot) {
            // dotted
            graphcanvas.result(getAttributeAndFormat(edge, 'label', '...{0}...'));
            return;
        } else if (dash) {
            // dashed
            graphcanvas.result(getAttributeAndFormat(edge, 'label', '==={0}==='));
            return;
        } else {
            graphcanvas.result("ERROR: SHOULD NOT HAPPEN");
        }
        // MUST HAVE whitespace at both sides of the "arrow"
        graphcanvas.result(lhs.getName() + " " + edgeType + " " + rightName + "[" + attrs.join(",") + "];");
    });
    graphcanvas.result("}");
}
generators.set('seqdiag', seqdiag);