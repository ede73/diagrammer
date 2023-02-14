// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
import { generators } from '../model/graphcanvas.js';
import { GraphGroup } from '../model/graphgroup.js';
import { traverseEdges, traverseVertices } from '../model/model.js';
import { output } from '../model/support.js';

/**
 * To test: node js/diagrammer.js verbose tests/test_inputs/layerbands.txt layerbands
 * @param {GraphCanvas} graphcanvas
*/
export function layerbands(graphcanvas) {
	const groups = {
		key: "_BANDS",
		category: "Bands",
		itemArray: [],
	};
	const linkedVertices = [
		groups,
	]

	traverseVertices(graphcanvas, obj => {
		if (obj instanceof GraphGroup) {
			groups.itemArray.push({ text: obj.name });
		}
	});

	traverseEdges(graphcanvas, edge => {
		if (!edge.left) {
			// probably our root
			//linkedVertexs.push({key: l.right.name});
		} else {
			linkedVertices.push({ key: edge.right.name, parent: edge.left.name });
		}
	});
	output(graphcanvas, JSON.stringify(linkedVertices));
}
generators.set('layerbands', layerbands);