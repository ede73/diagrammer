/*
a>b>c,d
a>e;link text
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
a -> e[label="link text"];
}
node js/parse.js verbose seqdiag.test seqdiag
*/
function seqdiag(yy) {
    yy.result("seqdiag {");
    yy.result("autonumber = True;");
    // quite fucked up life line activations and no control over..skip
    // it,shrimpy!
    yy.result(" activation = none;");
    var root = getGraphRoot(yy);
    // print out all node declarations FIRST (if any)
    for (var i in root.OBJECTS) {
        if (!root.OBJECTS.hasOwnProperty(i)) continue;
        var obj = root.OBJECTS[i];
        if (obj instanceof Group) {
            yy.result(' /*' + obj.getName() + getAttrFmt(obj, 'label', ' {0}*/'));
            for (var j in obj.OBJECTS) {
                if (!obj.OBJECTS.hasOwnProperty(j)) continue;
                var z = obj.OBJECTS[j];
                // no color support either..
                var styleAndLabel = getAttrFmt(z, 'style', ',style={0}') + getAttrFmt(z, 'label', ',label="{0}"');
                if (styleAndLabel.trim() != "")
                    styleAndLabel = "[" + styleAndLabel.trim().substring(1) + "]";
                yy.result(z.getName() + styleAndLabel + ";");
            }
        } else if (obj instanceof Node) {
            var styleAndLabel = getAttrFmt(obj, 'style', ',style={0}') + getAttrFmt(obj, 'label', ',label="{0}"') + getAttrFmt(obj, 'color', ',color="{0}"');
            if (styleAndLabel.trim() != "")
                styleAndLabel = "[" + styleAndLabel.trim().substring(1) + "]";
            yy.result(obj.getName() + styleAndLabel + ";");
        }
    }
    for (var i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i)) continue;
        var link = yy.LINKS[i];
        var attrs = [];
        var linkType = "";
        var rhs = link.right;
        var lhs = link.left;

        var color = link.color;
        if (color) {
            attrs.push('color="' + color + '"');
        }
        var label = link.label;
        if (label) {
            if (label.indexOf("::") !== -1) {
                label = label.split("::");
                attrs.push('note="' + label[1].trim() + '"');
                attrs.push('label="' + label[0].trim() + '"');
            } else {
                attrs.push('label="' + label.trim() + '"');
            }
        }
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
        //var broken = false;
        if (link.linkType.indexOf(".") !== -1) {
            dot = true;
        } else if (link.linkType.indexOf("-") !== -1) {
            dash = true;
        } else if (link.linkType.indexOf("/") !== -1) {
            attrs.push("failed");
        }
        if (link.linkType.indexOf("<") !== -1 && link.linkType.indexOf(">") !== -1) {
            // Broadcast type (<>)
            // Alas not supported...
            // HMh..since one could use the === as broadcast
            // a<>b would be BETTER served as autoreturn edge
            // But I'd need to GUESS a new broadcast then..
            // hm.. solve a<>a is broadcast, where as
            // a<>b (any else than node itself) is autoreturn
            if (rhs == lhs) {
                yy.result(getAttrFmt(link, 'label', '===BROADCAST:{0}==='));
                continue;
            }
            linkType = '=>';
        } else if (link.linkType.indexOf("<") !== -1) {
            if (dot)
                linkType = "<--";
            else if (dash)
                linkType = "<<--";
            else
                linkType = "<-";
            rightName = rhs.getName();
        } else if (link.linkType.indexOf(">") !== -1) {
            if (dot)
                linkType = "-->";
            else if (dash)
                linkType = "-->>";
            else
                linkType = "->";
        } else if (dot) {
            // dotted
            yy.result(getAttrFmt(link, 'label', '...{0}...'));
            continue;
        } else if (dash) {
            // dashed
            yy.result(getAttrFmt(link, 'label', '==={0}==='));
            continue;
        } else {
            yy.result("ERROR: SHOULD NOT HAPPEN");
        }
        // MUST HAVE whitespace at both sides of the "arrow"
        yy.result(lhs.getName() + " " + linkType + " " + rightName + "[" + attrs.join(",") + "];");
    }
    yy.result("}");
}
