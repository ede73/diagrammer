/**
a>b>c,d
a>e;link text
a;node text

yy={
    CONTAINER_EXIT: 1
    CURRENTCONTAINER: [GraphRoot]
    GRAPHROOT: GraphRoot {OBJECTS: Array(5), ROOTVERTICES: Array(1), setGenerator: ƒ, getGenerator: ƒ, setVisualizer: ƒ, …}
        OBJECTS: Array(5)
            0: Vertex
                compass: undefined
                getImage: ƒ ()
                getEdgeLabel: ƒ ()
                getShape: ƒ ()
                getStyle: ƒ ()
                image: undefined
                label: "node text"
                name: "a"
                noedges: undefined
                setImage: ƒ (value)
                setEdgeLabel: ƒ (value)
                setShape: ƒ (value)
                setStyle: ƒ (value)
                shape: undefined
                style: undefined
                toString: ƒ ()
                [[Prototype]]: GraphObject
            1: Vertex {name: 'b', shape: undefined, image: undefined, style: undefined, setShape: ƒ, …}
            2: Vertex {name: 'c', shape: undefined, image: undefined, style: undefined, setShape: ƒ, …}
            3: Vertex {name: 'd', shape: undefined, image: undefined, style: undefined, setShape: ƒ, …}
            4: Vertex {name: 'e', shape: undefined, image: undefined, style: undefined, setShape: ƒ, …}
            length: 5
    ROOTVERTICES: Array(1)
        0: Vertex {name: 'a', shape: undefined, image: undefined, style: undefined, setShape: ƒ, …}
        length: 1
    [[Prototype]]: Array(0)
    getCurrentShape: ƒ ()
    getDefault: ƒ (key)
    getDirection: ƒ ()
    getEqual: ƒ ()
    getGenerator: ƒ ()
    getStart: ƒ ()
    getVisualizer: ƒ ()
    setCurrentShape: ƒ (value)
    setDefault: ƒ (key, value)
    setDirection: ƒ (value)
    setEqual: ƒ (value)
    setGenerator: ƒ (value)
    setStart: ƒ (value)
    setVisualizer: ƒ (value)
    toString: ƒ ()
    [[Prototype]]: GraphObject
    EDGES: (4) [Edge, Edge, Edge, Edge]
        0: Edge
            container: GraphRoot {OBJECTS: Array(5), ROOTVERTICES: Array(1), setGenerator: ƒ, getGenerator: ƒ, setVisualizer: ƒ, …}
            left: Vertex
                compass: undefined
                getImage: ƒ ()
                getEdgeLabel: ƒ ()
                getShape: ƒ ()
                getStyle: ƒ ()
                image: undefined
                label: "node text"
                name: "a"
                noedges: undefined
                setImage: ƒ (value)
                setEdgeLabel: ƒ (value)
                setShape: ƒ (value)
                setStyle: ƒ (value)
                shape: undefined
                style: undefined
                toString: ƒ ()
                [[Prototype]]: GraphObject
                edgeType: ">"
            right: Vertex {name: 'b', shape: undefined, image: undefined, style: undefined, setShape: ƒ, …}
            toString: ƒ ()
            [[Prototype]]: GraphObject
        1: Edge {edgeType: '>', left: Vertex, right: Vertex, container: GraphRoot, toString: ƒ}
        2: Edge {edgeType: '>', left: Vertex, right: Vertex, container: GraphRoot, toString: ƒ}
        3: Edge {edgeType: '>', left: Vertex, right: Vertex, label: 'link text', toString: ƒ, …}
        length: 4
    OUTPUT: "ast"
    VISUALIZER: "ast"
    lastSeenVertex: Vertex {name: 'a', shape: undefined, image: undefined, style: undefined, setShape: ƒ, …}
    lexer: {yy: {…}, _input: '', done: true, _backtrack: false, _more: false, …}
    parseError: ƒ (str, hash)
    parser: Parser {yy: {…}, trace: ƒ, parseError: ƒ}
    result: ƒ (line)
    [[Prototype]]: Object
}

to
{
    {"node":{"name":"a","label":"node text"}},
    {"node":{"name":"b"}},
    {"node":{"name":"c"}},
    {"node":{"name":"d"}},
    {"node":{"name":"e"}},
    {"link":{"edgeType":">","left":"a","right":"b"}},
    {"link":{"edgeType":">","left":"b","right":"c"}},
    {"link":{"edgeType":">","left":"b","right":"d"}},
    {"link":{"edgeType":">","left":"a","right":"e","label":"link text"}},
}

node js/parse.js verbose ast.test ast
@param {GraphMeta} graphmeta
*/
function ast(graphmeta) {
    console.log(graphmeta)
    const processAVertex = o => {
    };

    output(graphmeta, "[");
    const skipEntrances = (key, value) => {
        if (key === 'entrance' || key === 'exit') {
            return value;
        }
        return value;
    };
    const r = graphmeta.GRAPHROOT;
    if (r.getVisualizer())
        output(graphmeta, JSON.stringify({
            visualizer: r.getVisualizer()
        }));
    if (r.getDirection())
        output(graphmeta, JSON.stringify({
            direction: r.getDirection()
        }));
    if (r.getStart())
        output(graphmeta, JSON.stringify({
            start: r.getStart()
        }));
    if (r.getEqual())
        output(graphmeta, JSON.stringify({
            equal: r.getEqual()
        }));

    const objectHandler = o => {
        output(true);
        if (o instanceof Group) {
            const processAGroup = (o => {
                const n = JSON.parse(JSON.stringify(o, skipEntrances));
                n.OBJECTS = undefined;
                output(graphmeta, JSON.stringify({
                    group: n
                }) + ",");
                output(graphmeta, '[');
                traverseObjects(o, objectHandler);
                output(graphmeta, ']');
            })(o);
        } else if (o instanceof SubGraph) {
            const processASubGraph = (o => {
                const n = JSON.parse(JSON.stringify(o, skipEntrances));
                n.OBJECTS = undefined;
                output(graphmeta, JSON.stringify({
                    subgraph: n
                }) + ",");
                output(graphmeta, '[');
                traverseObjects(o, objectHandler);
                output(graphmeta, ']');
            })(o);
        } else if (o instanceof Vertex) {
            output(graphmeta, JSON.stringify({
                node: o
            }) + ",");
        } else {
            throw new Error("Not a node nor a group, NOT SUPPORTED");
        }
        output(false);
    };
    traverseObjects(r, objectHandler);

    output(true);
    traverseEdges(graphmeta, edge => {
        const n = JSON.parse(JSON.stringify(edge, skipEntrances));
        n.left = n.left.name;
        n.right = n.right.name;
        n.container.OBJECTS = undefined;
        n.container.label = undefined;
        n.container.isSubGraph = undefined;
        n.container.entrance = n.container.entrance ? n.container.entrance.name : undefined;
        n.container.exitvertex = n.container.exitvertex ? n.container.exitvertex.name : undefined;
        n.container.conditional = undefined;
        n.container = n.container.name;
        output(graphmeta, JSON.stringify({ edge: n }) + ",");
    });
    output(false);
    output(graphmeta, "]", false);
}
generators.set('ast', ast);