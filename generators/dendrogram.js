// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators, visualizations } from '../model/graphcanvas.js';
import { debug, output } from '../model/support.js';
import { GraphVertex } from '../model/graphvertex.js';
import { traverseEdges } from '../model/model.js';
import { TreeVertex, findVertex, traverseTree } from '../model/tree.js';
import { GraphConnectable } from '../model/graphconnectable.js';

/**
 * To test: node js/diagrammer.js verbose tests/test_inputs/dendrogram.txt dendrogram
 * @param {GraphCanvas} graphcanvas
*/
export function dendrogram(graphcanvas) {
	let tree;
	/**
	 * @param {GraphConnectable} lhs
	 * @param {GraphConnectable} rhs
	 */
	function addVertex(lhs, rhs) {
		if (!tree) {
			tree = new TreeVertex(lhs);
		}
		if (!(lhs instanceof GraphVertex)) return;
		const cl = findVertex(tree, lhs);
		if (!cl) {
			throw new Error(`Left node (${lhs.name}) not found from tree`);
		}
		if (!findVertex(tree, rhs) && (rhs instanceof GraphVertex)) {
			debug(`Add ${rhs.name} as child of ${cl.data.name} co ${rhs.container}`);
			cl.CHILDREN.push(new TreeVertex(rhs));
		}
	}

	/**
	 * For a dendrogram we're not interested in vertices
	 * just edges(for now!)
	 */
	traverseEdges(graphcanvas, edge => {
		addVertex(edge.left, edge.right);
	});

	traverseTree(tree, (t, isLeaf, hasSibling) => {
		if (isLeaf) {
			let comma = '';
			if (hasSibling)
				comma = ',';
			output(graphcanvas, `{"name": "${t.data.name}", "size": 1}${comma}`);
		} else {
			output(graphcanvas, '{', true);
			output(graphcanvas, `"name": "${t.data.name}",`);
		}
	}, (t) => {
		output(graphcanvas, '"children": [', true);
	}, (t, hasNextSibling) => {
		output(false);
		output(graphcanvas, ']', false);
		if (hasNextSibling) {
			output(graphcanvas, '},');
		} else {
			output(graphcanvas, '}');
		}
	});
	output(false);
}
generators.set('dendrogram', dendrogram);
visualizations.set('dendrogram', ['radialdendrogram', 'circlepacked', 'reingoldtilford']);
