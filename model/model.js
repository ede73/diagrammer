function processVariable(yy, variable) {
    //ASSIGN VARIABLE
    //$(NAME:CONTENT...)
    // or
    // refer variable
    //$(NAME)
    var vari = variable.slice(2, -1);
    if (vari.indexOf(":") !== -1) {
        //Assignment
        var tmp = vari.split(":");
        debug("GOT assignment " + tmp[0] + "=" + tmp[1]);
        getVariables(yy)[tmp[0]] = tmp[1];
        return tmp[1];
    } else {
        //referral
        if (!getVariables(yy)[vari]) {
            throw new Error("Variable " + vari + " not defined");
        }
        return getVariables(yy)[vari];
    }
}

function getVariables(yy) {
    if (!yy.VARIABLES) {
        yy.VARIABLES = {}
    }
    return yy.VARIABLES;
}

function getGraphRoot(yy) {
    //debug(" getGraphRoot "+yy);
    if (!yy.GRAPHROOT) {
        debug(" no graphroot,init - in getGraphRoot");
        if (yy.result === undefined) {
            yy.result = function(str) {
                console.log(str);
            }
        }
        debug("  ...Initialize emptyroot " + yy);
        yy.CURRENTCONTAINER = new Array();
        yy.LINKS = new Array();
        yy.GRAPHROOT = new GraphRoot();
        //yy.GRAPHROOT.setCurrentContainer(yy.GRAPHROOT);
        enterContainer(yy, yy.GRAPHROOT);
    }
    return yy.GRAPHROOT;
}
//Direct accessor, though graphroot governs!

function getCurrentContainer(yy) {
    //debug(" getCurrentContainer of "+yy);
    var x = getGraphRoot(yy).getCurrentContainer();
    if (x == undefined) debug(" ERROR: Container undefined");
    if (x.OBJECTS == undefined) {
        if (x instanceof Array) debug(" Container is Array");
        if (x instanceof Group) debug(" Container is Group");
        if (x instanceof Node) debug(" Container is Node");
        if (x instanceof Link) debug(" Container is Link");
        debug(" ERROR: Containers " + typeof(x) + "object store undefined");
    }
    return x;
}
//Direct accessor, though graphroot governs!
//Return the current container...(the NEW GROUP)
/*function setCurrentContainer(yy,ctr){
	if (!(ctr instanceof Group || ctr instanceof GraphRoot)){
		throw new Error("Trying to set container other than Group/GraphRoot:"+typeof(ctr));
	}
	debug(" setCurrentContainer "+yy);
	return getGraphRoot(yy).setCurrentContainer(ctr);
}*/
//LHS=Node(z1)
function getList(yy, LHS, RHS) {
    if (LHS instanceof Node) {
        debug(" getList(" + LHS + "," + RHS + ")");
        var x = new Array();
        x.push(LHS);
        x.push(getNode(yy, RHS));
        return x;
    }
    debug(" getList([" + LHS + "]," + RHS);
    //LHS not a node..
    LHS.push(getNode(yy, RHS));
    return LHS;
}
/**
See readNodeOrGroup in grammar

Must be able to return Group as wlel..if NAME matches...
*/
function getNode(yy, name) {
    debug(" getNode " + name);
    if (name instanceof Node) {
        return name;
    }
    if (name instanceof Array) {
        return name;
    }

    var search = function s(container, name) {
        if (container.getName() == name) return container;
        for (var i in container.OBJECTS) {
            var o = container.OBJECTS[i];
            if (o instanceof Node && o.getName() == name) {
                return o;
            }
            if (o instanceof Group) {
                var found = s(o, name);
                if (found != undefined) return found;
            }
        }
        return undefined;
    }(getGraphRoot(yy), name);
    if (search != undefined) return search;
    debug(" Create new node");
    var n = new Node(name, getGraphRoot(yy).getCurrentShape());
    
    getDefaultAttribute(yy,'nodecolor',function(color){
    	n.setColor(color);
    });
    return pushObject(yy, n);
}
/** 
 * Get default attribute nodecolor,linkcolor,groupcolor
 * and bubble upwards if otherwise 'unobtainable'
 */
