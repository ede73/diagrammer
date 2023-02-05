/*

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

*/

function generateLayerBands(yy) {
	//console.log(yy)
	const groups = {
		key: "_BANDS",
		category: "Bands",
		itemArray: [],
	};
	const linkedNodes = [
		groups,
	]
	const root = getGraphRoot(yy);

	traverseObjects(root, o => {
		if (o instanceof Group) {
			groups.itemArray.push({ text: o.name });
		}
	});

	traverseLinks(yy, l => {
		if (!l.left) {
			// probably our root
			//linkedNodes.push({key: l.right.name});
		}else{
			linkedNodes.push({key: l.right.name , parent: l.left.name});
		}
	});
	output(yy, JSON.stringify(linkedNodes));
}
