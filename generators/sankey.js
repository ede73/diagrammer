// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators } from '../model/graphcanvas.js';
import { traverseEdges } from '../model/model.js';
import { TreeVertex, findVertex, traverseTree } from '../model/tree.js';
import { GraphVertex } from '../model/graphvertex.js';
import { debug, output } from '../model/support.js';
import { GraphConnectable } from '../model/graphconnectable.js';

/**
autovero>"10 taalaa"budjetti
tupakkavero>"8 taalaa"budjetti
kakkavero>"3 taalaa"budjetti
budjetti>"18 taalaa"sotaan
sossuun<"1 taala"budjetti

to
[
	{"autovero","budjetti",10},
	{"tupakkavero","budjetti",8},
	{"kakkavero","budjetti",3},
	{"budjetti","sotaan",18},
	{"budjetti","sossuun",1}
]

node js/diagrammer.js verbose sankey.test sankey
@param {GraphCanvas} graphcanvas
*/
export function sankey(graphcanvas) {
	/**
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

	output(graphcanvas, '[', true);

	let comma = '';
	/**
	 * For a dendrogram we're not interested in vertices
	 * just edges(for now!)
	 */
	traverseEdges(graphcanvas, function (edge) {
		const amount = getNumber(edge.getLabel())
		if (edge.isRightPointingEdge()) {
			output(graphcanvas, `${comma}["${edge.left.name}","${edge.right.name}",${amount}]`);
		} else {
			output(graphcanvas, `${comma}["${edge.right.name}","${edge.left.name}",${amount}]`);
		}
		comma = ',';
	});

	output(false);
	output(graphcanvas, ']');
}
generators.set('sankey', sankey);
