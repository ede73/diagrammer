//node parse.js state2.txt actdiag |actdiag -Tpng -o a.png - && open a.png

function nwdiag(yy) {
	yy.result("nwdiag{\n default_fontsize = 16\n");
	var r = getGraphRoot(yy);
	var s = r.getStart();
	for ( var i in r.OBJECTS) {
		var o = r.OBJECTS[i];
		if (o instanceof Group) {
			// split the label to two, NAME and address
			yy.result('  network ' + o.getName() + '{');
			if (o.getLabel() != "")
				yy.result('    address="' + o.getLabel() + '"');
			for ( var j in o.OBJECTS) {
				var z = o.OBJECTS[j];
				var s = getAttrFmt(z, 'color', ',color="{0}"')
						+ getShape(shapes.actdiag, z.shape, ',shape="{0}"')
						+ getAttrFmt(z, 'label', ',address="{0}"');
				if (s.trim() != "")
					s = "[" + s.trim().substring(1) + "]";
				yy.result("    " + z.getName() + s + ';');
			}
			// find if there are ANY links that have this GROUP as participant!
			for ( var i in yy.LINKS) {
				var l = yy.LINKS[i];
				var s = getAttrFmt(l, 'label', '[address="{0}"]');
				if (l.left == o) {
					yy.result("  " + l.right.getName() + s + ";");
				}
				if (l.right == o) {
					yy.result("  " + l.left.getName() + s + ";");
				}
			}
			yy.result("  }");
		} else {
			// ICON does not work, using background
			var s = getAttrFmt(o, 'color', ',color="{0}"')
					+ getAttrFmt(o, 'image', ',background="icons{0}"')
					+ getShape(shapes.actdiag, o.shape, ',shape="{0}"')
					+ getAttrFmt(o, 'label', ',label="{0}"');
			if (s.trim() != "")
				s = "[" + s.trim().substring(1) + "]";
			yy.result("    " + o.getName() + s + ';');
		}
	}
	for ( var i in yy.LINKS) {
		var l = yy.LINKS[i];
		if (l.left instanceof Group || l.right instanceof Group)
			continue;
		yy.result(l.left.getName() + " -- " + l.right.getName() + ";");
	}
	yy.result("}");
}
