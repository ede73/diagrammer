//node parse.js state2.txt actdiag |actdiag -Tpng -o a.png - && open a.png

function actdiag(yy) {
    output(yy,"actdiag{\n  default_fontsize = 14");
    var r = getGraphRoot(yy);
    /*
     * does not really work..but portrait mode if
     * (r.getDirection()==="portrait"){ output(yy," orientation=portrait");
     * }else{ //DEFAULT output(yy," orientation=landscape"); }
     */
    //var s = r.getStart();
    var i;
    var parseObjects = function (o) {
	output(true);
        if (o instanceof Group) {
            output(yy,'lane "' + o.getName() + '"{',true);
	    traverseObjects(o, function(z){
                var s1 = getAttrFmt(z, 'color', ',color="{0}"') + 
		    getShape(shapes.actdiag, z.shape, ',shape={0}') + 
		    getAttrFmt(z, 'label', ',label="{0}"');
                if (s1.trim() != "") {
                    s1 = "[" + s1.trim().substring(1) + "]";
		}
                output(yy, z.getName() + s1 + ';');
            });
	    output(false);
            output(yy,"}");
        } else {
            // dotted,dashed,solid
            // NOT invis,bold,rounded,diagonals
            // ICON does not work, using background
            var style = getAttrFmt(o, 'style', ',style="{0}"');
            if (style != "" && style.match(/(dotted|dashed|solid)/) == null) {
                style = "";
            }

            // ICON does not work, using background
            var s2 = getAttrFmt(o, 'color', ',color="{0}"') +
		getAttrFmt(o, 'image', ',background="icons{0}"') +
		style +
		getShape(shapes.actdiag, o.shape, ',shape={0}') +
		getAttrFmt(o, 'label', ',label="{0}"');
            if (s2.trim() != "")
                s2 = "[" + s2.trim().substring(1) + "]";
            output(yy,o.getName() + s2 + ';');
        }
	output(false);
    };
    traverseObjects(r, parseObjects);

    traverseLinks(yy, function(l) {
        var t = "";
        if (l.linkType.indexOf(".") !== -1) {
            t += ',style="dotted" ';
        } else if (l.linkType.indexOf("-") !== -1) {
            t += ',style="dashed" ';
        }
        var lbl = getAttrFmt(l, 'label', ',label = "{0}"' + getAttrFmt(l, ['color', 'textcolor'], 'textcolor="{0}"'));
        var color = getAttrFmt(l, 'color', ',color="{0}"');
        t += lbl + color;
        t = t.trim();
        if (t.substring(0, 1) == ",")
            t = t.substring(1).trim();
        if (t != "")
            t = "[" + t + "]";
        output(yy,"  " + l.left.getName() + " -> " + l.right.getName() + t + ";");
    });
    output(yy,"}");
}