function getDefaultAttribute(yy,attrname,x){
  //no need for the value, but runs init if missing
  getGraphRoot(yy);
  //debug("getDefaultAttribute "+attrname);
  for(var i in yy.CURRENTCONTAINER){
  	  var ctr=yy.CURRENTCONTAINER[i];
  	  var a=ctr.getDefault(attrname);
  	  debug("  traverse getDefaultAttribute "+attrname+" from "+ctr+" as "+a);
  	  if (a!==undefined){
  	  	  debug("getDefaultAttribute "+attrname+" from "+ctr+"=("+a+")");
  	  	  if (x!==undefined)
  	  	    x(a);
  	  	  return a;
  	  }
  }
  var a=getGraphRoot(yy).getDefault(attrname);
  if (a!==undefined){
  debug("getDefaultAttribute got from graphroot");
	  if (x!==undefined)
		x(a);
	  return a;
  }
  //debug("getDefaultAttribute FAILED");
  return undefined;
}
function getCurrentContainer(yy) {
	//no need for value, but runs init if missing
	getGraphRoot(yy);
    return yy.CURRENTCONTAINER[yy.CURRENTCONTAINER.length - 1];
}

function enterContainer(yy, container) {
    yy.CURRENTCONTAINER.push(container);
    //yy.GRAPHROOT.setCurrentContainer(yy.GRAPHROOT);
    return container;
}
//exit a container, next one popped is the new CURRENT

function exitContainer(yy) {
    if (yy.CURRENTCONTAINER.length<=1)
        throw new Error("INTERNAL ERROR:Trying to exist ROOT container");
    return yy.CURRENTCONTAINER.pop();
}

/**
 * Create a NEW GROUP if one (ref) does not exist yet
 * getGroup(yy) => create a new anonymous group
 * getGroup(yy,GroupRef) => create a new group if GroupRef is not a Group
 *    or return GroupRef if it is...1
 */
function getGroup(yy, ref) {
    if (ref instanceof Group) return ref;
    debug(" getGroup() NEW GROUP:" + yy + "/" + ref);
    if (yy.GROUPIDS == undefined) yy.GROUPIDS = 1;
    var newGroup = new Group(yy.GROUPIDS++);
    debug(" push group " + newGroup + " to " + yy);
    pushObject(yy, newGroup);
    
    getDefaultAttribute(yy,'groupcolor',function(color){
    	newGroup.setColor(color);
    });
    return newGroup;
}
//Get a link such that l links to r, return the added LINK or LINKS

/**
 * linkType >,<,.>,<.,->,<-,<>
 * l = left side, Node(xxx) or Group(yyy), or Array(smthg)
 * r = right side, Node(xxx) or Group(yyy), or Array(smthg)
 * label = if defined, LABEL for the link
 * color = if defined, COLOR for the link
 */
function getLink(yy, linkType, l, r, label, color) {
    if (l instanceof Array) {
        debug(" getLink called with LHS array");
        var lastLink;
        for (var i = 0; i < l.length; i++) {
            debug(" Get link " + l[i]);
            lastLink = getLink(yy, linkType, l[i], r, label, color);
        }
        return lastLink;
    }
    if (r instanceof Array) {
        debug(" getLink called with RHS array");
        var lastLink;
        for (var i = 0; i < r.length; i++) {
            debug(" Get link " + r[i]);
            lastLink = getLink(yy, linkType, l, r[i], label, color);
        }
        return lastLink;
    }
    if (!(l instanceof Node) && !(l instanceof Group)) {
        throw new Error("LHS not a Node nor a Group(" + l + ")");
    }
    if (!(r instanceof Node) && !(r instanceof Group)) {
        throw new Error("RHS not a Node nor a Group(" + r + ")");
    }
    var l = new Link(linkType, l, r);
    getDefaultAttribute(yy,'linkcolor',function(color){
    	l.setColor(color);
    });
    if (label != undefined) l.setLabel(label);
    if (color != undefined) l.setColor(color);
    return addLink(yy, l);
}
//Add link to the list of links, return the LINK

