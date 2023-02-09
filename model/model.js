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
 * @param {string} rhsEdgeLabel optional RHS label
 * @return {Array[any]}
 */
function getList(yy, lhs, rhs, rhsEdgeLabel) {
    if (lhs instanceof GraphVertex) {
        debug("getList(vertex:" + lhs + ",rhs:[" + rhs + "])", true);
        const lst = [];
        lst.push(lhs);
        //TODO assuming RHS is Vertex
        lst.push(getVertex(yy, rhs).setEdgeLabel(rhsEdgeLabel));
        debug("return vertex:" + lst, false);
        return lst;
    }
    if (lhs instanceof Group) {
        debug("getList(group:[" + lhs + "],rhs:" + rhs + ")", true);
        const lst = [];
        lst.push(lhs);
        //TODO assuming RHS is Group
        lst.push(getGroup(yy, rhs).setEdgeLabel(rhsEdgeLabel));
        debug("return group:" + lst, false);
        return lst;
    }
    debug("getList(lhs:[" + lhs + "],rhs:" + rhs, true);
    // LHS not a vertex..
    lhs.push(getVertex(yy, rhs).setEdgeLabel(rhsEdgeLabel));
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
        if (name instanceof GraphVertex) {
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
                if (o instanceof GraphVertex && o.getName() == name) {
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
        const vertex = new GraphVertex(name, getGraphRoot(yy).getCurrentShape());
        if (style) vertex.setStyle(style);
        vertex.noedges = true;

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
        yy.collectNextVertex.exitedge = name;
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
 * Edit grammar so it edges a>b and c,d,e to h
 * Ie exit vertex(s) and entrance vertex(s) linked properly
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
    //Now should edit the ENTRANCE EDGE to point to a>b, a>d, a>e
    const currentSubGraph = getCurrentContainer(yy);
    debug('Exit subgraph ' + currentSubGraph);
    let edge = null;

    //fix entrance
    for (var i in yy.EDGES) {
        if (!yy.EDGES.hasOwnProperty(i)) continue;
        edge = yy.EDGES[i];
        if (edge.right.name == currentSubGraph.name && edge.left.name == currentSubGraph.entrance.name) {
            //remove this edge!
            yy.EDGES.splice(i, 1);
            //and then relink it to containers vertices that have no LEFT edges
            break;
        }
        edge = null;
    }

    if (edge !== null) {
        //and then relink it to containers vertices that have no LEFT edges
        //traverse
        for (var n in currentSubGraph.ROOTVERTICES) {
            if (!currentSubGraph.ROOTVERTICES.hasOwnProperty(n)) continue;
            const vertex = currentSubGraph.ROOTVERTICES[n];
            currentSubGraph.entrance.noedges = undefined;
            vertex.noedges = undefined;
            const newEdge = getEdge(yy, edge.edgeType, currentSubGraph.entrance, vertex, edge.label,
                undefined, undefined, undefined, undefined, true);
            newEdge.container = currentSubGraph;
            yy.EDGES.splice(i++, 0, newEdge);
        }
    }

    //fix exits
    //{"link":{"edgeType":">","left":1,"right":"z","label":"from e and h"}}
    const exits = [];
    for (var vertex in currentSubGraph.OBJECTS) {
        if (!currentSubGraph.OBJECTS.hasOwnProperty(vertex)) continue;
        vertex = currentSubGraph.OBJECTS[vertex];
        if (!hasOutwardEdge(yy, vertex)) {
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

// Get an edge such that l links to r, return the added Edge or EDGES

//noinspection JSUnusedGlobalSymbols
/**
 * edgeType >,<,.>,<.,->,<-,<> l = left side, Vertex(xxx) or Group(yyy), or
 * Array(smthg) r = right side, Vertex(xxx) or Group(yyy), or Array(smthg) label =
 * if defined, LABEL for the edge color = if defined, COLOR for the edge
 *
 * if there is a list a>b,c,x,d;X then X is gonna be edge label for EVERYONE
 * but for a>"1"b,"2"c edge label is gonna be individual!
 *
 * Usage: grammar/state.grammar
 *
 * @param yy lexer
 * @param {string} edgeType Type of the edge(grammar)
 * @param {GraphObject} lhs Left hand side (must be Array,Vertex,Group)
 * @param {GraphObject} rhs Right hand side (must be Array,Vertex,Group)
 * @param {string} [inlineEdgeLabel] Optional label for the edge
 * @param {string} [commonEdgeLabel] Optional label for the edge
 * @param {string} [edgeColor] Optional color for the edge
 * @param {string} [lcompass] Left hand side compass value
 * @param {string} [rcompass] Reft hand side compass value
 * @return {Edge} the edge that got added
 */
function getEdge(yy, edgeType, lhs, rhs, inlineEdgeLabel, commonEdgeLabel, edgeColor, lcompass, rcompass, dontadd) {
    let lastEdge;
    const current_container = getCurrentContainer(yy);

    debug(true);
    if (rhs instanceof SubGraph && !rhs.getEntrance()) {
        rhs.setEntrance(lhs);
    }
    if (rhs.noedges && current_container) {
        debug('REMOVE ' + rhs + ' from root vertices of the container ' + current_container);
        const idx = current_container.ROOTVERTICES.indexOf(rhs);
        if (idx >= 0) {
            current_container.ROOTVERTICES.splice(idx, 1);
        }
    }
    lhs.noedges = undefined;
    rhs.noedges = undefined;

    if (current_container instanceof SubGraph &&
        !current_container.getEntrance() &&
        lhs instanceof GraphVertex &&
        !(rhs instanceof SubGraph)) {
        current_container.setEntrance(lhs);
    }

    if (lhs instanceof Array) {
        debug("getEdge LHS array, type:" + edgeType + " l:[" + lhs + "] r:" + rhs + " inlineEdgeLabel:" + inlineEdgeLabel + " commonEdgeLabel: " + commonEdgeLabel + " edgeColor:" + edgeColor + " lcompass:" + lcompass + " rcompass:" + rcompass);
        for (let i = 0; i < lhs.length; i++) {
            debug("    1Get edge " + lhs[i]);
            lastEdge = getEdge(yy, edgeType, lhs[i], rhs, inlineEdgeLabel, commonEdgeLabel, edgeColor, lcompass, rcompass);
        }
        debug(false);
        return lastEdge;
    }
    if (rhs instanceof Array) {
        debug("getEdge RHS array, type:" + edgeType + " l:" + lhs + " r:[" + rhs + "] inlineEdgeLabel:" + inlineEdgeLabel + " commonEdgeLabel: " + commonEdgeLabel + " edgeColor:" + edgeColor + " lcompass:" + lcompass + " rcompass:" + rcompass);
        for (let i = 0; i < rhs.length; i++) {
            debug("    2Get edge " + rhs[i]);
            lastEdge = getEdge(yy, edgeType, lhs, rhs[i], inlineEdgeLabel, commonEdgeLabel, edgeColor, lcompass, rcompass);
        }
        debug(false);
        return lastEdge;
    }
    {
        let fmt = "";
        if (inlineEdgeLabel)
            fmt += "inlineEdgeLabel: " + inlineEdgeLabel;
        if (commonEdgeLabel)
            fmt += "commonEdgeLabel: " + commonEdgeLabel;
        if (edgeColor)
            fmt += "edgeColor: " + edgeColor;
        if (lcompass)
            fmt += "lcompass: " + lcompass;
        if (rcompass)
            fmt += "rcompass: " + rcompass;
        debug("getEdge type:" + edgeType + " l:" + lhs + " r:" + rhs + fmt);
    }
    if (!(lhs instanceof GraphVertex) && !(lhs instanceof Group) & !(lhs instanceof SubGraph)) {
        throw new Error("LHS not a Vertex,Group nor a SubGraph(LHS=" + lhs + ") RHS=(" + rhs + ")");
    }
    if (!(rhs instanceof GraphVertex) && !(rhs instanceof Group) && !(rhs instanceof SubGraph)) {
        throw new Error("RHS not a Vertex,Group nor a SubGraph(LHS=" + lhs + ") RHS=(" + rhs + ")");
    }
    const edge = new Edge(edgeType, lhs, rhs);

    if (lcompass) edge.lcompass = lcompass;
    else if (getAttribute(lhs, 'compass')) edge.lcompass = getAttribute(lhs, 'compass');

    if (rcompass) edge.rcompass = rcompass;
    else if (getAttribute(rhs, 'compass')) edge.rcompass = getAttribute(rhs, 'compass');

    _getDefaultAttribute(yy, 'edgecolor', function (edgeColor) {
        edge.setColor(edgeColor);
    });
    _getDefaultAttribute(yy, 'edgetextcolor', function (edgeColor) {
        edge.setTextColor(edgeColor);
    });
    if (commonEdgeLabel) {
        edge.setLabel(commonEdgeLabel);
        debug("  set commonEdgeLabel " + commonEdgeLabel);
    }
    if (inlineEdgeLabel) {
        edge.setLabel(inlineEdgeLabel);
        debug("  set inlineEdgeLabel " + inlineEdgeLabel);
    }
    else if (rhs instanceof GraphVertex && commonEdgeLabel) {
        edge.setLabel(commonEdgeLabel);
        debug('  set commonEdgeLabel ' + commonEdgeLabel);
    }
    if (rhs instanceof GraphVertex) {
        const tmp = rhs.getEdgeLabel();
        if (tmp) {
            edge.setLabel(tmp);
            debug('  reset edge label to ' + tmp);
        }
    }
    if (edgeColor) edge.setColor(edgeColor);

    if (!dontadd) {
        _addEdge(yy, edge);
    }
    debug(false);
    return edge;
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
            throw new Error("Initialization has failed!");
        }
        debug("...Initialize emptyroot " + yy);
        // TODO: DOESN'T WORK as type hint! Modularize to own obj..
        /** @type  {(GraphRoot|Group|SubGroup)} */
        yy.CURRENTCONTAINER = [];
        /** @type {Array[Edge]} */
        yy.EDGES = [];
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
function hasOutwardEdge(yy, vertex) {
    for (const i in yy.EDGES) {
        if (!yy.EDGES.hasOwnProperty(i)) continue;
        const edge = yy.EDGES[i];
        if (edge.left.name === vertex.name) {
            return true;
        }
    }
    return false;
}

/**
 * return true if vertex has inward edge OUTSIDE container it is in
 * @param {GraphObject} vertex
 * @param {GraphObject} verticesContainer (Group?)
 */
function hasInwardEdge(yy, vertex, verticesContainer) {
    for (const i in yy.EDGES) {
        if (!yy.EDGES.hasOwnProperty(i)) continue;
        const edge = yy.EDGES[i];
        if (verticesContainer &&
            edge.container.name === verticesContainer.name) {
            continue;
        }
        if (edge.right.name === vertex.name) {
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
 * @param {function(Edge)} callback
 */
function traverseEdges(graphmeta, callback) {
    for (const i in graphmeta.EDGES) {
        if (!graphmeta.EDGES.hasOwnProperty(i)) continue;
        callback(graphmeta.EDGES[i]);
    }
}

/**
 * Usage: generators
 * @param {GraphObject} container
 * @param {function((GraphVertex|Group)):void} callback
 */
function traverseVertices(container, callback) {
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
 * Get default attribute vertexcolor,edgecolor,groupcolor and bubble upwards if
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
 * Add edge to the list of edges, return the Edge
 * @param yy lexer
 * @param {(Edge[]|Edge)} edge Edge (Edge or Edge[])
 * @return {(Edge[]|Edge)} Return What ever passed in
 */
function _addEdge(yy, edge) {
    if (edge instanceof Array) {
        debug("PUSH EDGE ARRAY:" + edge, true);
    } else {
        debug("PUSH EDGE:" + edge, true);
        edge.container = getCurrentContainer(yy);
    }
    yy.EDGES.push(edge);
    debug(false);
    return edge;
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
