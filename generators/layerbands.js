// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
// requires export (Typescript, not ES6 compatible not does node.js support it..)
//import {GraphCanvas} from '../model/graphcanvas.js';
/**

Only one root supported?
{ // this is the information needed for the headers of the bands
		  key: "_BANDS",
		  category: "Bands",
		  itemArray: [
			{ text: "Zero" },
			{ text: "One" },
			{ text: "Two" },
			{ text: "Three" },
			{ text: "Four" },
			{ text: "Five" }
		  ]
		},
		// these are the regular nodes in the TreeModel
		{ key: "root" },
		{ key: "oneB", parent: "root" },
		{ key: "twoA", parent: "oneB" },
		{ key: "twoC", parent: "root" },
		{ key: "threeC", parent: "twoC" },
		{ key: "threeD", parent: "twoC" },
		{ key: "fourB", parent: "threeD" },
		{ key: "fourC", parent: "twoC" },
		{ key: "fourD", parent: "fourB" },
		{ key: "twoD", parent: "root" }
	  ];
	  node js/diagrammer.js verbose manual_test_diagrams/layerbands.d layerbands
@param {GraphCanvas} graphcanvas
*/
function generateLayerBands(graphcanvas) {
	//debug(graphcanvas)
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
		}else{
			linkedVertices.push({key: edge.right.name , parent: edge.left.name});
		}
	});
	output(graphcanvas, JSON.stringify(linkedVertices));
}
generators.set('layerbands', generateLayerBands);