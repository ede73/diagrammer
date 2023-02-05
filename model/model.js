// =====================================
// ONLY used in grammar/state.grammar
// =====================================

/**
 *
 * Called from grammar to inject a new (COLOR) variable
 * Only colors supported currently, though there's really no limitation
 *
 * If this is assignment, rewrite the variable, else assign new
 * Always return the current value
 *
 * Usage: grammar/state.grammar
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
        _getVariables(yy)[tmp[0]] = tmp[1];
        return tmp[1];
    } else {
        // referral
        if (!_getVariables(yy)[vari]) {
            throw new Error("Variable " + vari + " not defined");
        }
        return _getVariables(yy)[vari];
    }
}

/**
 * Create an array, push LHS,RHS nodes there and return the array as long as
 * processing the list nodes added to array..
 *
 * Usage: grammar/state.grammar
 *
 * @param yy Lexer yy
 * @param LHS left hand side of the list
 * @param RHS right hand side of the list
 * @param rhsLinkLabel optional RHS label
 */
function getList(yy, LHS, RHS, rhsLinkLabel) {
    if (LHS instanceof Node) {
        debug("getList(node:" + LHS + ",rhs:[" + RHS + "])", true);
        var x = [];
        x.push(LHS);
        //TODO assuming RHS is Node
        x.push(getNode(yy, RHS).setLinkLabel(rhsLinkLabel));
        debug("return node:" + x, false);
        return x;
    }
    if (LHS instanceof Group) {
        debug("getList(group:[" + LHS + "],rhs:" + RHS + ")", true);
        var x = [];
        x.push(LHS);
        //TODO assuming RHS is Group
        x.push(getGroup(yy, RHS).setLinkLabel(rhsLinkLabel));
        debug("return group:" + x, false);
        return x;
    }
    debug("getList(lhs:[" + LHS + "],rhs:" + RHS, true);
    // LHS not a node..
    LHS.push(getNode(yy, RHS).setLinkLabel(rhsLinkLabel));
    debug("return [" + LHS + "]", false);
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
 * Usage: grammar/state.grammar
 *
 * @param yy Lexer yy
 * @param name Reference, Node/Array/Group
 * @param [style] OPTIONAL if style given, update (only if name refers to node)
 */
function getNode(yy, name, style) {
    debug("getNode (name:" + name + ",style:" + style + ")", true);
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
                if (!container.OBJECTS.hasOwnProperty(i)) continue;
                var o = container.OBJECTS[i];
                if (o instanceof Node && o.getName() == name) {
                    if (style) o.setStyle(style);
                    return o;
                }
                if (o instanceof Group) {
                    var found = s(o, name);
                    if (found) return found;
                }
            }
            return undefined;
        }(getGraphRoot(yy), name);
        if (search) {
            return search;
        }
        debug("Create new node name=" + name, true);
        var n = new Node(name, getGraphRoot(yy).getCurrentShape());
        if (style) n.setStyle(style);
        n.nolinks = true;

        _getDefaultAttribute(yy, 'nodecolor', function (color) {
            n.setColor(color);
        });
        _getDefaultAttribute(yy, 'nodetextcolor', function (color) {
            n.setTextColor(color);
        });
        debug(false);
        return _pushObject(yy, n);
    }

    var node = cc(yy, name, style);
    debug("  in getNode gotNode " + node);
    yy.lastSeenNode = node;
    if (yy.collectNextNode) {
        debug("Collect next node");
        yy.collectNextNode.exitlink = name;
        yy.collectNextNode = undefined;
    }
    debug(false);
    return node;
}

/**
 * TODO: DUAL DECLARATION
 *
 * Usage: grammar/state.grammar
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
 *
 * Usage: grammar/state.grammar
 *
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
 *
 * Usage: grammar/state.grammar
 *
 * @param yy lexer
 */
function exitContainer(yy) {
    if (yy.CURRENTCONTAINER.length <= 1)
        throw new Error("INTERNAL ERROR:Trying to exit ROOT container");
    var currentContainer = yy.CURRENTCONTAINER.pop();
    currentContainer.exitnode = yy.CONTAINER_EXIT++;
    return currentContainer;
}

/**
 * Enter to a new parented sub graph
 * like in a>(b>c,d,e)>h
 *
 * Edit grammar so it links a>b and c,d,e to h
 * Ie exit node(s) and enrance node(s) linked properly
 *
 * Usage: grammar/state.grammar
 */
