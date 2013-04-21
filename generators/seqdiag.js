function seqdiag(yy) {
    yy.result("seqdiag {");
    var r = getGraphRoot(yy);
    //print out all node declarations FIRST (if any)
    for (var i in r.OBJECTS) {
        var o = r.OBJECTS[i];
        if (o instanceof Group) {
            yy.result(' /*' + o.getName() + getAttrFmt(o, 'label', ' {0}*/'));
            for (var j in o.OBJECTS) {
                var z = o.OBJECTS[j];
                //no color support either..
                var s = getAttrFmt(z, 'style', ',style={0}') +
                    getAttrFmt(z, 'label', ',label="{0}"');
                if (s.trim() != "")
                    s = "[" + s.trim().substring(1) + "]";
                yy.result(z.getName() + s + ";");
            }
        } else if (o instanceof Node) {
            var s = getAttrFmt(o, 'style', ',style={0}') +
                getAttrFmt(o, 'label', ',label="{0}"');
            if (s.trim() != "")
                s = "[" + s.trim().substring(1) + "]";
            yy.result(o.getName() + s + ";");
        }
    }
    for (var i in yy.LINKS) {
        var l = yy.LINKS[i];
        var t = getAttrFmt(l, 'label', ',label="{0}"') +
            getAttrFmt(l, 'color', ',color="{0}"');
        var lt;
        var lr = l.right;
        var ll = l.left;

        if (lr instanceof Group) {
            //just pick ONE Node from group and use lhead
            //TODO: Assuming it is Node (if Recursive groups implemented, it could be smthg else)
            t += " lhead=cluster_" + lr.getName();
            lr = lr.OBJECTS[0];
            if (lr == undefined) {
                //TODO:Bad thing, EMPTY group..add one invisible node there...
                //But should add already at TOP
            }
        }
        //TODO:Assuming producing DIGRAPH
        //For GRAPH all edges are type --
        //but we could SET arrow type if we'd like
        var rightName = lr.getName();
        if (t.trim() != "")
            t = t.trim().substring(1);

        var dot = false;
        var dash = false;
        if (l.linkType.indexOf(".") !== -1) {
            dot = true;
        } else if (l.linkType.indexOf("-") !== -1) {
            dash = true;
        }
        if (l.linkType.indexOf("<") !== -1 &&
            l.linkType.indexOf(">") !== -1) {
            //Broadcast type (<>)
            //Alas not supported...
            //HMh..since one could use the === as broadcast
            //a<>b would be BETTER served as autoreturn edge
            //But I'd need to GUESS a new broadcast then..
            //hm.. solve a<>a is broadcast, where as
            //a<>b (any else than node itself) is autoreturn
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
            //dotted
            yy.result(getAttrFmt(l, 'label', '...{0}...'));
            continue;
        } else if (dash) {
            //dashed
            yy.result(getAttrFmt(l, 'label', '==={0}==='));
            continue;
        } else {
            yy.result("ERROR: SHOULD NOT HAPPEN");
        }
        if (t.trim() != "")
            t = "[" + t + "]";
        //MUST HAVE whitespace at both sides of the "arrow"
        yy.result(ll.getName() + " " + lt + " " + rightName + t + ";");
    }
    yy.result("}");
}
