// requires export (Typescript, not ES6 compatible not does node.js support it..)
//import {GraphMeta} from '../model/graphmeta.js';
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
	  node js/parse.js verbose manual_test_diagrams/layerbands.d layerbands
@param {GraphMeta} graphmeta
*/
function generateLayerBands(graphmeta) {
	//console.log(graphmeta)
	const groups = {
		key: "_BANDS",
		category: "Bands",
		itemArray: [],
	};
	const linkedVertices = [
		groups,
	]
	const root = graphmeta.GRAPHROOT;

	traverseVertices(root, obj => {
		if (obj instanceof Group) {
			groups.itemArray.push({ text: obj.name });
		}
	});

	traverseEdges(graphmeta, edge => {
		if (!edge.left) {
			// probably our root
			//linkedVertexs.push({key: l.right.name});
		}else{
			linkedVertices.push({key: edge.right.name , parent: edge.left.name});
		}
	});
	output(graphmeta, JSON.stringify(linkedVertices));
}
generators.set('layerbands', generateLayerBands);