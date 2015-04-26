//noinspection JSUnusedGlobalSymbols,JSUnusedGlobalSymbols
/**
 *
 * Called from grammar to inject a new (COLOR) variable
 * Only colors supported currently, though there's really no limitation
 *
 * If this is assignment, rewrite the variable, else assign new
 * Always return the current value
 *
 * @param yy Lexer yy
 * @param variable ${XXX:yyy} assignment or ${XXX} query
 */
function processVariable(yy, variable) {
    // ASSIGN VARIABLE
    // $(NAME:CONTENT...)
    // or
    // refer variable
    // $(NAME)
    var vari = variable.slice(2, -1);
    if (vari.indexOf(":") !== -1) {
        // Assignment
        var tmp = vari.split(":");
        debug("GOT assignment " + tmp[0] + "=" + tmp[1]);
        getVariables(yy)[tmp[0]] = tmp[1];
        return tmp[1];
    } else {
        // referral
        if (!getVariables(yy)[vari]) {
            throw new Error("Variable " + vari + " not defined");
        }
        return getVariables(yy)[vari];
    }
}

/**
 * Return all the variables from the collection (hard coded to yy)
 */
function getVariables(yy) {
    if (!yy.VARIABLES) {
        yy.VARIABLES = {}
    }
    return yy.VARIABLES;
}

/**
 * Get current singleton graphroot or create  new one
 */
function getGraphRoot(yy) {
    // debug(" getGraphRoot "+yy);
    if (!yy.GRAPHROOT) {
        //debug("no graphroot,init - in getGraphRoot",true);
        if (yy.result === undefined) {
            yy.result = function (str) {
                console.log(str);
            }
        }
        debug("...Initialize emptyroot " + yy);
        yy.CURRENTCONTAINER = [];
        yy.LINKS = [];
        yy.CONTAINER_EXIT = 1;
        yy.GRAPHROOT = new GraphRoot();
        // yy.GRAPHROOT.setCurrentContainer(yy.GRAPHROOT);
        enterContainer(yy, yy.GRAPHROOT);
        //debug(false);
    }
    return yy.GRAPHROOT;
}

/**
 * Return current container. If none specified, it is GRAPHROOT
 *
 * Current container can be (in therory):
 * array -> link list
 * group -> well, a group
 * node ->
 * link ->
 *
 * Direct accessor, though graphroot governs!
 * TODO: DUAL DECLARATION - this function never used
 */
//function getCurrentContainer_ERROR(yy) {
//    var x = getGraphRoot(yy).getCurrentContainer();
//    if (x == undefined) debug(" ERROR: Container undefined");
//    if (x.OBJECTS == undefined) {
//        if (x instanceof Array) debug(" Container is Array");
//        if (x instanceof Group) debug(" Container is Group");
//        if (x instanceof Node) debug(" Container is Node");
//        if (x instanceof Link) debug(" Container is Link");
//        debug(" ERROR: Containers " + typeof(x) + "object store undefined");
//    }
//    return x;
//}

/**
 * function setCurrentContainer(yy,ctr){ if (!(ctr instanceof Group || ctr
 * instanceof GraphRoot)){ throw new Error("Trying to set container other than
 * Group/GraphRoot:"+typeof(ctr)); } debug(" setCurrentContainer "+yy); return
 * getGraphRoot(yy).setCurrentContainer(ctr); }
 */
// LHS=Node(z1)
/**
 * Create an array, push LHS,RHS nodes there and return the array as long as
 * processing the list nodes added to array..
 *
 * @param yy Lexer yy
 * @param LHS left hand side of the list
 * @param RHS right hand side of the list
 * @param rhsLinkLabel optional RHS label
 */
function getList(yy, LHS, RHS, rhsLinkLabel) {
    if (LHS instanceof Node) {
        debug("getList(node:" + LHS + ",rhs:[" + RHS + "])",true);
        var x = [];
        x.push(LHS);
	//TODO assuming RHS is Node
        x.push(getNode(yy, RHS).setLinkLabel(rhsLinkLabel));
        debug("return node:"+x,false);
        return x;
    }
    if (LHS instanceof Group) {
        debug("getList(group:[" + LHS + "],rhs:" + RHS + ")",true);
        var x = [];
        x.push(LHS);
	//TODO assuming RHS is Group
        x.push(getGroup(yy, RHS).setLinkLabel(rhsLinkLabel));
        debug("return group:"+x,false);
        return x;
    }
    debug("getList(lhs:[" + LHS + "],rhs:" + RHS,true);
    // LHS not a node..
    LHS.push(getNode(yy, RHS).setLinkLabel(rhsLinkLabel));
    debug("return ["+LHS+"]",false);
    return LHS;
}
/**
 * See readNodeOrGroup in grammar
 *
 * Return matching Node,Array,Group
 *
 * If no match, create a new node
 *
 * STYLE will always be updated on last occurance (ie. dashed a1
 * dotted a1>b1 - only for nodes!
 *
 * node a1 will be dotted instead of being dashed
 *
 * @param yy Lexer yy
 * @param name Reference, Node/Array/Group
 * @param [style] OPTIONAL if style given, update (only if name refers to node)
 */