function enterSubGraph(yy) {
    return enterContainer(yy, _getSubGraph(yy));
}

/*
 * Usage: grammar/state.grammar
 */
function exitSubGraph(yy) {
    //Now should edit the ENTRANCE LINK to point to a>b, a>d, a>e
    var currentSubGraph = getCurrentContainer(yy);
    debug('Exit subgraph ' + currentSubGraph);
    var l = null;
    var i = 0;

    //fix entrance
    for (i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i)) continue;
        l = yy.LINKS[i];
        if (l.right.name == currentSubGraph.name && l.left.name == currentSubGraph.entrance.name) {
            //remove this link!
            yy.LINKS.splice(i, 1);
            //and then relink it to containers nodes that have no LEFT links
            break;
        }
        l = null;
    }

    if (l !== null) {
        //and then relink it to containers nodes that have no LEFT links
        //traverse
        for (var o in currentSubGraph.ROOTNODES) {
            if (!currentSubGraph.ROOTNODES.hasOwnProperty(o)) continue;
            var g = currentSubGraph.ROOTNODES[o];
            currentSubGraph.entrance.nolinks = undefined;
            g.nolinks = undefined;
            var newLink = getLink(yy, l.linkType, currentSubGraph.entrance, g, l.label,
                undefined, undefined, undefined, undefined, true);
            newLink.container = currentSubGraph;
            yy.LINKS.splice(i++, 0, newLink);
        }
    }

    //fix exits
    //{"link":{"linkType":">","left":1,"right":"z","label":"from e and h"}}
    var exits = [];
    for (var o in currentSubGraph.OBJECTS) {
        if (!currentSubGraph.OBJECTS.hasOwnProperty(o)) continue;
        var g = currentSubGraph.OBJECTS[o];
        if (!hasOutwardLink(yy, g)) {
            exits.push(g);
        }
    }

    debug('exits ' + exits);
    currentSubGraph.setExit(g);
    return exitContainer(yy);
}

//noinspection JSUnusedGlobalSymbols
/**
 * Create a NEW GROUP if one (ref) does not exist yet getGroup(yy) => create a
 * new anonymous group getGroup(yy,GroupRef) => create a new group if GroupRef
 * is not a Group or return GroupRef if it is...1
 *
 * Usage: grammar/state.grammar
 *
 * @param yy lexer
 * @param ref Type of reference, if group, return it
 * @return ref if ref instance of group, else the newly created group
 */
