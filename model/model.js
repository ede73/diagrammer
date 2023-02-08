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
 * @param {string} variable ${XXX:yyy} assignment or ${XXX} query
 * @return {string} Value of the variable
 */
function processVariable(yy, variable) {
    // ASSIGN VARIABLE
    // $(NAME:CONTENT...)
    // or
    // refer variable
    // $(NAME)
    const vari = variable.slice(2, -1);
    if (vari.indexOf(":") !== -1) {
        // Assignment
        const tmp = vari.split(":");
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
 * Create an array, push LHS,RHS vertices there and return the array as long as
 * processing the list vertices added to array..
 *
 * Usage: grammar/state.grammar
 *
 * @param yy Lexer yy
 * @param {GraphObject} lhs left hand side of the list
 * @param {GraphObject} rhs right hand side of the list
 * @param {string} rhsLinkLabel optional RHS label
 * @return {Array[any]}
 */
function getList(yy, lhs, rhs, rhsLinkLabel) {
    if (lhs instanceof Vertex) {
        debug("getList(vertex:" + lhs + ",rhs:[" + rhs + "])", true);
        const lst = [];
        lst.push(lhs);
        //TODO assuming RHS is Vertex
        lst.push(getVertex(yy, rhs).setLinkLabel(rhsLinkLabel));
        debug("return vertex:" + lst, false);
        return lst;
    }
    if (lhs instanceof Group) {
        debug("getList(group:[" + lhs + "],rhs:" + rhs + ")", true);
        const lst = [];
        lst.push(lhs);
        //TODO assuming RHS is Group
        lst.push(getGroup(yy, rhs).setLinkLabel(rhsLinkLabel));
        debug("return group:" + lst, false);
        return lst;
    }
    debug("getList(lhs:[" + lhs + "],rhs:" + rhs, true);
    // LHS not a vertex..
    lhs.push(getVertex(yy, rhs).setLinkLabel(rhsLinkLabel));
    debug("return [" + lhs + "]", false);
    return lhs;
}

/**
 * See readVertexOrGroup in grammar
 *
 * Return matching Vertex,Array,Group
 *
 * If no match, create a new vertex
 *
 * STYLE will always be updated on last occurance (ie. dashed a1
 * dotted a1>b1 - only for vertices!
 *
 * vertex a1 will be dotted instead of being dashed
 *
 * Usage: grammar/state.grammar
 *
 * @param yy Lexer yy
 * @param {(string|GraphObject|Array)} name Reference, Vertex/Array/Group
 * @param {string} [style] OPTIONAL if style given, update (only if name refers to vertex)
 * @return {GraphObject}
 */
function getVertex(yy, name, style) {
    debug("getVertex (name:" + name + ",style:" + style + ")", true);
    function findVertex(yy, name, style) {
        if (name instanceof Vertex) {
            if (style) name.setStyle(style);
            return name;
        }
        if (name instanceof Array) {
            return name;
        }

        const search = function s(container, /** @type {string} */ name) {
            if (container.getName() == name) return container;
            for (const i in container.OBJECTS) {
                if (!container.OBJECTS.hasOwnProperty(i)) continue;
                const o = container.OBJECTS[i];
                if (o instanceof Vertex && o.getName() == name) {
                    if (style) o.setStyle(style);
                    return o;
                }
                if (o instanceof Group) {
                    const found = s(o, name);
                    if (found) return found;
                }
            }
            return undefined;
        }(getGraphRoot(yy), name);
        if (search) {
            return search;
        }
        debug("Create new vertex name=" + name, true);
        const vertex = new Vertex(name, getGraphRoot(yy).getCurrentShape());
        if (style) vertex.setStyle(style);
        vertex.nolinks = true;

        _getDefaultAttribute(yy, 'vertexcolor', function (color) {
            vertex.setColor(color);
        });
        _getDefaultAttribute(yy, 'vertextextcolor', function (color) {
            vertex.setTextColor(color);
        });
        debug(false);
        return _pushObject(yy, vertex);
    }

    const vertex = findVertex(yy, name, style);
    debug("  in getVertex gotVertex " + vertex);
    // TODO: MOVING TO GraphMeta
    yy.lastSeenVertex = vertex;
    if (yy.collectNextVertex) {
        debug("Collect next vertex");
        // TODO: MOVING TO GraphMeta
        yy.collectNextVertex.exitlink = name;
        // TODO: MOVING TO GraphMeta
        yy.collectNextVertex = undefined;
    }
    debug(false);
    return vertex;
}

/**
 * TODO: DUAL DECLARATION
 *
 * Usage: grammar/state.grammar
 *
 * Get current container
 * @param yy Lexer
 * @return {(GraphRoot|Group|SubGroup)}
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
 * @param {(GraphRoot|Group|SubGroup)} container Set this container as current container
 * @return {(GraphRoot|Group|SubGroup)}
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
    const currentContainer = yy.CURRENTCONTAINER.pop();
    currentContainer.exitvertex = yy.CONTAINER_EXIT++;
    return currentContainer;
}

/**
 * Enter to a new parented sub graph
 * like in a>(b>c,d,e)>h
 *
 * Edit grammar so it links a>b and c,d,e to h
 * Ie exit vertex(s) and enrance vertex(s) linked properly
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
    const currentSubGraph = getCurrentContainer(yy);
    debug('Exit subgraph ' + currentSubGraph);
    let link = null;

    //fix entrance
    for (var i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i)) continue;
        link = yy.LINKS[i];
        if (link.right.name == currentSubGraph.name && link.left.name == currentSubGraph.entrance.name) {
            //remove this link!
            yy.LINKS.splice(i, 1);
            //and then relink it to containers vertices that have no LEFT links
            break;
        }
        link = null;
    }

    if (link !== null) {
        //and then relink it to containers vertices that have no LEFT links
        //traverse
        for (var n in currentSubGraph.ROOTVERTICES) {
            if (!currentSubGraph.ROOTVERTICES.hasOwnProperty(n)) continue;
            const vertex = currentSubGraph.ROOTVERTICES[n];
            currentSubGraph.entrance.nolinks = undefined;
            vertex.nolinks = undefined;
            const newLink = getLink(yy, link.linkType, currentSubGraph.entrance, vertex, link.label,
                undefined, undefined, undefined, undefined, true);
            newLink.container = currentSubGraph;
            yy.LINKS.splice(i++, 0, newLink);
        }
    }

    //fix exits
    //{"link":{"linkType":">","left":1,"right":"z","label":"from e and h"}}
    const exits = [];
    for (var vertex in currentSubGraph.OBJECTS) {
        if (!currentSubGraph.OBJECTS.hasOwnProperty(vertex)) continue;
        vertex = currentSubGraph.OBJECTS[vertex];
        if (!hasOutwardLink(yy, vertex)) {
            exits.push(vertex);
        }
    }

    debug('exits ' + exits);
    currentSubGraph.setExit(vertex);
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
    // TODO: MOVING TO GraphMeta
    if (!yy.GROUPIDS) yy.GROUPIDS = 1;
    const newGroup = new Group(yy.GROUPIDS++);
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
 * linkType >,<,.>,<.,->,<-,<> l = left side, Vertex(xxx) or Group(yyy), or
 * Array(smthg) r = right side, Vertex(xxx) or Group(yyy), or Array(smthg) label =
 * if defined, LABEL for the link color = if defined, COLOR for the link
 *
 * if there is a list a>b,c,x,d;X then X is gonna e link label for EVERYONE
 * but for a>"1"b,"2"c link label is gonna be individual!
 *
 * Usage: grammar/state.grammar
 *
 * @param yy lexer
 * @param {string} linkType Type of the link(grammar)
 * @param {GraphObject} lhs Left hand side (must be Array,Vertex,Group)
 * @param {GraphObject} rhs Right hand side (must be Array,Vertex,Group)
 * @param {string} [inlineLinkLabel] Optional label for the link
 * @param {string} [commonLinkLabel] Optional label for the link
 * @param {string} [linkColor] Optional color for the link
 * @param {string} [lcompass] Left hand side compass value
 * @param {string} [rcompass] Reft hand side compass value
 * @return {Link} the link that got added
 */
function getLink(yy, linkType, lhs, rhs, inlineLinkLabel, commonLinkLabel, linkColor, lcompass, rcompass, dontadd) {
    let lastLink;
    const current_container = getCurrentContainer(yy);

    debug(true);
    if (rhs instanceof SubGraph && !rhs.getEntrance()) {
        rhs.setEntrance(lhs);
    }
    if (rhs.nolinks && current_container) {
        debug('REMOVE ' + rhs + ' from root vertices of the container ' + current_container);
        const idx = current_container.ROOTVERTICES.indexOf(rhs);
        if (idx >= 0) {
            current_container.ROOTVERTICES.splice(idx, 1);
        }
    }
    lhs.nolinks = undefined;
    rhs.nolinks = undefined;

    if (current_container instanceof SubGraph &&
        !current_container.getEntrance() &&
        lhs instanceof Vertex &&
        !(rhs instanceof SubGraph)) {
        current_container.setEntrance(lhs);
    }

    if (lhs instanceof Array) {
        debug("getLink LHS array, type:" + linkType + " l:[" + lhs + "] r:" + rhs + " inlineLinkLabel:" + inlineLinkLabel + " commonLinkLabel: " + commonLinkLabel + " linkColor:" + linkColor + " lcompass:" + lcompass + " rcompass:" + rcompass);
        for (let i = 0; i < lhs.length; i++) {
            debug("    1Get link " + lhs[i]);
            lastLink = getLink(yy, linkType, lhs[i], rhs, inlineLinkLabel, commonLinkLabel, linkColor, lcompass, rcompass);
        }
        debug(false);
        return lastLink;
    }
    if (rhs instanceof Array) {
        debug("getLink RHS array, type:" + linkType + " l:" + lhs + " r:[" + rhs + "] inlineLinkLabel:" + inlineLinkLabel + " commonLinkLabel: " + commonLinkLabel + " linkColor:" + linkColor + " lcompass:" + lcompass + " rcompass:" + rcompass);
        for (let i = 0; i < rhs.length; i++) {
            debug("    2Get link " + rhs[i]);
            lastLink = getLink(yy, linkType, lhs, rhs[i], inlineLinkLabel, commonLinkLabel, linkColor, lcompass, rcompass);
        }
        debug(false);
        return lastLink;
    }
    {
        let fmt = "";
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
    if (!(lhs instanceof Vertex) && !(lhs instanceof Group) & !(lhs instanceof SubGraph)) {
        throw new Error("LHS not a Vertex,Group nor a SubGraph(LHS=" + lhs + ") RHS=(" + rhs + ")");
    }
    if (!(rhs instanceof Vertex) && !(rhs instanceof Group) && !(rhs instanceof SubGraph)) {
        throw new Error("RHS not a Vertex,Group nor a SubGraph(LHS=" + lhs + ") RHS=(" + rhs + ")");
    }
    const link = new Link(linkType, lhs, rhs);

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
    else if (rhs instanceof Vertex && commonLinkLabel) {
        link.setLabel(commonLinkLabel);
        debug('  set commonLinkLabel ' + commonLinkLabel);
    }
    if (rhs instanceof Vertex) {
        const tmp = rhs.getLinkLabel();
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

function getGraphMeta(yy) {
    return new GraphMeta(yy);
}

/**
 * Get current singleton graphroot or create new one
 * External utility support for generator
 *
 * Usage: grammar/state.grammar, generators
 * @return {GraphRoot}
 */
function getGraphRoot(yy) {
    // debug(" getGraphRoot "+yy);
    if (!yy.GRAPHROOT) {
        //debug("no graphroot,init - in getGraphRoot",true);
        if (!yy.result) {
            // TODO: MOVING TO GraphMeta
            yy.result = function (str) {
                console.log(str);
            }
        }
        debug("...Initialize emptyroot " + yy);
        // TODO: DOESN'T WORK as type hint! Modularize to own obj..
        /** @type  {(GraphRoot|Group|SubGroup)} */
        yy.CURRENTCONTAINER = [];
        /** @type {Array[Link]} */
        yy.LINKS = [];
        /** @type {int} */
        yy.CONTAINER_EXIT = 1;
        /** @type  {GraphRoot} */
        yy.GRAPHROOT = new GraphRoot();
        // yy.GRAPHROOT.setCurrentContainer(yy.GRAPHROOT);
        enterContainer(yy, yy.GRAPHROOT);
        //debug(false);
    }
    return yy.GRAPHROOT;
}

/** 
 * Usage: grammar/state.grammar, generators/digraph.js
 * @param {GraphObject} vertex
 */
function hasOutwardLink(yy, vertex) {
    for (const i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i)) continue;
        const link = yy.LINKS[i];
        if (link.left.name === vertex.name) {
            return true;
        }
    }
    return false;
}

/**
 * return true if vertex has inward link OUTSIDE container it is in
 * @param {GraphObject} vertex
 * @param {GraphObject} verticesContainer (Group?)
 */
function hasInwardLink(yy, vertex, verticesContainer) {
    for (const i in yy.LINKS) {
        if (!yy.LINKS.hasOwnProperty(i)) continue;
        const link = yy.LINKS[i];
        if (verticesContainer &&
            link.container.name === verticesContainer.name) {
            continue;
        }
        if (link.right.name === vertex.name) {
            return true;
        }
    }
    return false;
}

/**
 * test if container has the object
 * @param {Group} container
 * @param {GraphObject} obj
 */
function containsObject(container, obj) {
    for (const i in container.OBJECTS) {
        if (!container.OBJECTS.hasOwnProperty(i)) continue;
        const c = container.OBJECTS[i];
        if (c == obj) {
            return true;
        }
        if (c instanceof Group) {
            if (containsObject(c, obj)) {
                return true;
            }
        }
    }
    return false;
}

/** 
 * Usage: generators
 * @param {GraphMeta} graphmeta
 * @param {function(Link)} callback
 */
function traverseLinks(graphmeta, callback) {
    for (const i in graphmeta.LINKS) {
        if (!graphmeta.LINKS.hasOwnProperty(i)) continue;
        callback(graphmeta.LINKS[i]);
    }
}

/**
 * Usage: generators
 * @param {GraphObject} container
 * @param {function((Vertex|Group)):void} callback
 */
function traverseObjects(container, callback) {
    for (const i in container.OBJECTS) {
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
        // TODO: MOVING TO GraphMeta
        yy.VARIABLES = {}
    }
    return yy.VARIABLES;
}

/**
 * Get default attribute vertexcolor,linkcolor,groupcolor and bubble upwards if
 * otherwise 'unobtainable'
 *
 * @param yy lexer
 * @param {string} attrname Name of the default attribute. If not found, returns undefined
 * @param {function(string):void} [callback] Pass the attribute to the this function as only argument - if attribute WAS actually defined!
 * @return {string}
 */
function _getDefaultAttribute(yy, attrname, callback) {
    // no need for the value, but runs init if missing
    getGraphRoot(yy);
    // debug("_getDefaultAttribute "+attrname);
    for (const i in yy.CURRENTCONTAINER) {
        if (!yy.CURRENTCONTAINER.hasOwnProperty(i)) continue;
        const ctr = yy.CURRENTCONTAINER[i];
        const defaultAttribute = ctr.getDefault(attrname);
        // debug(" traverse _getDefaultAttribute "+attrname+" from "+ctr+" as
        // "+a);
        if (defaultAttribute) {
            // debug("_getDefaultAttribute "+attrname+" from "+ctr+"=("+a+")");
            if (callback)
                callback(defaultAttribute);
            return defaultAttribute;
        }
    }
    const defaultAttribute = getGraphRoot(yy).getDefault(attrname);
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
 * Create a new sub graph or return passed in reference (if it is a subgraph)
 * @param {SubGraph} [ref]
 */
function _getSubGraph(yy, ref) {
    if (ref instanceof SubGraph) return ref;
    //debug("_getSubGraph() NEW SubGraph:" + yy + "/" + ref,true);
    if (!yy.SUBGRAPHS) yy.SUBGRAPHS = 1;
    const newSubGraph = new SubGraph(yy.SUBGRAPHS++);
    //debug("push SubGraph " + newSubGraph + " to " + yy);
    _pushObject(yy, newSubGraph);
    //debug(false);
    return newSubGraph;
}

/**
 * Add link to the list of links, return the LINK
 * @param yy lexer
 * @param {Link} l Link (Array or Link)
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
 * @param {GraphObject} o
 */
function _pushObject(yy, o) {
    const cnt = getCurrentContainer(yy)
    debug("_pushObject " + o + "to " + cnt, true);
    cnt.OBJECTS.push(o);
    cnt.ROOTVERTICES.push(o);
    debug(false);
    return o;
}
