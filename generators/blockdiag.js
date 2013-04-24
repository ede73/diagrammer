//http://blockdiag.com/en/blockdiag/examples.html#simple-diagram
//node parse.js state2.txt blockdiag |blockdiag -Tpng -o a.png - && open a.png
//available shapes
//box,square,roundedbox,dots
//circle,ellipse,diamond,minidiamond
//note,mail,cloud,actor
//flowchart.beginpoint,flowchart.endpoint
//flowchart.condition,flowchart.database,flowchart.terminator,flowchart.input
//flowchart.loopin,flowchart.loopout

function blockdiag(yy) {
    yy.result("blockdiag{\n default_fontsize = 14");
    var r = getGraphRoot(yy);
    if (r.getDirection() === "portrait") {
        yy.result("  orientation=portrait");
    } else {
        //DEFAULT
        yy.result("  orientation=landscape");
    }
    var s = r.getStart();
    for (var i in r.OBJECTS) {
        var o = r.OBJECTS[i];
        if (o instanceof Group) {
            yy.result('  group "' + o.getLabel() + '"{');
            yy.result(getAttrFmt(o, 'color', '   color="{0}"'));
            yy.result(getAttrFmt(o, 'label', '   label="{0}"'));
            if (s!==undefined && s.trim() != "")
                s = "[" + s.trim().substring(1) + "]";
            for (var j in o.OBJECTS) {
                var z = o.OBJECTS[j];
                var s = getAttrFmt(z, 'color', ',color="{0}"') +
                    getShape(shapes.blockdiag, z.shape, ',shape={0}') +
                    getAttrFmt(z, 'label', ',label="{0}"');
                if (s.trim() != "")
                    s = "[" + s.trim().substring(1) + "]";
                yy.result("    " + z.getName() + s + ';');
            }
            yy.result("  }");
        } else {
        	//dotted,dashed,solid
        	//NOT invis,bold,rounded,diagonals
            //ICON does not work, using background
            var style=getAttrFmt(o, 'style', ',style="{0}"');
            if (style!="" && style.match(/(dotted|dashed|solid)/)==null){
            	style="";
            }

            var s = getAttrFmt(o, 'color', ',color="{0}"') +
                getAttrFmt(o, 'image', ',background="icons{0}"') +
                style+
                getShape(shapes.blockdiag, o.shape, ',shape="{0}"') +
                getAttrFmt(o, 'label', ',label="{0}"');
            if (s.trim() != "")
                s = "[" + s.trim().substring(1) + "]";
            yy.result("  " + o.getName() + s + ';');
        }
    }
    for (var i in yy.LINKS) {
        var l = yy.LINKS[i];
        var t="";
        if (l.linkType.indexOf(".") !== -1) {
            t += ',style="dotted" ';
        } else if (l.linkType.indexOf("-") !== -1) {
            t += ',style="dashed" ';
        }
		var lbl=getAttrFmt(l, 'label', ',label = "{0}"'+
			getAttrFmt(l,['color','textcolor'],'textcolor="{0}"'));
		var color=getAttrFmt(l,'color',',color="{0}"');
		t+=lbl+color;
		t=t.trim();
		if (t.substring(0,1)==",") t=t.substring(1).trim();
		if (t!="")
			t="["+t+"]";
        yy.result("  " + l.left.getName() + " -> " + l.right.getName() +t+";");
    }
    yy.result("}");
}