function addLink(yy, l) {
    if (l instanceof Array) {
        debug(" PUSH LINK ARRAY:" + l);
    } else {
        debug(" PUSH LINK:" + l);
    }
    yy.LINKS.push(l);
    return l;
}

function pushObject(yy, o) {
    debug("  pushObject " + o + "to " + getCurrentContainer(yy));
    getCurrentContainer(yy).OBJECTS.push(o);
    return o;
}
//test if container has the object
//TODO: Recurse

function containsObject(container, o) {
    for (var i in container.OBJECTS) {
        var c = container.OBJECTS[i];
        if (c == o) {
            return true;
        }
        if (c instanceof Group) {
            if (containsObject(c, o)) {
                return true;
            }
        }
    }
    return false;
}

function GraphObject(label) {
    this.setName = function(value) {
        return setAttr(this, 'name', value);
    };
    this.getName = function() {
        return getAttr(this, 'name');
    }
    this.setColor = function(value) {
        return setAttr(this, 'color', value);
    };
    this.getColor = function() {
        return getAttr(this, 'color');
    }
    this.setTextColor = function(value) {
        return setAttr(this, 'textcolor', value);
    };
    this.getTextColor = function() {
    	return getAttr(this, 'textcolor');
    }
    this.label = label;
    this.setLabel = function(value) {
    	value=value.trim();
    	debug("TEST value("+value+") for color");
    	var m=value.match(/^(#[A-Fa-f0-9]{6,6})(.*)$/);
    	debug(m);
    	if (m!==null && m.length==3){
    		this.setTextColor(m[1]);
    		value=m[2].trim();
    	}
        return setAttr(this, 'label', value);
    };
    this.getLabel = function() {
        return getAttr(this, 'label');
    }
    this.toString = function() {
        return "GraphObject";
    };
}

Node.prototype = new GraphObject();
Node.prototype.constructor = Node;

function Node(name, shape) {
    this.name = name;
    this.shape = shape;
    this.image;
    this.style;
    this.setShape = function(value) {
        return setAttr(this, 'shape', value);
    };
    this.getShape = function() {
        return getAttr(this, 'shape');
    }
    this.setStyle = function(value) {
        return setAttr(this, 'style', value);
    };
    this.getStyle = function() {
        return getAttr(this, 'style');
    }
    this.setImage = function(value) {
        return setAttr(this, 'image', value);
    };
    this.getImage = function() {
        return getAttr(this, 'image');
    }
    this.toString = function() {
        return "Node(" + this.getName() + getAttrFmt(this, 'color', ',color={0}') + getAttrFmt(this, 'label', ',label={0}') + ")";
    };
}
Group.prototype = new GraphObject();
Group.prototype.constructor = Group;

function Group(name) {
    this.name = name;
    this.OBJECTS = new Array();
    //Save EQUAL node ranking
    this.setEqual = function(value) {
        return setAttr(this, 'equal', value);
    };
    this.getEqual = function() {
        return getAttr(this, 'equal');
    }
    /**
     * Set default nodecolor, groupcolor, linkcolor
     * Always ask from the currentContainer first
     */
    this.setDefault = function(key,value) {
    	debug("Set group "+key+ " to "+value);
        return setAttr(this, key, value);
    };
    this.getDefault = function(key) {
    	debug("Get group "+key);
        return getAttr(this, key);
    };
    this.toString = function() {
        return "Group(" + this.name + ")";
    };
}
GraphRoot.prototype = new GraphObject();
GraphRoot.prototype.constructor = GraphRoot;

function GraphRoot() {
    this.OBJECTS = new Array();
    this.setGenerator = function(value) {
        return setAttr(this, 'generator', value);
    };
    this.getGenerator = function() {
        return getAttr(this, 'generator');
    };
    this.setVisualizer = function(value) {
        return setAttr(this, 'visualizer', value);
    };
    this.getVisualizer = function() {
        return getAttr(this, 'visualizer');
    };
    this.setCurrentShape = function(value) {
        return setAttr(this, 'shape', value);
    };
    this.getCurrentShape = function() {
        return getAttr(this, 'shape');
    };
    this.setDirection = function(value) {
        return setAttr(this, 'direction', value);
    };
    this.getDirection = function() {
        return getAttr(this, 'direction');
    };
    this.setStart = function(value) {
        return setAttr(this, 'start', value);
    };
    this.getStart = function() {
        return getAttr(this, 'start');
    };
    //Save EQUAL node ranking
    this.setEqual = function(value) {
        return setAttr(this, 'equal', value);
    };
    this.getEqual = function() {
        return getAttr(this, 'equal');
    };
    /**
     * Set default nodecolor, groupcolor, linkcolor
     * Always ask from the currentContainer first
     */
    this.setDefault = function(key,value) {
    	debug("Set ROOT "+key+ " to "+value);
        return setAttr(this,  key,value);
    };
    this.getDefault = function(key) {
    	debug("Get ROOT "+key);
        return getAttr(this, key);
    };
    this.toString = function() {
        return "GraphRoot";
    };
}
Link.prototype = new GraphObject();
Link.prototype.constructor = Link;

function Link(linkType, l, r) {
    this.linkType = linkType.trim();
    this.left = l;
    this.right = r;
    this.toString = function() {
        return "Link(" + this.linkType + "== L" +
            this.left.toString() + ", R" +
            this.right.toString() + ",label=" +
            this.getLabel() + ")";
    };
}

function getShape(shapes, o, fmt) {
    if (o == undefined || o == 0) return "";
    if (o in shapes)
        return ' ' + fmt.format(shapes[o]) + ' ';
    else
        return ' ' + fmt.format(shapes.
        default) + ' ';
}

var shapes = {
    blockdiag: {
        default: "box",
        invis: "invis",
        /*TODO?*/
        record: "box",
        doublecircle: "endpoint",
        box: "box",
        rect: "box",
        rectangle: "box",
        square: "square",
        roundedbox: "roundedbox",
        dots: "dots",
        circle: "circle",
        ellipse: "ellipse",
        diamond: "diamond",
        minidiamond: "minidiamond",
        note: "note",
        mail: "mail",
        cloud: "cloud",
        actor: "actor",
        beginpoint: "flowchart.beginpoint",
        endpoint: "flowchart.endpoint",
        condition: "flowchart.condition",
        database: "flowchart.database",
        terminator: "flowchart.terminator",
        input: "flowchart.input",
        loopin: "flowchart.loopin",
        loop: "flowchart.loopin",
        loopstart: "flowchart.loopin",
        loopout: "flowchart.loopout",
        loopend: "flowchart.loopout"
    },
    actdiag: {
        default: "box",
        invis: "invis",
        /*TODO?*/
        record: "box",
        doublecircle: "endpoint",
        box: "box",
        rect: "box",
        rectangle: "box",
        square: "square",
        roundedbox: "roundedbox",
        dots: "dots",
        circle: "circle",
        ellipse: "ellipse",
        diamond: "diamond",
        minidiamond: "minidiamond",
        note: "note",
        mail: "mail",
        cloud: "cloud",
        actor: "actor",
        beginpoint: "flowchart.beginpoint",
        endpoint: "flowchart.endpoint",
        condition: "flowchart.condition",
        database: "flowchart.database",
        terminator: "flowchart.terminator",
        input: "flowchart.input",
        loopin: "flowchart.loopin",
        loop: "flowchart.loopin",
        loopstart: "flowchart.loopin",
        loopout: "flowchart.loopout",
        loopend: "flowchart.loopout"
    },
    digraph: {
        default: "box",
        invis: "invis",
        record: "record",
        doublecircle: "doublecircle",
        box: "box",
        rect: "box",
        rectangle: "box",
        square: "square",
        roundedbox: "box",
        dots: "point",
        circle: "circle",
        ellipse: "ellipse",
        diamond: "diamond",
        minidiamond: "Mdiamond",
        minisquare: "Msquare",
        note: "note",
        mail: "tab",
        cloud: "tripleoctagon",
        actor: "cds",
        beginpoint: "circle",
        endpoint: "doublecircle",
        condition: "Mdiamond",
        database: "Mcircle",
        terminator: "ellipse",
        input: "parallelogram",
        loopin: "house",
        loop: "house",
        loopstart: "house",
        loopout: "invhouse",
        loopend: "invhouse"
    }
};
