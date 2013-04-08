function mscgen(yy){
	yy.result("msc {");
	var r=getGraphRoot(yy);
	var comma=false;
	for(var i in r.OBJECTS){
		var o=r.OBJECTS[i];
		if (o instanceof Group){
			yy.result('  subgraph cluster_'+o.getName()+' {');
			yy.result(getAttrFmt(o,'label','   label="{0}";'));
			if (o.getColor()!=undefined){
				yy.result("    style=filled;");
				yy.result(getAttrFmt(o,'color','   color="{0}";\n'));
			}
			for(var j in o.OBJECTS){
				var z=o.OBJECTS[j];
				var s=	getAttrFmt(z,'color',',color="{0}"')+
					getShape(shapes.digraph,z.shape,',shape="{0}"')+
					getAttrFmt(z,'style',',style={0}')+
					getAttrFmt(z,'label',',label="{0}"');
				if (s.trim()!="")
					s="["+s.trim().substring(1)+"]";
				yy.result((comma?",":":")+"    "+z.getName()+s+';');
				comma=true;
			}
			yy.result("  }");
		}else if (o instanceof Node){
			var s=	getAttrFmt(o,'color',',fillcolor="{0}",style="filled"')+
				getAttrFmt(o,'image',',image="icons{0}"')+
				getShape(shapes.digraph,o.shape,',shape="{0}"')+
				getAttrFmt(o,'style',',style={0}')+
				getAttrFmt(o,'label',',label="{0}"');
			if (s.trim()!="")
				s="["+s.trim().substring(1)+"]";
			yy.result((comma?",":"")+"  "+o.getName()+s);
			comma=true;
		}
	}
	yy.result(";");
	for(var i in yy.LINKS){
		var l=yy.LINKS[i];
		var t=getAttrFmt(l,'label',',label="{0}"')+
		getAttrFmt(l,'color',',color="{0}"');
		var lt;
		var lr=l.right;
		var ll=l.left;
		
		if (lr instanceof Group){
			//just pick ONE Node from group and use lhead
			//TODO: Assuming it is Node (if Recursive groups implemented, it could be smthg else)
			t+=" lhead=cluster_"+lr.getName();
			lr=lr.OBJECTS[0];
			if (lr==undefined){
				//TODO:Bad thing, EMPTY group..add one invisible node there...
				//But should add already at TOP
			}
		}
		//TODO:Assuming producing DIGRAPH
		//For GRAPH all edges are type --
		//but we could SET arrow type if we'd like
		if (t.trim()!="")
			t=t.trim().substring(1);
		if (l.linkType.indexOf(".")!==-1){
			t+=' style="dotted" ';
		}else if (l.linkType.indexOf("-")!==-1){
			t+=' style="dashed" ';
		}
		if (l.linkType.indexOf("<")!==-1 &&
		    l.linkType.indexOf(">")!==-1){
			lt="->";
			t+="dir=both";
		}else if (l.linkType.indexOf("<")!==-1){
			var tmp=ll;
			ll=lr;
			lr=tmp;
			lt="->";
		}else if (l.linkType.indexOf(">")!==-1){
			lt="->";
		}else{
			//is dotted or dashed no direction
			lt="->";
			t+="dir=none";
		}
		if (t.trim()!="")
			t="["+t+"]";
		yy.result(ll.getName()+lt+lr.getName()+t+";");
	}
	yy.result("}");
}
