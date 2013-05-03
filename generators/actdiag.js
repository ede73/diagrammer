//node parse.js state2.txt actdiag |actdiag -Tpng -o a.png - && open a.png

function actdiag(yy) {
	yy.result("actdiag{\n  default_fontsize = 14");
	var r = getGraphRoot(yy);
	/*
	 * does not really work..but portrait mode if
	 * (r.getDirection()==="portrait"){ yy.result(" orientation=portrait");
	 * }else{ //DEFAULT yy.result(" orientation=landscape"); }
	 */
	var s = r.getStart();
	for ( var i in r.OBJECTS) {
		var o = r.OBJECTS[i];
		if (o instanceof Group) {
			yy.result('  lane "' + o.getName() + '"{');
			for ( var j in o.OBJECTS) {
				var z = o.OBJECTS[j];
				var s = getAttrFmt(z, 'color', ',color="{0}"')
						+ getShape(shapes.actdiag, z.shape, ',shape={0}')
						+ getAttrFmt(z, 'label', ',label="{0}"');
				if (s.trim() != "")
					s = "[" + s.trim().substring(1) + "]";
				yy.result("    " + z.getName() + s + ';');
			}
			yy.result("  }");
		} else {
			// dotted,dashed,solid
			// NOT invis,bold,rounded,diagonals
			// ICON does not work, using background
			var style = getAttrFmt(o, 'style', ',style="{0}"');
			if (style != "" && style.match(/(dotted|dashed|solid)/) == null) {
				style = "";
			}

			// ICON does not work, using background
			var s = getAttrFmt(o, 'color', ',color="{0}"')
					+ getAttrFmt(o, 'image', ',background="icons{0}"') + style
					+ getShape(shapes.actdiag, o.shape, ',shape={0}')
					+ getAttrFmt(o, 'label', ',label="{0}"');
			if (s.trim() != "")
				s = "[" + s.trim().substring(1) + "]";
			yy.result("  " + o.getName() + s + ';');
		}
	}
	for ( var i in yy.LINKS) {
		var l = yy.LINKS[i];
		var t = "";
		if (l.linkType.indexOf(".") !== -1) {
			t += ',style="dotted" ';
		} else if (l.linkType.indexOf("-") !== -1) {
			t += ',style="dashed" ';
		}
		var lbl = getAttrFmt(l, 'label', ',label = "{0}"'
				+ getAttrFmt(l, [ 'color', 'textcolor' ], 'textcolor="{0}"'));
		var color = getAttrFmt(l, 'color', ',color="{0}"');
		t += lbl + color;
		t = t.trim();
		if (t.substring(0, 1) == ",")
			t = t.substring(1).trim();
		if (t != "")
			t = "[" + t + "]";
		yy.result("  " + l.left.getName() + " -> " + l.right.getName() + t
				+ ";");
	}
	yy.result("}");
}
