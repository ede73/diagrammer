function mscgen(yy) {
	yy.result("msc {");
	var r = getGraphRoot(yy);
	var comma = false;

	// print out all node declarations FIRST (if any)
	for ( var i in r.OBJECTS) {
		var o = r.OBJECTS[i];
		if (o instanceof Group) {
			yy.result(' /*' + o.getName() + getAttrFmt(o, 'label', ' {0}*/'));
			for ( var j in o.OBJECTS) {
				var z = o.OBJECTS[j];
				var s = getAttrFmt(z, 'color', ',color="{0}"')
						+ getAttrFmt(z, 'style', ',style={0}')
						+ getAttrFmt(z, 'label', ',label="{0}"');
				if (s.trim() != "")
					s = "[" + s.trim().substring(1) + "]";
				yy.result((comma ? "," : "") + "    " + z.getName() + s);
				comma = true;
			}
		} else if (o instanceof Node) {
			var s = getAttrFmt(o, 'color', ',textbgcolor="{0}"')
					+ getAttrFmt(o, 'style', ',style={0}')
					+ getAttrFmt(o, 'label', ',label="{0}"');
			if (s.trim() != "")
				s = "[" + s.trim().substring(1) + "]";
			yy.result((comma ? "," : "") + "  " + o.getName() + s);
			comma = true;
		}
	}
	yy.result(";");
	var id = 1;
	for ( var i in yy.LINKS) {
		var l = yy.LINKS[i];
		var lt;
		var lr = l.right;
		var ll = l.left;

		if (lr instanceof Group) {
			// just pick ONE Node from group and use lhead
			// TODO: Assuming it is Node (if Recursive groups implemented, it
			// could be smthg else)
			t += " lhead=cluster_" + lr.getName();
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
		var broken = false;
		if (l.linkType.indexOf(".") !== -1) {
			dot = true;
		} else if (l.linkType.indexOf("-") !== -1) {
			dash = true;
		} else if (l.linkType.indexOf("/") !== -1) {
			broken = true;
		}
		var swap = false;
		var attrs = [];
		var label = getAttr(l, "label");
		var color = getAttr(l, 'color');
		var url = getAttr(l, "url");
		var note = "";
		if (url) {
			attrs.push('URL="'+url+'"');
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
		if (l.linkType.indexOf("<") !== -1 && l.linkType.indexOf(">") !== -1) {
			// Broadcast type (<>)
			// hmh..since seqdiag uses a<>a as broadcast and
			// a<>b as autoreturn, could we do as well?
			if (ll == lr) {
				lt = "->";
				rightName = "*";
			} else {
				lt = "<=>";
				swap = true;
			}
		} else if (l.linkType.indexOf("<") !== -1) {
			var tmp = ll;
			ll = lr;
			lr = tmp;
			if (dot)
				lt = ">>";
			else if (dash)
				lt = "->";
			else if (broken)
				lt = "-x";
			else
				lt = "=>";
			rightName = lr.getName();
		} else if (l.linkType.indexOf(">") !== -1) {
			if (dot)
				lt = ">>";
			else if (dash)
				lt = "->";
			else if (broken)
				lt = "-x";
			else
				lt = "=>";
		} else if (dot) {
			// dotted
			if (color) {
				attrs.push('textcolor="' + color + '"');
			}
			yy.result("...[" + attrs.join(",") + "];");
			continue;
		} else if (dash) {
			// dashed
			if (color) {
				attrs.push('textcolor="' + color + '"');
			}
			yy.result("---[" + attrs.join(",") + "];");
			continue;
		} else {
			yy.result("ERROR: SHOULD NOT HAPPEN");
		}

		yy.result(ll.getName() + lt + rightName + "[" + attrs.join(",") + "];");
		if (note != "")
			// yy.result(ll.getName() +' abox '
			// +lr.getName()+'[label="'+note+'"];');
			yy.result(lr.getName() + ' abox ' + lr.getName() + '[label="'
					+ note + '"];');
		// if (swap)
		// yy.result(lr.getName() + lt + ll.getName() + t + ";");
	}
	yy.result("}");
}
