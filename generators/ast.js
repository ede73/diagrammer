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

node js/diagrammer.js verbose ast.test ast
@param {GraphCanvas} graphcanvas
*/
function ast(graphcanvas) {
    debug(graphcanvas)
    const processAVertex = o => {
    };

    output(graphcanvas, "[");
    const skipEntrances = (key, value) => {
        if (key === 'entrance' || key === 'exit') {
            return value;
        }
        return value;
    };
    if (graphcanvas.getVisualizer())
        output(graphcanvas, JSON.stringify({
            visualizer: graphcanvas.getVisualizer()
        }));
    if (graphcanvas.getDirection())
        output(graphcanvas, JSON.stringify({
            direction: graphcanvas.getDirection()
        }));
    if (graphcanvas.getStart())
        output(graphcanvas, JSON.stringify({
            start: graphcanvas.getStart()
        }));
    if (graphcanvas.getEqual())
        output(graphcanvas, JSON.stringify({
            equal: graphcanvas.getEqual()
        }));

    const objectHandler = /** @type {function((GraphGroup|GraphVertex))}*/obj => {
        output(true);
        if (obj instanceof GraphGroup) {
            const processAGroup = (o => {
                const n = JSON.parse(JSON.stringify(o, skipEntrances));
                n.OBJECTS = undefined;
                output(graphcanvas, JSON.stringify({
                    group: n
                }) + ",");
                output(graphcanvas, '[');
                traverseVertices(o, objectHandler);
                output(graphcanvas, ']');
            })(obj);
        } else if (obj instanceof GraphInner) {
            const processASubGraph = (o => {
                const n = JSON.parse(JSON.stringify(o, skipEntrances));
                n.OBJECTS = undefined;
                output(graphcanvas, JSON.stringify({
                    subgraph: n
                }) + ",");
                output(graphcanvas, '[');
                traverseVertices(o, objectHandler);
                output(graphcanvas, ']');
            })(obj);
        } else if (obj instanceof GraphVertex) {
            output(graphcanvas, JSON.stringify({
                node: obj
            }) + ",");
        } else {
            throw new Error("Not a node nor a group, NOT SUPPORTED");
        }
        output(false);
    };
    traverseVertices(graphcanvas.OBJECTS, objectHandler);

    output(true);
    traverseEdges(graphcanvas, edge => {
        const n = JSON.parse(JSON.stringify(edge, skipEntrances));
        n.left = n.left.name;
        n.right = n.right.name;
        n.container.OBJECTS = undefined;
        n.container.label = undefined;
        n.container.isInnerGraph = undefined;
        n.container.entrance = n.container.entrance ? n.container.entrance.name : undefined;
        n.container.exitvertex = n.container.exitvertex ? n.container.exitvertex.name : undefined;
        n.container.conditional = undefined;
        n.container = n.container.name;
        output(graphcanvas, JSON.stringify({ edge: n }) + ",");
    });
    output(false);
    output(graphcanvas, "]", false);
}
generators.set('ast', ast);