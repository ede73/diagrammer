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
*/
function seqdiag(yy) {
    yy.result("seqdiag {");
    yy.result("autonumber = True;");
    // quite fucked up life line activations and no control over..skip
    // it,shrimpy!
    yy.result(" activation = none;");
    var r = getGraphRoot(yy);
    var i;
    // print out all node declarations FIRST (if any)
    for (i in r.OBJECTS) {
        if (!r.OBJECTS.hasOwnProperty(i)) continue;
        var o = r.OBJECTS[i];
        if (o instanceof Group) {
            yy.result(' /*' + o.getName() + getAttrFmt(o, 'label', ' {0}*/'));
            for (var j in o.OBJECTS) {
                if (!o.OBJECTS.hasOwnProperty(j)) continue;
                var z = o.OBJECTS[j];
                // no color support either..
                var s = getAttrFmt(z, 'style', ',style={0}') + getAttrFmt(z, 'label', ',label="{0}"');
                if (s.trim() != "")
                    s = "[" + s.trim().substring(1) + "]";
                yy.result(z.getName() + s + ";");
            }
        } else if (o instanceof Node) {
            var s1 = getAttrFmt(o, 'style', ',style={0}') + getAttrFmt(o, 'label', ',label="{0}"') + getAttrFmt(o, 'color', ',color="{0}"');
            if (s1.trim() != "")
                s1 = "[" + s1.trim().substring(1) + "]";
            yy.result(o.getName() + s1 + ";");
        }
    }
    for (i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i)) continue;
        var l = yy.LINKS[i];
        var attrs = [];
        var lt = "";
        var lr = l.right;
        var ll = l.left;

        var color = getAttr(l, 'color');
        if (color) {
            attrs.push('color="' + color + '"');
        }
        var label = getAttr(l, 'label');
        if (label) {
            if (label.indexOf("::") !== -1) {
                label = label.split("::");
                attrs.push('note="' + label[1].trim() + '"');
                attrs.push('label="' + label[0].trim() + '"');
            } else {
                attrs.push('label="' + label.trim() + '"');
            }
        }
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
        //var broken = false;
        if (l.linkType.indexOf(".") !== -1) {
            dot = true;
        } else if (l.linkType.indexOf("-") !== -1) {
            dash = true;
        } else if (l.linkType.indexOf("/") !== -1) {
            attrs.push("failed");
        }
        if (l.linkType.indexOf("<") !== -1 && l.linkType.indexOf(">") !== -1) {
            // Broadcast type (<>)
            // Alas not supported...
            // HMh..since one could use the === as broadcast
            // a<>b would be BETTER served as autoreturn edge
            // But I'd need to GUESS a new broadcast then..
            // hm.. solve a<>a is broadcast, where as
            // a<>b (any else than node itself) is autoreturn
            if (lr == ll) {
                yy.result(getAttrFmt(l, 'label', '===BROADCAST:{0}==='));
                continue;
            }
            lt = '=>';
        } else if (l.linkType.indexOf("<") !== -1) {
            if (dot)
                lt = "<--";
            else if (dash)
                lt = "<<--";
            else
                lt = "<-";
            rightName = lr.getName();
        } else if (l.linkType.indexOf(">") !== -1) {
            if (dot)
                lt = "-->";
            else if (dash)
                lt = "-->>";
            else
                lt = "->";
        } else if (dot) {
            // dotted
            yy.result(getAttrFmt(l, 'label', '...{0}...'));
            continue;
        } else if (dash) {
            // dashed
            yy.result(getAttrFmt(l, 'label', '==={0}==='));
            continue;
        } else {
            yy.result("ERROR: SHOULD NOT HAPPEN");
        }
        // MUST HAVE whitespace at both sides of the "arrow"
        yy.result(ll.getName() + " " + lt + " " + rightName + "[" + attrs.join(",") + "];");
    }
    yy.result("}");
}
