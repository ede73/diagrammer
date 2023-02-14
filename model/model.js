// @ts-check 
// =====================================
// ONLY used in grammar/diagrammer.grammar
// =====================================
import { debug } from "../model/support.js";
import { GraphCanvas } from "../model/graphcanvas.js";
import { GraphGroup } from "../model/graphgroup.js";
import { GraphVertex } from "../model/graphvertex.js";
import { GraphInner } from "../model/graphinner.js";
import { GraphEdge } from "../model/graphedge.js";
import { getAttribute } from "../model/support.js";
import { GraphContainer } from "../model/graphcontainer.js";
import { GraphConnectable } from "./graphconnectable.js";

/**
 *
 * Called from grammar to inject a new (COLOR) variable
 * Only colors supported currently, though there's really no limitation
 *
 * If this is assignment, rewrite the variable, else assign new
 * Always return the current value
 *
 * Usage: grammar/diagrammer.grammar
 *
 * @param yy Lexer yy
 * @param {string} variable ${XXX:yyy} assignment or ${XXX} query
 * @return {string} Value of the variable
 */
export function processVariable(yy, variable) {
    // ASSIGN VARIABLE
    // $(NAME:CONTENT...)
    // or
    // refer variable
    // $(NAME)
    const vari = variable.slice(2, -1);
    if (vari.indexOf(":") !== -1) {
        // Assignment
        const tmp = vari.split(":");
        debug(`GOT assignment ${tmp[0]}=${tmp[1]}`);
        _getVariables(yy)[tmp[0]] = tmp[1];
        return tmp[1];
    } else {
        // referral
        if (!_getVariables(yy)[vari]) {
            throw new Error(`Variable ${vari} not defined`);
        }
        return _getVariables(yy)[vari];
    }
}

/**
 * Create an array, push LHS,RHS vertices there and return the array as long as
 * processing the list vertices added to array..
 *
 * Usage: grammar/diagrammer.grammar
 *
 * @param yy Lexer yy
 * @param {(GraphConnectable|GraphConnectable[])} lhs left hand side of the list
 * @param {GraphConnectable} rhs right hand side of the list
 * @param {string} rhsEdgeLabel optional RHS label
 * @return {(GraphConnectable|GraphConnectable[])}
 */
