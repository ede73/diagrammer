function plantuml_sequence(yy) {
    var depth=0;
    function indent(msg){
    	    if (msg.trim()=="")return "";
    	    var prefix="";
    	    for(var i=0;i<depth;i++){
    	    	    prefix+="  ";
    	    }
    	    return prefix+msg;
    }
	var processANode = function(o) {
		var nattrs=[];
		var styles=[];
		//getAttrFmt(o, 'color', 'fillcolor="{0}"',nattrs);
		//getAttrFmt(o,'color','filled',styles);
		getAttrFmt(o, 'style', '{0}',styles);
		if (styles.length>0){
			if (styles.join("").indexOf('singularity')!==-1){
				//invis node is not singularity!, circle with minimal width/height IS!
				nattrs.push('shape="circle"');
				nattrs.push('label=""');
				nattrs.push("width=0.01");
				nattrs.push("weight=0.01");
			}else{
				nattrs.push('style="'+styles.join(",")+'"');
			}
		}
		getAttrFmt(o, 'image', 'image="icons{0}"',nattrs);
		getAttrFmt(o, 'textcolor', 'fontcolor="{0}"',nattrs);
		var r=getShape(shapes.digraph, o.shape, 'shape="{0}"');
		if (r){
			nattrs.push(r);
		}
		var t="";
		if (nattrs.length>0)
			t="["+nattrs.join(",")+"]";
        yy.result(indent( "participant "+getAttrFmt(o, 'label', '"{0}" as')+" "+o.getName() + t));
    };
    
    var r = getGraphRoot(yy);
    if (r.getVisualizer()) {
        yy.result("/* render:" + r.getVisualizer() + "*/")
    }
    yy.result("@startuml");
    yy.result("autonumber");
    /*if (r.getDirection() === "portrait") {
        yy.result(indent("rankdir=LR;"));
    } else {
        yy.result(indent("rankdir=TD;"));
    }*/
    //This may FORWARD DECLARE a node...which creates problems with coloring
    var s = r.getStart();
    if (s != undefined && s != "") {
    	var fwd=getNode(yy,s);
    	processANode(fwd);
        //    {$$="  {rank = same;null}\n  {rank = same; "+$2+"}\n  null [shape=plaintext, label=\"\"];\n"+$2+"[shape=doublecircle];\nnull->"+$2+";\n";}
        //yy.result(indent("//startnode setup\n  {rank = same;null} {rank = same; " + s + "}\n  null [shape=plaintext, label=\"\"];\n  " + s + "[shape=doublecircle];\n  null->" + s + ";\n"));
    }
    //This may FORWARD DECLARE a node...which creates problems with coloring
/*    if (r.getEqual() != undefined && r.getEqual().length > 0) {
        yy.result(indent("{rank=same;"));
        for (var x = 0; x < r.getEqual().length; x++) {
            yy.result(indent(r.getEqual()[x].getName() + ";"));
        }
        yy.result("}");
    }*/
/*    var fixgroup = function(c) {
        for (var i in c.OBJECTS) {
            var o = c.OBJECTS[i];
            if (o instanceof Group) {
                if (o.OBJECTS.length == 0) {
                    o.OBJECTS.push(new Node("invis_" + o.getName()).setStyle("invis"));
                } else {
                    //A group...non empty...parse inside
                    fixgroup(o);
                }
            }
        }
    }(r.OBJECTS);
*/
    //print only NON PRINTED container links. If first non printed link is NOT for this continer, break out immediately
    //this is to emulate ORDERED nodes of plantuml (node=edge,node,link.group...all in order for this fucker)
    var printLinks=function printLinks(container){
    for (var i in yy.LINKS) {
        var l = yy.LINKS[i];
        if (l.printed) continue;
        //if container given, print ONLY THOSE links that match this container!
        if (l.container!==container) break;
        l.printed=true;
        var attrs=[];
        var note="";
        var label=getAttr(l, 'label');
        if (label){
        	if( label.indexOf("::")!==-1){
        		label=label.split("::");
        		note=label[1].trim();
        	}
        }
        var color=getAttrFmt(l, 'color', '[{0}]').trim();
        //getAttrFmt(l, ['textcolor','color'] ,'fontcolor="{0}"',attrs);
        var lt;
        var lr = l.right;
        var ll = l.left;

        //yy.result(indent("//"+lr));
        if (lr instanceof Group) {
            //just pick ONE Node from group and use lhead
            //TODO: Assuming it is Node (if Recursive groups implemented, it could be smthg else)
            //attrs.push(" lhead=cluster_" + lr.getName());
            //TODO:
            lr = lr.OBJECTS[0];
            if (lr == undefined) {
                //TODO:Bad thing, EMPTY group..add one invisible node there...
                //But should add already at TOP
            }
        }
        if (ll instanceof Group) {
            //attrs.push(" ltail=cluster_" + ll.getName());
            //TODO:
            ll = ll.OBJECTS[0];
            if (ll == undefined) {
            	//Same as above
            }
        }
        //TODO:Assuming producing DIGRAPH
        //For GRAPH all edges are type --
        //but we could SET arrow type if we'd like
        if (l.linkType.indexOf("/") !== -1) {
        	//TODO: Somehow denote better this "quite does not reach"
        	//even though such an edge type MAKES NO SENSE in a graph
            //attrs.push('arrowhead="tee"');
            //TODO:
        }
        var dot = false;
        var dash = false;
        var broken=false;
        if (l.linkType.indexOf(".") !== -1) {
            dot = true;
        } else if (l.linkType.indexOf("-") !== -1) {
            dash = true;
        } else if (l.linkType.indexOf("/") !== -1) {
        	//attrs.push("failed");
            //TODO:
        }
        var swap=false;
        if (l.linkType.indexOf("<") !== -1 &&
            l.linkType.indexOf(">") !== -1) {
            lt = (dot?"-":"")+"-"+color+">";
            swap=true;
        } else if (l.linkType.indexOf("<") !== -1) {
            var tmp = ll;
            ll = lr;
            lr = tmp;
            lt = (dot?"-":"")+"-"+color+">";
        } else if (l.linkType.indexOf(">") !== -1) {
            lt = (dot?"-":"")+"-"+color+">";
        } else if (dot) {
            //dotted
            yy.result(getAttrFmt(l, 'label', '...{0}...'));
            continue;
        } else if (dash) {
            //dashed
            yy.result(getAttrFmt(l, 'label', '=={0}=='));
            continue;
        } else {
            //is dotted or dashed no direction
            lt = "-"+color+">";
            //attrs.push("dir=none");
        }
        var t="";
        //if (attrs.length>0)
        //    t = "[" + attrs.join(",") + "]";
        if (label) label=":"+label;else label="";
        yy.result(indent(ll.getName() + lt + lr.getName() + t+label));
        if (swap)
        yy.result(indent(lr.getName() + lt + ll.getName() + t+label));
        if (note!=""){
        	yy.result(indent("note over "+lr.getName()));
        	yy.result(note.replace(/\\n/g,"\n"));
        	yy.result(indent("end note"));
        }
    }
    };
    
    var traverseObjects = function traverseObjects(r) {
    	//Dump this groups participants first...
        for (var i in r.OBJECTS) {
            var o = r.OBJECTS[i];
            if (o instanceof Node)
                processANode(o);
        }
        printLinks(r);
        for (var i in r.OBJECTS) {
            var o = r.OBJECTS[i];
            if (o instanceof Group) {
                //TODO:
                //Group name,OBJECTS,get/setEqual,toString
                var processAGroup = function(o) {
                    debug(JSON.stringify(o));
                    var cond=getAttr(o,'conditional');
                    if (cond){
                    	if (cond=="if")cond="alt";
                    	else if (cond=="elseif")cond="else";
                    	else if (cond=="else")cond="else";
                    	else if (cond=="endif")cond="end";
                    }else{
                    	cond="ref";
                    }
                    yy.result(indent(cond+' ' + o.getLabel()));
                    if (o.getColor()!==undefined) {
                        yy.result(indent("style=filled;"));
                        yy.result(indent(getAttrFmt(o, 'color', '   color="{0}";\n')));
                    }
                    depth++;
                    traverseObjects(o);
                    printLinks(o);
                    depth--;
                    //yy.result(indent("}//end of " + o.getName()));
                }(o);
            } else if (!o instanceof Node){
                throw new Error("Not a node nor a group, NOT SUPPORTED");
            }
        }
    }(r);
    printLinks(r);

    yy.result("@enduml");
}
