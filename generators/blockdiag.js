//http://blockdiag.com/en/blockdiag/examples.html#simple-diagram
//node parse.js state2.txt blockdiag |blockdiag -Tpng -o a.png - && open a.png
//available shapes
//box,square,roundedbox,dots
//circle,ellipse,diamond,minidiamond
//note,mail,cloud,actor
//flowchart.beginpoint,flowchart.endpoint
//flowchart.condition,flowchart.database,flowchart.terminator,flowchart.input
//flowchart.loopin,flowchart.loopout
function blockdiag(yy){
	yy.result("blockdiag{\n default_fontsize = 16\n");
	var r=getGraphRoot(yy);
	if (r.getDirection()==="portrait"){
		yy.result("orientation=portrait");
	}else{
		//DEFAULT
		yy.result("orientation=landscape");
	}
	var s=r.getStart();
	for(var i in yy.OBJECTS){
		var o=yy.OBJECTS[i];
		if (o instanceof Group){
			yy.result('group "'+o.getLabel()+'"{');
			yy.result(getAttrFmt(o,'color','color="{0}"'));
			yy.result(getAttrFmt(o,'label','label="{0}"'));
			if (s.trim()!="")
				s="["+s.trim().substring(1)+"]";
			for(var j in o.OBJECTS){
				var z=o.OBJECTS[j];
				var s=	getAttrFmt(z,'color',',color="{0}"')+
					getShape(shapes.blockdiag,z.shape,',shape="{0}"')+
					getAttrFmt(z,'label',',label="{0}"');
				if (s.trim()!="")
					s="["+s.trim().substring(1)+"]";
				yy.result(z.getName()+s+';');
			}
			yy.result("}");
		}else{
			//ICON does not work, using background
			var s=	getAttrFmt(o,'color',',color="{0}"')+
				getAttrFmt(o,'image',',background="icons{0}"')+
				getShape(shapes.blockdiag,o.shape,',shape="{0}"')+
				getAttrFmt(o,'label',',label="{0}"');
			if (s.trim()!="")
				s="["+s.trim().substring(1)+"]";
			yy.result(o.getName()+s+';');
		}
	}
	for(var i in yy.LINKS){
		var l=yy.LINKS[i];
		yy.result(l.left.getName()+" -> "+l.right.getName()+";");
	}
	yy.result("}");
}