function getNode(yy, name, style) {
    //debug("getNode (name:"+name+",style:"+style+")",true);
    function cc(yy, name, style) {
        if (name instanceof Node) {
            if (style) name.setStyle(style);
            return name;
        }
        if (name instanceof Array) {
            return name;
        }

        var search = function s(container, name) {
            if (container.getName() == name) return container;
            for (var i in container.OBJECTS) {
                if (!container.OBJECTS.hasOwnProperty(i))continue;
                var o = container.OBJECTS[i];
                if (o instanceof Node && o.getName() == name) {
                    if (style) o.setStyle(style);
                    return o;
                }
                if (o instanceof Group) {
                    var found = s(o, name);
                    if (found != undefined) return found;
                }
            }
            return undefined;
        }(getGraphRoot(yy), name);
        if (search !== undefined) {
            return search;
        }
        //debug("Create new node name="+name,true);
        var n = new Node(name, getGraphRoot(yy).getCurrentShape());
        if (style) n.setStyle(style);

        getDefaultAttribute(yy, 'nodecolor', function (color) {
            n.setColor(color);
        });
        getDefaultAttribute(yy, 'nodetextcolor', function (color) {
            n.setTextColor(color);
        });
        //debug(false);
        return pushObject(yy, n);
    }

    var node = cc(yy, name, style);
    //debug("  in getNode gotNode " + node);
    yy.lastSeenNode = node;
    if (yy.collectNextNode) {
        //debug("Collect next node");
        setAttr(yy.collectNextNode, 'exitlink', name);
        yy.collectNextNode = undefined;
    }
    //debug(false);
    return node;
}
/**
 * Get default attribute nodecolor,linkcolor,groupcolor and bubble upwards if
 * otherwise 'unobtainable'
 *
 * @param yy lexer
 * @param attrname Name of the default attribute. If not found, returns undefined
 * @param [x] Pass the attribute to the this function as only argument - if attribute WAS actually defined!
 */
function getDefaultAttribute(yy, attrname, x) {
    // no need for the value, but runs init if missing
    getGraphRoot(yy);
    // debug("getDefaultAttribute "+attrname);
    var a;
    for (var i in yy.CURRENTCONTAINER) {
        if (!yy.CURRENTCONTAINER.hasOwnProperty(i))continue;
        var ctr = yy.CURRENTCONTAINER[i];
        a = ctr.getDefault(attrname);
        // debug(" traverse getDefaultAttribute "+attrname+" from "+ctr+" as
        // "+a);
        if (a !== undefined) {
            // debug("getDefaultAttribute "+attrname+" from "+ctr+"=("+a+")");
            if (x !== undefined)
                x(a);
            return a;
        }
    }
    a = getGraphRoot(yy).getDefault(attrname);
    if (a !== undefined) {
        //debug("getDefaultAttribute got from graphroot");
        if (x !== undefined)
            x(a);
        return a;
    }
    // debug("getDefaultAttribute FAILED");
    return undefined;
}

/**
 * TODO: DUAL DECLARATION
 *
 * Get current container
 * @para, yy Lexer
 */
function getCurrentContainer(yy) {
    // no need for value, but runs init if missing
    getGraphRoot(yy);
    return yy.CURRENTCONTAINER[yy.CURRENTCONTAINER.length - 1];
}

/**
 * Enter into a new container, set it as current container
 * @param yy lexer
 * @param container Set this container as current container
 */
function enterContainer(yy, container) {
    yy.CURRENTCONTAINER.push(container);
    // yy.GRAPHROOT.setCurrentContainer(yy.GRAPHROOT);
    return container;
}

//noinspection JSUnusedGlobalSymbols
/**
 * Exit the current container
 * Return the previous one
 * Previous one also set as current container
 * @param yy lexer
 */
