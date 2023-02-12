// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators } from '../model/graphcanvas.js';
import { traverseEdges } from '../model/model.js';
import { debug, output } from '../model/support.js';
import { GraphVertex } from '../model/graphvertex.js';

/**
 * Only one root supported!
 * To test: node js/diagrammer.js tests/test_inputs/parsetree.txt parsetree
 * 
 * @param {GraphCanvas} graphcanvas
 */
export function parsetree(graphcanvas) {
    const nodeList = [];
    function addEdgeedVertex(left, right) {
        if (!(left instanceof GraphVertex)) return;
        if (!(right instanceof GraphVertex)) return;
        const key = right.id;
        const parent = left.id;
        const text = (!right.label) ? right.name : right.label;
        nodeList.push({ key: key, text: text, fill: "#f8f8f8", stroke: "#4d90fe", parent: parent });
    }

    //debug(JSON.stringify(graphcanvas.EDGES));

    const root = graphcanvas.ROOTVERTICES;
    if (root.length > 1) {
        throw new Error('Only one root node supported');
    }

    (() => {
        root[0].id = 1;
        const text = (!root[0].label) ? root[0].name : root[0].label;
        nodeList.push({ key: root[0].id, text: text, fill: "#f8f8f8", stroke: "#4d90fe" });
        let keyId = 2;
        graphcanvas.OBJECTS.forEach((node) => {
            if (!node.id) {
                node.id = keyId++;
            }
        });
    })();

    traverseEdges(graphcanvas, edge => {
        debug('edge ' + edge.left.name + ' to ' + edge.right.name);
        addEdgeedVertex(edge.left, edge.right);
    });
    //debug(JSON.stringify(nodeList));
    output(graphcanvas, JSON.stringify(nodeList));
    output(false);
}
generators.set('parsetree', parsetree);