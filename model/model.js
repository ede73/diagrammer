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
        debug(" no graphroot,init - in getGraphRoot");
        if (yy.result === undefined) {
            yy.result = function (str) {
                console.log(str);
            }
        }
        debug("  ...Initialize emptyroot " + yy);
        yy.CURRENTCONTAINER = [];
        yy.LINKS = [];
        yy.CONTAINER_EXIT = 1;
        yy.GRAPHROOT = new GraphRoot();
        // yy.GRAPHROOT.setCurrentContainer(yy.GRAPHROOT);
        enterContainer(yy, yy.GRAPHROOT);
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
        debug(" getList(" + LHS + "," + RHS + ")");
        var x = [];
        x.push(LHS);
	//TODO assuming RHS is Node
        x.push(getNode(yy, RHS).setLinkLabel(rhsLinkLabel));
        return x;
    }
    if (LHS instanceof Group) {
        debug(" getList(" + LHS + "," + RHS + ")");
        var x = [];
        x.push(LHS);
	//TODO assuming RHS is Group
        x.push(getGroup(yy, RHS).setLinkLabel(rhsLinkLabel));
        return x;
    }
    debug(" getList([" + LHS + "]," + RHS);
    // LHS not a node..
    LHS.push(getNode(yy, RHS).setLinkLabel(rhsLinkLabel));
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
        debug(" Create new node");
        var n = new Node(name, getGraphRoot(yy).getCurrentShape());
        if (style) n.setStyle(style);

        getDefaultAttribute(yy, 'nodecolor', function (color) {
            n.setColor(color);
        });
        getDefaultAttribute(yy, 'nodetextcolor', function (color) {
            n.setTextColor(color);
        });
        return pushObject(yy, n);
    }

    var node = cc(yy, name, style);
    debug(" getNode gotNode " + node);
    yy.lastSeenNode = node;
    if (yy.collectNextNode) {
        debug("Collect next node");
        setAttr(yy.collectNextNode, 'exitlink', name);
        yy.collectNextNode = undefined;
    }
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
        debug("getDefaultAttribute got from graphroot");
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
        throw new Error("INTERNAL ERROR:Trying to exist ROOT container");
    return setAttr(yy.CURRENTCONTAINER.pop(), 'exitnode', yy.CONTAINER_EXIT++);
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
    debug(" getGroup() NEW GROUP:" + yy + "/" + ref);
    if (yy.GROUPIDS === undefined) yy.GROUPIDS = 1;
    var newGroup = new Group(yy.GROUPIDS++);
    debug(" push group " + newGroup + " to " + yy);
    pushObject(yy, newGroup);

    getDefaultAttribute(yy, 'groupcolor', function (color) {
        newGroup.setColor(color);
    });
    return newGroup;
}
// Get a link such that l links to r, return the added LINK or LINKS

//noinspection JSUnusedGlobalSymbols
/**
 * linkType >,<,.>,<.,->,<-,<> l = left side, Node(xxx) or Group(yyy), or
 * Array(smthg) r = right side, Node(xxx) or Group(yyy), or Array(smthg) label =
 * if defined, LABEL for the link color = if defined, COLOR for the link
 * @param yy lexer
 * @param linkType Type of the link(grammar)
 * @param l Left hand side (must be Array,Node,Group)
 * @param r Right hand side (must be Array,Node,Group)
 * @param [label] Optional label for the link
 * @param [color] Optional color for the link
 * @param [lcompass] Left hand side compass value
 * @param [rcompass] Reft hand side compass value
 * @return the link that got added
 */
function getLink(yy, linkType, l, r, label, color, lcompass, rcompass) {
    var lastLink;
    var i;
    if (l instanceof Array) {
        debug(" getLink called with LHS array");
        for (i = 0; i < l.length; i++) {
            debug(" Get link " + l[i]);
            lastLink = getLink(yy, linkType, l[i], r, label, color, lcompass, rcompass);
        }
        return lastLink;
    }
    if (r instanceof Array) {
        debug(" getLink called with RHS array");
        for (i = 0; i < r.length; i++) {
            debug(" Get link " + r[i]);
            lastLink = getLink(yy, linkType, l, r[i], label, color, lcompass, rcompass);
        }
        return lastLink;
    }
    if (!(l instanceof Node) && !(l instanceof Group)) {
        throw new Error("LHS not a Node nor a Group(LHS=" + l + ")");
    }
    if (!(r instanceof Node) && !(r instanceof Group)) {
        throw new Error("RHS not a Node nor a Group(RHS=" + r + ")");
    }
    var lnk = new Link(linkType, l, r);
    if (lcompass) setAttr(lnk, 'lcompass', lcompass);
    else if (getAttr(l, 'compass')) setAttr(lnk, 'lcompass', getAttr(l, 'compass'));
    if (rcompass) setAttr(lnk, 'rcompass', rcompass);
    else if (getAttr(r, 'compass')) setAttr(lnk, 'rcompass', getAttr(r, 'compass'));
    getDefaultAttribute(yy, 'linkcolor', function (color) {
        lnk.setColor(color);
    });
    getDefaultAttribute(yy, 'linktextcolor', function (color) {
        lnk.setTextColor(color);
    });
    if (label != undefined) lnk.setLabel(label);
    if (r instanceof Node && r.getLinkLabel() != undefined) lnk.setLabel(r.getLinkLabel());
    if (color != undefined) lnk.setColor(color);
    return addLink(yy, lnk);
}

/**
 * Add link to the list of links, return the LINK
 * @param yy lexer
 * @param l Link (Array or Link)
 */
function addLink(yy, l) {
    if (l instanceof Array) {
        debug(" PUSH LINK ARRAY:" + l);
    } else {
        debug(" PUSH LINK:" + l);
        setAttr(l, 'container', getCurrentContainer(yy));
    }
    yy.LINKS.push(l);
    return l;
}

/**
 * Push given object into a current container
 */
function pushObject(yy, o) {
    debug("  pushObject " + o + "to " + getCurrentContainer(yy));
    getCurrentContainer(yy).OBJECTS.push(o);
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

