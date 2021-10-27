/*
a>b>c,d
a>e;link text
a;node text

yy={
    CONTAINER_EXIT: 1
    CURRENTCONTAINER: [GraphRoot]
    GRAPHROOT: GraphRoot {OBJECTS: Array(5), ROOTNODES: Array(1), setGenerator: ƒ, getGenerator: ƒ, setVisualizer: ƒ, …}
        OBJECTS: Array(5)
            0: Node
                compass: undefined
                getImage: ƒ ()
                getLinkLabel: ƒ ()
                getShape: ƒ ()
                getStyle: ƒ ()
                image: undefined
                label: "node text"
                name: "a"
                nolinks: undefined
                setImage: ƒ (value)
                setLinkLabel: ƒ (value)
                setShape: ƒ (value)
                setStyle: ƒ (value)
                shape: undefined
                style: undefined
                toString: ƒ ()
                [[Prototype]]: GraphObject
            1: Node {name: 'b', shape: undefined, image: undefined, style: undefined, setShape: ƒ, …}
            2: Node {name: 'c', shape: undefined, image: undefined, style: undefined, setShape: ƒ, …}
            3: Node {name: 'd', shape: undefined, image: undefined, style: undefined, setShape: ƒ, …}
            4: Node {name: 'e', shape: undefined, image: undefined, style: undefined, setShape: ƒ, …}
            length: 5
    ROOTNODES: Array(1)
        0: Node {name: 'a', shape: undefined, image: undefined, style: undefined, setShape: ƒ, …}
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
    LINKS: (4) [Link, Link, Link, Link]
        0: Link
            container: GraphRoot {OBJECTS: Array(5), ROOTNODES: Array(1), setGenerator: ƒ, getGenerator: ƒ, setVisualizer: ƒ, …}
            left: Node
                compass: undefined
                getImage: ƒ ()
                getLinkLabel: ƒ ()
                getShape: ƒ ()
                getStyle: ƒ ()
                image: undefined
                label: "node text"
                name: "a"
                nolinks: undefined
                setImage: ƒ (value)
                setLinkLabel: ƒ (value)
                setShape: ƒ (value)
                setStyle: ƒ (value)
                shape: undefined
                style: undefined
                toString: ƒ ()
                [[Prototype]]: GraphObject
                linkType: ">"
            right: Node {name: 'b', shape: undefined, image: undefined, style: undefined, setShape: ƒ, …}
            toString: ƒ ()
            [[Prototype]]: GraphObject
        1: Link {linkType: '>', left: Node, right: Node, container: GraphRoot, toString: ƒ}
        2: Link {linkType: '>', left: Node, right: Node, container: GraphRoot, toString: ƒ}
        3: Link {linkType: '>', left: Node, right: Node, label: 'link text', toString: ƒ, …}
        length: 4
    OUTPUT: "ast"
    VISUALIZER: "ast"
    lastSeenNode: Node {name: 'a', shape: undefined, image: undefined, style: undefined, setShape: ƒ, …}
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
    {"link":{"linkType":">","left":"a","right":"b"}},
    {"link":{"linkType":">","left":"b","right":"c"}},
    {"link":{"linkType":">","left":"b","right":"d"}},
    {"link":{"linkType":">","left":"a","right":"e","label":"link text"}},
}

node parse.js verbose parsetree.test ast
*/
function ast(yy) {
    console.log(yy)
    const processANode = o => {
    };

    output(yy, "{");
    const skipEntrances = (key, value) => {
        if (key === 'entrance' || key === 'exit') {
            return value;
        }
        return value;
    };
    const r = getGraphRoot(yy);
    if (r.getVisualizer())
        output(yy, JSON.stringify({
            visualizer: r.getVisualizer()
        }));
    if (r.getDirection())
        output(yy, JSON.stringify({
            direction: r.getDirection()
        }));
    if (r.getStart())
        output(yy, JSON.stringify({
            start: r.getStart()
        }));
    if (r.getEqual())
        output(yy, JSON.stringify({
            equal: r.getEqual()
        }));

    const objectHandler = o => {
        output(true);
        if (o instanceof Group) {
            const processAGroup = (o => {
                const n = JSON.parse(JSON.stringify(o, skipEntrances));
                n.OBJECTS = undefined;
                output(yy, JSON.stringify({
                    group: n
                }) + ",");
                output(yy, '{');
                traverseObjects(o, objectHandler);
                output(yy, '},');
            })(o);
        } else if (o instanceof SubGraph) {
            const processASubGraph = (o => {
                const n = JSON.parse(JSON.stringify(o, skipEntrances));
                n.OBJECTS = undefined;
                output(yy, JSON.stringify({
                    subgraph: n
                }) + ",");
                output(yy, '{');
                traverseObjects(o, objectHandler);
                output(yy, '},');
            })(o);
        } else if (o instanceof Node) {
            output(yy, JSON.stringify({
                node: o
            }) + ",");
        } else {
            throw new Error("Not a node nor a group, NOT SUPPORTED");
        }
        output(false);
    };
    traverseObjects(r, objectHandler);

    output(true);
    traverseLinks(yy, l => {
        const n = JSON.parse(JSON.stringify(l, skipEntrances));
        n.left = n.left.name;
        n.right = n.right.name;
        n.container.OBJECTS = undefined;
        n.container.label = undefined;
        n.container.isSubGraph = undefined;
        n.container.entrance = n.container.entrance ? n.container.entrance.name : undefined;
        n.container.exitnode = n.container.exitnode ? n.container.exitnode.name : undefined;
        n.container.conditional = undefined;
        n.container = n.container.name;
        output(yy, JSON.stringify({ link: n }) + ",");
    });
    output(false);
    output(yy, "}", false);
}
