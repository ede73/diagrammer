/**
a>b>c,d
a>e;link text
a;node text

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
    debug(graphmeta)
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

    const objectHandler = /** @type {function((Group|GraphVertex))}*/obj => {
        output(true);
        if (obj instanceof Group) {
            const processAGroup = (o => {
                const n = JSON.parse(JSON.stringify(o, skipEntrances));
                n.OBJECTS = undefined;
                output(graphmeta, JSON.stringify({
                    group: n
                }) + ",");
                output(graphmeta, '[');
                traverseVertices(o, objectHandler);
                output(graphmeta, ']');
            })(obj);
        } else if (obj instanceof SubGraph) {
            const processASubGraph = (o => {
                const n = JSON.parse(JSON.stringify(o, skipEntrances));
                n.OBJECTS = undefined;
                output(graphmeta, JSON.stringify({
                    subgraph: n
                }) + ",");
                output(graphmeta, '[');
                traverseVertices(o, objectHandler);
                output(graphmeta, ']');
            })(obj);
        } else if (obj instanceof GraphVertex) {
            output(graphmeta, JSON.stringify({
                node: obj
            }) + ",");
        } else {
            throw new Error("Not a node nor a group, NOT SUPPORTED");
        }
        output(false);
    };
    traverseVertices(r, objectHandler);

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