function getGroup(yy, ref) {
    if (ref instanceof Group) return ref;
    debug("getGroup() NEW GROUP:" + yy + "/" + ref, true);
    if (!yy.GROUPIDS) yy.GROUPIDS = 1;
    var newGroup = new Group(yy.GROUPIDS++);
    debug("push group " + newGroup + " to " + yy);
    _pushObject(yy, newGroup);

    _getDefaultAttribute(yy, 'groupcolor', function (color) {
        newGroup.setColor(color);
    });
    debug(false);
    return newGroup;
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
 *
 * Usage: grammar/state.grammar
 *
 * @param yy lexer
 * @param linkType Type of the link(grammar)
 * @param lhs Left hand side (must be Array,Node,Group)
 * @param rhs Right hand side (must be Array,Node,Group)
 * @param [inlineLinkLabel] Optional label for the link
 * @param [commonLinkLabel] Optional label for the link
 * @param [linkColor] Optional color for the link
 * @param [lcompass] Left hand side compass value
 * @param [rcompass] Reft hand side compass value
 * @return the link that got added
 */
function getLink(yy, linkType, lhs, rhs, inlineLinkLabel, commonLinkLabel, linkColor, lcompass, rcompass, dontadd) {
    var lastLink;
    var current_container = getCurrentContainer(yy);

    debug(true);
    if (rhs instanceof SubGraph && !rhs.getEntrance()) {
        rhs.setEntrance(lhs);
    }
    if (rhs.nolinks && current_container) {
        debug('REMOVE ' + rhs + ' from root nodes of the container ' + current_container);
        var idx = current_container.ROOTNODES.indexOf(rhs);
        if (idx >= 0) {
            current_container.ROOTNODES.splice(idx, 1);
        }
    }
    lhs.nolinks = undefined;
    rhs.nolinks = undefined;

    if (current_container instanceof SubGraph &&
        !current_container.getEntrance() &&
        lhs instanceof Node &&
        !(rhs instanceof SubGraph)) {
        current_container.setEntrance(lhs);
    }

    if (lhs instanceof Array) {
        debug("getLink LHS array, type:" + linkType + " l:[" + lhs + "] r:" + rhs + " inlineLinkLabel:" + inlineLinkLabel + " commonLinkLabel: " + commonLinkLabel + " linkColor:" + linkColor + " lcompass:" + lcompass + " rcompass:" + rcompass);
        for (var i = 0; i < lhs.length; i++) {
            debug("    1Get link " + lhs[i]);
            lastLink = getLink(yy, linkType, lhs[i], rhs, inlineLinkLabel, commonLinkLabel, linkColor, lcompass, rcompass);
        }
        debug(false);
        return lastLink;
    }
    if (rhs instanceof Array) {
        debug("getLink RHS array, type:" + linkType + " l:" + lhs + " r:[" + rhs + "] inlineLinkLabel:" + inlineLinkLabel + " commonLinkLabel: " + commonLinkLabel + " linkColor:" + linkColor + " lcompass:" + lcompass + " rcompass:" + rcompass);
        for (var i = 0; i < rhs.length; i++) {
            debug("    2Get link " + rhs[i]);
            lastLink = getLink(yy, linkType, lhs, rhs[i], inlineLinkLabel, commonLinkLabel, linkColor, lcompass, rcompass);
        }
        debug(false);
        return lastLink;
    }
    {
        var fmt = "";
        if (inlineLinkLabel)
            fmt += "inlineLinkLabel: " + inlineLinkLabel;
        if (commonLinkLabel)
            fmt += "commonLinkLabel: " + commonLinkLabel;
        if (linkColor)
            fmt += "linkColor: " + linkColor;
        if (lcompass)
            fmt += "lcompass: " + lcompass;
        if (rcompass)
            fmt += "rcompass: " + rcompass;
        debug("getLink type:" + linkType + " l:" + lhs + " r:" + rhs + fmt);
    }
    if (!(lhs instanceof Node) && !(lhs instanceof Group) & !(lhs instanceof SubGraph)) {
        throw new Error("LHS not a Node,Group nor a SubGraph(LHS=" + lhs + ") RHS=(" + rhs + ")");
    }
    if (!(rhs instanceof Node) && !(rhs instanceof Group) && !(rhs instanceof SubGraph)) {
        throw new Error("RHS not a Node,Group nor a SubGraph(LHS=" + lhs + ") RHS=(" + rhs + ")");
    }
    var link = new Link(linkType, lhs, rhs);

    if (lcompass) link.lcompass = lcompass;
    else if (getAttr(lhs, 'compass')) link.lcompass = getAttr(lhs, 'compass');

    if (rcompass) link.rcompass = rcompass;
    else if (getAttr(rhs, 'compass')) link.rcompass = getAttr(rhs, 'compass');

    _getDefaultAttribute(yy, 'linkcolor', function (linkColor) {
        link.setColor(linkColor);
    });
    _getDefaultAttribute(yy, 'linktextcolor', function (linkColor) {
        link.setTextColor(linkColor);
    });
    if (commonLinkLabel) {
        link.setLabel(commonLinkLabel);
        debug("  set commonLinkLabel " + commonLinkLabel);
    }
    if (inlineLinkLabel) {
        link.setLabel(inlineLinkLabel);
        debug("  set inlineLinkLabel " + inlineLinkLabel);
    }
    else if (rhs instanceof Node && commonLinkLabel) {
        link.setLabel(commonLinkLabel);
        debug('  set commonLinkLabel ' + commonLinkLabel);
    }
    if (rhs instanceof Node) {
        tmp = rhs.getLinkLabel();
        if (tmp) {
            link.setLabel(tmp);
            debug('  reset link label to ' + tmp);
        }
    }
    if (linkColor) link.setColor(linkColor);

    if (!dontadd) {
        _addLink(yy, link);
    }
    debug(false);
    return link;
}

// =====================================
// exposed to generators also
// =====================================

/**
 * Get current singleton graphroot or create new one
 * External utility support for generator
 *
 * Usage: grammar/state.grammar, generators
 */
function getGraphRoot(yy) {
    // debug(" getGraphRoot "+yy);
    if (!yy.GRAPHROOT) {
        //debug("no graphroot,init - in getGraphRoot",true);
        if (!yy.result) {
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

/*
 * Usage: grammar/state.grammar, generators/digraph.js
 */
function hasOutwardLink(yy, node) {
    for (var i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i)) continue;
        var r = yy.LINKS[i];
        if (r.left.name === node.name) {
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
        if (!yy.LINKS.hasOwnProperty(i)) continue;
        var r = yy.LINKS[i];
        if (nodesContainer &&
            r.container.name === nodesContainer.name) {
            continue;
        }
        if (r.right.name === node.name) {
            return true;
        }
    }
    return false;
}

/**
 * test if container has the object
 */
function containsObject(container, o) {
    for (var i in container.OBJECTS) {
        if (!container.OBJECTS.hasOwnProperty(i)) continue;
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

/*
 * Usage: generators
 */
function traverseLinks(yy, callback) {
    for (var i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i)) continue;
        callback(yy.LINKS[i]);
    }
}

/*
 * Usage: generators
 */
function traverseObjects(container, callback) {
    for (var i in container.OBJECTS) {
        if (!container.OBJECTS.hasOwnProperty(i)) continue;
        callback(container.OBJECTS[i]);
    }
}

// =====================================
// only model.js
// =====================================

/**
 * Return all the variables from the collection (hard coded to yy)
 */
function _getVariables(yy) {
    if (!yy.VARIABLES) {
        yy.VARIABLES = {}
    }
    return yy.VARIABLES;
}

/**
 * Get default attribute nodecolor,linkcolor,groupcolor and bubble upwards if
 * otherwise 'unobtainable'
 *
 * @param yy lexer
 * @param attrname Name of the default attribute. If not found, returns undefined
 * @param [callback] Pass the attribute to the this function as only argument - if attribute WAS actually defined!
 */
function _getDefaultAttribute(yy, attrname, callback) {
    // no need for the value, but runs init if missing
    getGraphRoot(yy);
    // debug("_getDefaultAttribute "+attrname);
    for (var i in yy.CURRENTCONTAINER) {
        if (!yy.CURRENTCONTAINER.hasOwnProperty(i)) continue;
        var ctr = yy.CURRENTCONTAINER[i];
        var defaultAttribute = ctr.getDefault(attrname);
        // debug(" traverse _getDefaultAttribute "+attrname+" from "+ctr+" as
        // "+a);
        if (defaultAttribute) {
            // debug("_getDefaultAttribute "+attrname+" from "+ctr+"=("+a+")");
            if (callback)
                callback(defaultAttribute);
            return defaultAttribute;
        }
    }
    var defaultAttribute = getGraphRoot(yy).getDefault(attrname);
    if (defaultAttribute) {
        debug("_getDefaultAttribute got from graphroot");
        if (callback)
            callback(defaultAttribute);
        return defaultAttribute;
    }
    // debug("_getDefaultAttribute FAILED");
    return undefined;
}

/**
 * Create a new sub graph
 */
function _getSubGraph(yy, ref) {
    if (ref instanceof SubGraph) return ref;
    //debug("_getSubGraph() NEW SubGraph:" + yy + "/" + ref,true);
    if (!yy.SUBGRAPHS) yy.SUBGRAPHS = 1;
    var newSubGraph = new SubGraph(yy.SUBGRAPHS++);
    //debug("push SubGraph " + newSubGraph + " to " + yy);
    _pushObject(yy, newSubGraph);
    //debug(false);
    return newSubGraph;
}

/**
 * Add link to the list of links, return the LINK
 * @param yy lexer
 * @param l Link (Array or Link)
 */
function _addLink(yy, l) {
    if (l instanceof Array) {
        debug("PUSH LINK ARRAY:" + l, true);
    } else {
        debug("PUSH LINK:" + l, true);
        l.container = getCurrentContainer(yy);
    }
    yy.LINKS.push(l);
    debug(false);
    return l;
}

/**
 * Push given object into a current container
 */
function _pushObject(yy, o) {
    var cnt = getCurrentContainer(yy)
    debug("_pushObject " + o + "to " + cnt, true);
    cnt.OBJECTS.push(o);
    cnt.ROOTNODES.push(o);
    debug(false);
    return o;
}