export function getList(yy, lhs, rhs, rhsEdgeLabel) {
    if (lhs instanceof GraphVertex) {
        debug(`getList(vertex:${lhs},rhs:[${rhs}])`, true);
        /** @type {(GraphConnectable|GraphConnectable[])} */
        const lst = [];
        lst.push(lhs);
        //TODO assuming RHS is Vertex
        const rhsFound = getVertex(yy, rhs);
        if (rhsFound instanceof GraphGroup || rhsFound instanceof GraphVertex) {
            rhsFound.setEdgeLabel(rhsEdgeLabel);
        }
        // @ts-ignore
        lst.push(rhsFound);
        debug(`return vertex:${lst}`, false);
        return lst;
    } else if (lhs instanceof GraphGroup) {
        debug(`getList(group:[${lhs}],rhs:${rhs})`, true);
        const lst = [];
        lst.push(lhs);
        //TODO assuming RHS is Group
        lst.push(getGroup(yy, rhs).setEdgeLabel(rhsEdgeLabel));
        debug(`return group:${lst}`, false);
        return lst;
    }
    if (!(lhs instanceof Array)) {
        throw new Error("getList requires LHS to be Vertex, Group or Array");
    }
    debug(`getList(lhs:[${lhs}],rhs:${rhs}`, true);
    // LHS not a vertex..
    const rhsFound = getVertex(yy, rhs);
    if (rhsFound instanceof GraphGroup || rhsFound instanceof GraphVertex) {
        rhsFound.setEdgeLabel(rhsEdgeLabel);
    }
    // @ts-ignore
    lhs.push(rhsFound);
    debug(`return [${lhs}]`, false);
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
 * Usage: grammar/diagrammer.grammar
 *
 * @param yy Lexer yy
 * @param {(string|GraphConnectable)} objOrName Reference, Vertex/(never observed Array)/Group
 * @param {string} [style] OPTIONAL if style given, update (only if name refers to vertex)
 * @return {GraphConnectable} Comment claims to return Array, but quick run didn't reveal Array ever returned..
 */
export function getVertex(yy, objOrName, style) {
    debug(`getVertex (name:${objOrName},style:${style})`, true);

    function findVertex(yy, /** @type {(string|GraphConnectable)}*/obj, style) {
        if (obj instanceof GraphVertex) {
            if (style) obj.setStyle(style);
            return obj;
        }
        // TODO: remove
        if (obj instanceof Array || Array.isArray(obj)) {
            // TODO: Get rid of this block, makes no sense...?? ANymore??
            throw new Error("Should never happen");
            return obj;
        }

        const search = function s(/**@type {GraphContainer} */container, name) {
            if (container.getName() == name) return container;
            for (const i in container.OBJECTS) {
                if (!container.OBJECTS.hasOwnProperty(i)) continue;
                const o = container.OBJECTS[i];
                if (o instanceof GraphVertex && o.getName() == name) {
                    if (style) o.setStyle(style);
                    return o;
                }
                if (o instanceof GraphGroup) {
                    const found = s(o, name);
                    if (found) return found;
                }
            }
            return undefined;
        }(getGraphCanvas(yy), obj);
        if (search) {
            return search;
        }
        // if obj was GraphConnectable?
        if (obj instanceof GraphConnectable) {
            throw new Error("Expecting string");
        }
        debug(`Create new vertex name=${obj}`, true);
        const vertex = new GraphVertex(obj, getGraphCanvas(yy).getCurrentShape());
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

    const vertex = findVertex(yy, objOrName, style);
    debug(`  in getVertex gotVertex ${vertex}`);
    // TODO: MOVING TO GraphCanvas
    yy.lastSeenVertex = vertex;
    if (yy.collectNextVertex) {
        debug("Collect next vertex");
        // TODO: make vertex? Do we know that it is vertex(yet?)
        // TODO: MOVING TO GraphCanvas
        yy.collectNextVertex.exitedge = vertex;
        // TODO: MOVING TO GraphCanvas
        yy.collectNextVertex = undefined;
    }
    debug(false);
    return vertex;
}

/**
 * TODO: DUAL DECLARATION
 *
 * Usage: grammar/diagrammer.grammar
 *
 * Get current container
 * @param yy Lexer
 * @return {GraphContainer}
 */
export function getCurrentContainer(yy) {
    // no need for value, but runs init if missing
    getGraphCanvas(yy);
    return yy.CURRENTCONTAINER[yy.CURRENTCONTAINER.length - 1];
}

/**
 * Enter into a new container, set it as current container
 *
 * Usage: grammar/diagrammer.grammar
 *
 * @param yy lexer
 * @param {GraphContainer} container Set this container as current container
 * @return {GraphContainer}
 */
export function enterContainer(yy, container) {
    yy.CURRENTCONTAINER.push(container);
    return container;
}

/**
 * Exit the current container
 * Return the previous one
 * Previous one also set as current container
 *
 * Usage: grammar/diagrammer.grammar
 *
 * @param yy lexer
 */
export function exitContainer(yy) {
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
 * Usage: grammar/diagrammer.grammar
 */
export function enterSubGraph(yy) {
    return enterContainer(yy, _getSubGraph(yy));
}

/*
 * Usage: grammar/diagrammer.grammar
 */
export function exitSubGraph(yy) {
    //Now should edit the ENTRANCE EDGE to point to a>b, a>d, a>e
    const currentSubGraph_TypeCheckerFix = getCurrentContainer(yy);
    if (currentSubGraph_TypeCheckerFix instanceof GraphCanvas) {
        throw new Error("Subgraph cannot be canvas");
    }
    if (!(currentSubGraph_TypeCheckerFix instanceof GraphInner)) {
        throw new Error(`Subgraph cannot be any other than GraphInner:${typeof (currentSubGraph_TypeCheckerFix)}`);
    }
    /** @type {(GraphInner)} */
    const currentSubGraph = currentSubGraph_TypeCheckerFix;

    debug(`Exit subgraph ${currentSubGraph}`);
    /** @type {GraphEdge} */
    let edge = null;

    let edgeIndex = undefined;

    //fix entrance
    for (const idx in yy.EDGES) {
        if (!yy.EDGES.hasOwnProperty(idx)) continue;
        edge = yy.EDGES[idx];
        if (edge.right.name == currentSubGraph.name &&
            currentSubGraph.entrance instanceof GraphConnectable &&
            edge.left.name == currentSubGraph.entrance.name) {
            //remove this edge!
            edgeIndex = Number(idx);
            yy.EDGES.splice(edgeIndex, 1);
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
            if (currentSubGraph.entrance && currentSubGraph.entrance instanceof GraphVertex) {
                // TODO: Assumes entrance is GraphVertex, but it looks it can be other things
                currentSubGraph.entrance.noedges = undefined;
            }
            vertex.noedges = undefined;
            const newEdge = getEdge(yy, edge.edgeType, currentSubGraph.entrance, vertex, edge.label,
                undefined, undefined, undefined, undefined, true);
            newEdge.container = currentSubGraph;
            yy.EDGES.splice(edgeIndex++, 0, newEdge);
        }
    }

    /** @type {GraphConnectable} */
    let lastVertex;

    //fix exits
    //{"link":{"edgeType":">","left":1,"right":"z","label":"from e and h"}}
    const exits = [];
    for (const idx in currentSubGraph.OBJECTS) {
        if (!currentSubGraph.OBJECTS.hasOwnProperty(idx)) continue;
        const vertex = currentSubGraph.OBJECTS[idx];
        lastVertex = vertex;
        if (!hasOutwardEdge(yy, vertex)) {
            exits.push(vertex);
        }
    }

    debug(`exits ${exits}`);
    if (lastVertex) {
        currentSubGraph.setExit(lastVertex);
    }
    return exitContainer(yy);
}

/**
 * Create a NEW GROUP if one (ref) does not exist yet getGroup(yy) => create a
 * new anonymous group getGroup(yy,GroupRef) => create a new group if GroupRef
 * is not a Group or return GroupRef if it is...1
 *
 * Usage: grammar/diagrammer.grammar
 *
 * @param yy lexer
 * @param ref Type of reference, if group, return it
 * @return ref if ref instance of group, else the newly created group
 */
export function getGroup(yy, ref) {
    if (ref instanceof GraphGroup) return ref;
    debug(`getGroup() NEW GROUP:${yy}/${ref}`, true);
    // TODO: MOVING TO GraphCanvas
    if (!yy.GROUPIDS) yy.GROUPIDS = 1;
    const newGroup = new GraphGroup(String(yy.GROUPIDS++));
    debug(`push group ${newGroup} to ${yy}`);
    _pushObject(yy, newGroup);

    _getDefaultAttribute(yy, 'groupcolor', function (color) {
        newGroup.setColor(color);
    });
    debug(false);
    return newGroup;
}

// Get an edge such that l links to r, return the added Edge or EDGES

/**
 * edgeType >,<,.>,<.,->,<-,<> l = left side, Vertex(xxx) or Group(yyy), or
 * Array(smthg) r = right side, Vertex(xxx) or Group(yyy), or Array(smthg) label =
 * if defined, LABEL for the edge color = if defined, COLOR for the edge
 *
 * if there is a list a>b,c,x,d;X then X is gonna be edge label for EVERYONE
 * but for a>"1"b,"2"c edge label is gonna be individual!
 *
 * Usage: grammar/diagrammer.grammar
 *
 * @param yy lexer
 * @param {string} edgeType Type of the edge(grammar)
 * @param {(GraphConnectable|GraphConnectable[])} lhs Left hand side (must be Array,Vertex,Group)
 * @param {(GraphConnectable|GraphConnectable[])} rhs Right hand side (must be Array,Vertex,Group)
 * @param {string} [inlineEdgeLabel] Optional label for the edge
 * @param {string} [commonEdgeLabel] Optional label for the edge
 * @param {string} [edgeColor] Optional color for the edge
 * @param {string} [lcompass] Left hand side compass value
 * @param {string} [rcompass] Reft hand side compass value
 * @param {boolean} [dontadd] Reft hand side compass value
 * @return {GraphEdge} the edge that got added
 */
export function getEdge(yy, edgeType, lhs, rhs, inlineEdgeLabel, commonEdgeLabel, edgeColor, lcompass, rcompass, dontadd) {
    let lastEdge;
    const current_container = getCurrentContainer(yy);
    debug(true);
    if (rhs instanceof GraphInner && !rhs.getEntrance()) {
        rhs.setEntrance(lhs);
    }
    if (rhs instanceof GraphVertex) {
        // if RHS has no edges (and is contained in a container) AND found from ROOTVERTICES, remove it from ROOTVERTICES
        if (rhs.noedges && current_container) {
            debug(`REMOVE ${rhs} from root vertices of the container ${current_container}`);
            const idx = current_container.ROOTVERTICES.indexOf(rhs);
            if (idx >= 0) {
                const removed = current_container.ROOTVERTICES.splice(idx, 1);
                debug(`REMOVE ${removed} from ROOTVERTICES`);
            }
        }
        // TODO: Should noedges be set to GraphConnectable (except Edge..)
        // TODO: Also if this is an array, this assignment makes no sense
        if (lhs instanceof GraphVertex) {
            lhs.noedges = undefined;
        }
        rhs.noedges = undefined;
    }
    if (current_container instanceof GraphInner &&
        !current_container.getEntrance() &&
        lhs instanceof GraphVertex &&
        !(rhs instanceof GraphInner)) {
        current_container.setEntrance(lhs);
    }

    if (lhs instanceof Array) {
        debug(`getEdge LHS array, type:${edgeType} l:[${lhs}] r:${rhs} inlineEdgeLabel:${inlineEdgeLabel} commonEdgeLabel: ${commonEdgeLabel} edgeColor:${edgeColor} lcompass:${lcompass} rcompass:${rcompass}`);
        for (let i = 0; i < lhs.length; i++) {
            debug(`    1Get edge ${lhs[i]}`);
            lastEdge = getEdge(yy, edgeType, lhs[i], rhs, inlineEdgeLabel, commonEdgeLabel, edgeColor, lcompass, rcompass);
        }
        debug(false);
        return lastEdge;
    }
    if (rhs instanceof Array) {
        debug(`getEdge RHS array, type:${edgeType} l:${lhs} r:[${rhs}] inlineEdgeLabel:${inlineEdgeLabel} commonEdgeLabel: ${commonEdgeLabel} edgeColor:${edgeColor} lcompass:${lcompass} rcompass:${rcompass}`);
        for (let i = 0; i < rhs.length; i++) {
            debug(`    2Get edge ${rhs[i]}`);
            lastEdge = getEdge(yy, edgeType, lhs, rhs[i], inlineEdgeLabel, commonEdgeLabel, edgeColor, lcompass, rcompass);
        }
        debug(false);
        return lastEdge;
    }
    {
        let fmt = "";
        if (inlineEdgeLabel)
            fmt += `inlineEdgeLabel: ${inlineEdgeLabel}`;
        if (commonEdgeLabel)
            fmt += `commonEdgeLabel: ${commonEdgeLabel}`;
        if (edgeColor)
            fmt += `edgeColor: ${edgeColor}`;
        if (lcompass)
            fmt += `lcompass: ${lcompass}`;
        if (rcompass)
            fmt += `rcompass: ${rcompass}`;
        debug(`getEdge type:${edgeType} l:${lhs} r:${rhs}${fmt}`);
    }
    if (!(lhs instanceof GraphVertex) && !(lhs instanceof GraphGroup) && !(lhs instanceof GraphInner)) {
        throw new Error(`LHS not a Vertex,Group nor a SubGraph(LHS=${lhs}) RHS=(${rhs})`);
    }
    if (!(rhs instanceof GraphVertex) && !(rhs instanceof GraphGroup) && !(rhs instanceof GraphInner)) {
        throw new Error(`RHS not a Vertex,Group nor a SubGraph(LHS=${lhs}) RHS=(${rhs})`);
    }
    const edge = new GraphEdge(edgeType, lhs, rhs);

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
        debug(`  set commonEdgeLabel ${commonEdgeLabel}`);
    }
    if (inlineEdgeLabel) {
        edge.setLabel(inlineEdgeLabel);
        debug(`  set inlineEdgeLabel ${inlineEdgeLabel}`);
    }
    else if (rhs instanceof GraphVertex && commonEdgeLabel) {
        edge.setLabel(commonEdgeLabel);
        debug(`  set commonEdgeLabel ${commonEdgeLabel}`);
    }
    if (rhs instanceof GraphVertex) {
        const tmp = rhs.getEdgeLabel();
        if (tmp) {
            edge.setLabel(tmp);
            debug(`  reset edge label to ${tmp}`);
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

/**
 * Get current singleton graphcanvas or create new one
 * External utility support for generator
 *
 * Usage: grammar/diagrammer.grammar, generators
 * @return {GraphCanvas}
 */
export function getGraphCanvas(yy) {
    if (!yy.GRAPHCANVAS) {
        if (!yy.result) {
            throw new Error("Initialization has failed!");
        }
        debug(`...Initialize emptyroot ${yy}`);
        // TODO: DOESN'T WORK as type hint! Modularize to own obj..
        /** @type  {GraphContainer} */
        yy.CURRENTCONTAINER = [];
        /** @type {GraphEdge[]} */
        yy.EDGES = [];
        /** @type {number} */
        yy.CONTAINER_EXIT = 1;
        /** @type  {GraphCanvas} */
        yy.GRAPHCANVAS = new GraphCanvas();
        enterContainer(yy, yy.GRAPHCANVAS);
    }
    return yy.GRAPHCANVAS;
}

/** 
 * Usage: grammar/diagrammer.grammar, generators/digraph.js
 * @param {GraphConnectable} vertex
 */
export function hasOutwardEdge(yy, vertex) {
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
 * @param {GraphConnectable} vertex
 * @param {GraphContainer} verticesContainer (Group?)
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
 * @param {GraphContainer} container
 * @param {GraphConnectable} obj
 */
function containsObject(container, obj) {
    for (const i in container.OBJECTS) {
        if (!container.OBJECTS.hasOwnProperty(i)) continue;
        const c = container.OBJECTS[i];
        if (c == obj) {
            return true;
        }
        if (c instanceof GraphGroup) {
            if (containsObject(c, obj)) {
                return true;
            }
        }
    }
    return false;
}

/** 
 * Usage: generators
 * @param {GraphCanvas} graphcanvas
 * @param {function(GraphEdge):void} callback
 */
export function traverseEdges(graphcanvas, callback) {
    debug(`${graphcanvas.ROOTVERTICES}`);
    for (const i in graphcanvas.EDGES) {
        if (!graphcanvas.EDGES.hasOwnProperty(i)) continue;
        callback(graphcanvas.EDGES[i]);
    }
}

/**
 * Usage: generators
 * @param {GraphContainer} container
 * @param {function(GraphContainer|GraphVertex):void} callback
 */
export function traverseVertices(container, callback) {
    for (const i in container.OBJECTS) {
        if (!container.OBJECTS.hasOwnProperty(i)) continue;
        // this can only be GraphVertex|GraphGroup|GraphInner
        // didn't figure out how to keep typechecker happy now (TODO:)
        const obj = container.OBJECTS[i];
        // just to keep linter happy... Also Inner is always Group, so not necessary
        if (obj instanceof GraphContainer || obj instanceof GraphVertex) {
            callback(obj);
        }
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
        // TODO: MOVING TO GraphCanvas
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
    getGraphCanvas(yy);
    for (const i in yy.CURRENTCONTAINER) {
        if (!yy.CURRENTCONTAINER.hasOwnProperty(i)) continue;
        const ctr = yy.CURRENTCONTAINER[i];
        const defaultAttribute = ctr.getDefault(attrname);
        if (defaultAttribute) {
            if (callback)
                callback(defaultAttribute);
            return defaultAttribute;
        }
    }
    const defaultAttribute = getGraphCanvas(yy).getDefault(attrname);
    if (defaultAttribute) {
        debug("_getDefaultAttribute got from graphcanvas");
        if (callback)
            callback(defaultAttribute);
        return defaultAttribute;
    }
    return undefined;
}

/**
 * Create a new sub graph or return passed in reference (if it is a subgraph)
 * @param {GraphInner} [ref]
 */
function _getSubGraph(yy, ref) {
    if (ref instanceof GraphInner) return ref;
    if (!yy.SUBGRAPHS) yy.SUBGRAPHS = 1;
    const newSubGraph = new GraphInner(String(yy.SUBGRAPHS++));
    _pushObject(yy, newSubGraph);
    return newSubGraph;
}

/**
 * Add edge to the list of edges, return the Edge
 * @param yy lexer
 * @param {(GraphEdge[]|GraphEdge)} edge Edge (Edge or Edge[])
 * @return {(GraphEdge[]|GraphEdge)} Return What ever passed in
 */
function _addEdge(yy, edge) {
    if (edge instanceof Array) {
        debug(`PUSH EDGE ARRAY:${edge}`, true);
    } else {
        debug(`PUSH EDGE:${edge}`, true);
        edge.container = getCurrentContainer(yy);
    }
    yy.EDGES.push(edge);
    debug(false);
    return edge;
}

/**
 * Push given object into a current container
 * @param {(GraphVertex|GraphContainer)} o
 */
function _pushObject(yy, o) {
    const cnt = getCurrentContainer(yy)
    debug(`_pushObject ${o}to ${cnt}`, true);
    cnt.OBJECTS.push(o);
    debug(`PUSHING OBJECT ${o} to ROOTVERTICES`);
    cnt.ROOTVERTICES.push(o);
    debug(false);
    return o;
}
