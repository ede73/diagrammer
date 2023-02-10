// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators } from '../model/graphcanvas.js';
import { traverseEdges, traverseVertices } from '../model/model.js';
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
{
	"nodes":[{"name":"xxx"},{}...],
	"links":[{"source":0,"target":1,"value":123},{}]
}
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

	output(graphcanvas, '{', true);

	let comma = '';

	output(graphcanvas, `"nodes":[`, true);
	const vertexIndexes = new Map();
	let index = 0;
	traverseVertices(graphcanvas, vertex => {
		const name = vertex.getName();
		vertexIndexes.set(name, index++);
		output(graphcanvas, `${comma}{"name":"${name}"}`);
		comma = ',';
	});
	output(graphcanvas, '],', false);

	output(graphcanvas, `"links":[`, true);
	comma = '';
	/**
	 * For a dendrogram we're not interested in vertices
	 * just edges(for now!)
	 */
	traverseEdges(graphcanvas, edge => {
		const amount = getNumber(edge.getLabel());
		const left = vertexIndexes.get(edge.left.name);
		const right = vertexIndexes.get(edge.right.name);
		if (edge.isRightPointingEdge()) {
			output(graphcanvas, `${comma}{"source":${left},"target":${right},"value":${amount}}`);
		} else {
			output(graphcanvas, `${comma}{"source":${right},"target":${left},"value":${amount}}`);
		}
		comma = ',';
	});
	output(false);
	output(graphcanvas, ']');
	output(false);
	output(graphcanvas, '}');
}
generators.set('sankey', sankey);
