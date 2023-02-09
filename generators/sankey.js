// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators } from '../model/graphcanvas.js';
import { traverseEdges } from '../model/model.js';
import { TreeVertex, findVertex, traverseTree } from '../model/tree.js';
import { GraphVertex } from '../model/graphvertex.js';
import { debug, output } from '../model/support.js';
import { GraphConnectable } from '../model/graphconnectable.js';

/**
a>b>c,d
a>e;edge text
a;node text

to
{
"name": "a",
"children": [
	{
		"name": "b",
		"children": [
			{"name": "c", "size": 1},
			{"name": "d", "size": 1}
		]
	},
	{"name": "e", "size": 1}
]
}

node js/diagrammer.js verbose sankey.test sankey
@param {GraphCanvas} graphcanvas
*/
export function sankey(graphcanvas) {
	let tree;
	/**
	 * 
	 * @param {string} str 
	 * @returns {number}
	 */
	function getNumber(str) {
		const nums = str.trim().match("^[0-9]+");
		if (nums) {
			return Number(nums[0]);
		}
		return 0;
	}
	/**
	 * 
	 * @param {GraphVertex} vertex 
	 * @param {number} size 
	 */
	function addSize(vertex, size) {
		if (vertex.size) {
			vertex.size += size;
		} else {
			vertex.size = size;
		}
	}
	/**
	 * 
	 * @param {GraphVertex} left 
	 * @param {GraphVertex} right 
	 * @returns 
	 */
	function addVertex(left, right) {
		if (!tree) {
			tree = new TreeVertex(left);
		}
		if (!(left instanceof GraphVertex)) return;
		const cl = findVertex(tree, left);
		if (!cl) {
			const cl = findVertex(tree, right);
			if (!cl) {
				throw new Error(`Left node (${left.name}) nor right (${right.name}) not found from tree`);
			}
			cl.CHILDREN.push(new TreeVertex(left));
		}
		if (!findVertex(tree, right) && (right instanceof GraphVertex)) {
			debug(`Add ${right.name} as child of ${cl.data.name} co ${right.container}`);
			cl.CHILDREN.push(new TreeVertex(right));
		}
	}

	/**
	 * For a dendrogram we're not interested in vertices
	 * just edges(for now!)
	 */
	traverseEdges(graphcanvas, function (edge) {
		//debug(`edge ${edge.left.name} to ${edge.right.name}`);
		if (edge.isLeftPointingEdge) {
			const amount = getNumber(edge.getLabel())
			//addSize(edge.left, amount);
			//addSize(edge.right, -amount);
		}
		if (edge.isRightPointingEdge) {
			const amount = getNumber(edge.getLabel())
			addSize(edge.left, amount);
			//addSize(edge.right, amount);
		}
		addVertex(edge.left, edge.right, edge.getLabel());
	});

	//output(graphcanvas,'{',true);
	traverseTree(tree, function (t, isLeaf, hasSibling) {
		let size = 0;
		if (t.data.size) {
			//console.log(t.data);
			//console.log(t.data.name);
			size = t.data.size;
		}
		if (isLeaf) {
			let comma = '';
			if (hasSibling)
				comma = ',';
			output(graphcanvas, `{"name": "${t.data.name}", "size": ${size}}` + comma);
		} else {
			output(graphcanvas, '{', true);
			output(graphcanvas, `"name": "${t.data.name}", "size":${size},`);
		}
	}, function (t) {
		output(graphcanvas, '"children": [', true);
	}, function (t, hasNextSibling) {
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
generators.set('sankey', sankey);