function exitContainer(yy) {
    if (yy.CURRENTCONTAINER.length <= 1)
        throw new Error("INTERNAL ERROR:Trying to exit ROOT container");
    return setAttr(yy.CURRENTCONTAINER.pop(), 'exitnode', yy.CONTAINER_EXIT++);
}

/**
 * Enter to a new parented sub graph
 * like in a>(b>c,d,e)>h
 *
 * Edit grammar so it links a>b and c,d,e to h
 * Ie exit node(s) and enrance node(s) linked properly
 */
function enterSubGraph(yy) {
    return enterContainer(yy, getSubGraph(yy));
}

function hasOutwardLink(yy,node) {
    for (var i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i))continue;
        var r = yy.LINKS[i];
        if (r.left.name === node.name){
            return true;
        }
    }
    return false;
}

/**
 * return true if node has inward link OUTSIDE container it is in
 */
function hasInwardLink(yy, node, nodesContainer) {
    for (var i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i))continue;
        var r = yy.LINKS[i];
	if (nodesContainer !== undefined &&
	    r.container.name === nodesContainer.name) {
	    continue;
	}
	if (r.right.name === node.name) {
            return true;
        }
    }
    return false;
}

function exitSubGraph(yy) {
    return exitContainer(yy);
}

//noinspection JSUnusedGlobalSymbols
/**
 * Create a NEW GROUP if one (ref) does not exist yet getGroup(yy) => create a
 * new anonymous group getGroup(yy,GroupRef) => create a new group if GroupRef
 * is not a Group or return GroupRef if it is...1
 * @param yy lexer
 * @param ref Type of reference, if group, return it
 * @return ref if ref instance of group, else the newly created group
 */
function getGroup(yy, ref) {
    if (ref instanceof Group) return ref;
    debug("getGroup() NEW GROUP:" + yy + "/" + ref,true);
    if (yy.GROUPIDS === undefined) yy.GROUPIDS = 1;
    var newGroup = new Group(yy.GROUPIDS++);
    debug("push group " + newGroup + " to " + yy);
    pushObject(yy, newGroup);

    getDefaultAttribute(yy, 'groupcolor', function (color) {
        newGroup.setColor(color);
    });
    debug(false);
    return newGroup;
}

/**
 * Create a new sub graph
 */
function getSubGraph(yy, ref) {
    if (ref instanceof SubGraph) return ref;
    //debug("getSubGraph() NEW SubGraph:" + yy + "/" + ref,true);
    if (yy.SUBGRAPHS === undefined) yy.SUBGRAPHS = 1;
    var newSubGraph = new SubGraph(yy.SUBGRAPHS++);
    //debug("push SubGraph " + newSubGraph + " to " + yy);
    pushObject(yy, newSubGraph);
    //debug(false);
    return newSubGraph;
}
// Get a link such that l links to r, return the added LINK or LINKS

//noinspection JSUnusedGlobalSymbols
/**
 * linkType >,<,.>,<.,->,<-,<> l = left side, Node(xxx) or Group(yyy), or
 * Array(smthg) r = right side, Node(xxx) or Group(yyy), or Array(smthg) label =
 * if defined, LABEL for the link color = if defined, COLOR for the link
 *
 * if there is a list a>b,c,x,d;X then X is gonna e link label for EVERYONE
 * but for a>"1"b,"2"c link label is gonna be individual! 
 * @param yy lexer
 * @param linkType Type of the link(grammar)
 * @param l Left hand side (must be Array,Node,Group)
 * @param r Right hand side (must be Array,Node,Group)
 * @param [inlineLinkLabel] Optional label for the link
 * @param [commonLinkLabel] Optional label for the link
 * @param [linkColor] Optional color for the link
 * @param [lcompass] Left hand side compass value
 * @param [rcompass] Reft hand side compass value
 * @return the link that got added
 */
