//node parse.js state2.txt actdiag |actdiag -Tpng -o a.png - && open a.png
function actdiag(yy){
	yy.result("actdiag{\n  default_fontsize = 16");
	var r=getGraphRoot(yy);
	/* does not really work..but portrait mode
	if (r.getDirection()==="portrait"){
		yy.result("  orientation=portrait");
	}else{
		//DEFAULT
		yy.result("  orientation=landscape");
	}*/
	var s=r.getStart();
	for(var i in r.OBJECTS){
		var o=r.OBJECTS[i];
		if (o instanceof Group){
			yy.result('  lane "'+o.getLabel()+'"{');
			for(var j in o.OBJECTS){
				var z=o.OBJECTS[j];
				var s=	getAttrFmt(z,'color',',color="{0}"')+
					getShape(shapes.actdiag,z.shape,',shape={0}')+
					getAttrFmt(z,'label',',label="{0}"');
				if (s.trim()!="")
					s="["+s.trim().substring(1)+"]";
				yy.result("    "+z.getName()+s+';');
			}
			yy.result("  }");
		}else{
			//ICON does not work, using background
			var s=	getAttrFmt(o,'color',',color="{0}"')+
				getAttrFmt(o,'image',',background="icons{0}"')+
				getShape(shapes.actdiag,o.shape,',shape={0}')+
				getAttrFmt(o,'label',',label="{0}"');
			if (s.trim()!="")
				s="["+s.trim().substring(1)+"]";
			yy.result("  "+o.getName()+s+';');
		}
	}
	for(var i in yy.LINKS){
		var l=yy.LINKS[i];
		yy.result("  "+l.left.getName()+" -> "+l.right.getName()+";");
	}
	yy.result("}");
}
