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
*/

function generateLayerBands(yy) {
	var nodeList = [];
	function addLinkedNode(left, right) {
		if (!(left instanceof Node)) return;
		if (!(right instanceof Node)) return;
		const key=right.id;
		const parent=left.id;
		const text=(right.label == undefined) ? right.name : right.label;
		nodeList.push({key: key, text: text, fill: "#f8f8f8", stroke: "#4d90fe", parent: parent});
	}

	//console.log(JSON.stringify(yy.LINKS));

	const root = getGraphRoot(yy).ROOTNODES;
	if (root.length > 1) {
		throw new Error('Only one root node supported');
	}

	(() => {
		root[0].id = 1;
		const text=(root[0].label == undefined) ? root[0].name : root[0].label;
		nodeList.push({key: root[0].id, text: text, fill: "#f8f8f8", stroke: "#4d90fe"});
		var keyId = 2;
		getGraphRoot(yy).OBJECTS.forEach((node) => {
			if (!getAttr(node, 'id')) {
				node.id = keyId++;
			}
		});
	})();

	//console.log(JSON.stringify(getGraphRoot(yy).OBJECTS));

	traverseLinks(yy, l => {
		debug('link node '+l.left.name+' to '+l.right.name);
		addLinkedNode(l.left, l.right);
	});
	//console.log(JSON.stringify(nodeList));
	output(yy, JSON.stringify(nodeList));
	output(false);
}