function getLink(yy, linkType, l, r, inlineLinkLabel, commonLinkLabel, linkColor, lcompass, rcompass, dontadd) {
    var lastLink;
    var i;
    debug(true);
    if (r instanceof SubGraph && r.getEntrance()==undefined) {
        r.setEntrance(l);
    }
    if (l instanceof SubGraph && l.getExit()==undefined) {
        l.setExit(r);
    }
    if (l instanceof Array) {
        debug("getLink LHS array, type:"+linkType+" l:["+l+"] r:"+r+" inlineLinkLabel:"+inlineLinkLabel+" commonLinkLabel: "+commonLinkLabel+" linkColor:"+linkColor+" lcompass:"+lcompass+" rcompass:"+rcompass);
        for (i = 0; i < l.length; i++) {
            debug("    1Get link " + l[i]);
            lastLink = getLink(yy, linkType, l[i], r, inlineLinkLabel, commonLinkLabel, linkColor, lcompass, rcompass);
        }
        debug(false);
        return lastLink;
    }
    if (r instanceof Array) {
        debug("getLink RHS array, type:"+linkType+" l:"+l+" r:["+r+"] inlineLinkLabel:"+inlineLinkLabel+" commonLinkLabel: "+commonLinkLabel+" linkColor:"+linkColor+" lcompass:"+lcompass+" rcompass:"+rcompass);
        for (i = 0; i < r.length; i++) {
            debug("    2Get link " + r[i]);
            lastLink = getLink(yy, linkType, l, r[i], inlineLinkLabel, commonLinkLabel, linkColor, lcompass, rcompass);
        }
        debug(false);
        return lastLink;
    }
    var fmt = "";
    if (inlineLinkLabel !== undefined)
      fmt += "inlineLinkLabel: "+inlineLinkLabel;
    if (commonLinkLabel !== undefined)
      fmt += "commonLinkLabel: "+commonLinkLabel;
    if (linkColor !== undefined)
      fmt += "linkColor: "+linkColor;
    if (lcompass !== undefined)
      fmt += "lcompass: "+lcompass;
    if (rcompass !== undefined)
      fmt += "rcompass: "+rcompass;
    debug("getLink type:"+linkType+" l:"+l+" r:"+r+fmt);
    if (!(l instanceof Node) && !(l instanceof Group)& !(l instanceof SubGraph)) {
        throw new Error("LHS not a Node,Group nor a SubGraph(LHS=" + l + ") RHS=(" + r + ")");
    }
    if (!(r instanceof Node) && !(r instanceof Group)&& !(r instanceof SubGraph)) {
        throw new Error("RHS not a Node,Group nor a SubGraph(LHS=" + l + ") RHS=(" + r + ")");
    }
    var lnk = new Link(linkType, l, r);

    if (lcompass) setAttr(lnk, 'lcompass', lcompass);
    else if (getAttr(l, 'compass')) setAttr(lnk, 'lcompass', getAttr(l, 'compass'));

    if (rcompass) setAttr(lnk, 'rcompass', rcompass);
    else if (getAttr(r, 'compass')) setAttr(lnk, 'rcompass', getAttr(r, 'compass'));

    getDefaultAttribute(yy, 'linkcolor', function (linkColor) {
        lnk.setColor(linkColor);
    });
    getDefaultAttribute(yy, 'linktextcolor', function (linkColor) {
        lnk.setTextColor(linkColor);
    });
    if (commonLinkLabel != undefined) {
	lnk.setLabel(commonLinkLabel);
	debug("  set commonLinkLabel "+commonLinkLabel);
    }
    if (inlineLinkLabel != undefined) {
	lnk.setLabel(inlineLinkLabel);
	debug("  set inlineLinkLabel "+inlineLinkLabel);
    }
    else if (r instanceof Node && commonLinkLabel != undefined ) {
	lnk.setLabel(commonLinkLabel);
	debug('  set commonLinkLabel '+commonLinkLabel);
    }
    if (r instanceof Node) {
	tmp=r.getLinkLabel();
	if (tmp != undefined ) {
	    lnk.setLabel(tmp);
	    debug('  reset link label to '+tmp);
	}
    }
    if (linkColor != undefined) lnk.setColor(linkColor);

    if (!dontadd)
    addLink(yy, lnk);
    debug(false);
    return lnk;
}

/**
 * Add link to the list of links, return the LINK
 * @param yy lexer
 * @param l Link (Array or Link)
 */
function addLink(yy, l) {
    if (l instanceof Array) {
        debug("PUSH LINK ARRAY:" + l,true);
    } else {
        debug("PUSH LINK:" + l,true);
        setAttr(l, 'container', getCurrentContainer(yy));
    }
    yy.LINKS.push(l);
    debug(false);
    return l;
}

/**
 * Push given object into a current container
 */
function pushObject(yy, o) {
    debug("pushObject " + o + "to " + getCurrentContainer(yy),true);
    getCurrentContainer(yy).OBJECTS.push(o);
    debug(false);
    return o;
}


//noinspection JSUnusedGlobalSymbols
/**
 * test if container has the object
 */
function containsObject(container, o) {
    for (var i in container.OBJECTS) {
        if (!container.OBJECTS.hasOwnProperty(i))continue;
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
