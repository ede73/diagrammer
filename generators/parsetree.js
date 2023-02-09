/**

Only one root supported?
[
    { key: 1, text: "Sentence", fill: "#f68c06", stroke: "#4d90fe" },
    { key: 2, text: "NP", fill: "#f68c06", stroke: "#4d90fe", parent: 1 },
    { key: 3, text: "DT", fill: "#ccc", stroke: "#4d90fe", parent: 2 },
    { key: 4, text: "A", fill: "#f8f8f8", stroke: "#4d90fe", parent: 3 },
    { key: 5, text: "JJ", fill: "#ccc", stroke: "#4d90fe", parent: 2 },
    { key: 6, text: "rare", fill: "#f8f8f8", stroke: "#4d90fe", parent: 5 },
    { key: 7, text: "JJ", fill: "#ccc", stroke: "#4d90fe", parent: 2 },
    { key: 8, text: "black", fill: "#f8f8f8", stroke: "#4d90fe", parent: 7 },
    { key: 9, text: "NN", fill: "#ccc", stroke: "#4d90fe", parent: 2 },
    { key: 10, text: "squirrel", fill: "#f8f8f8", stroke: "#4d90fe", parent: 9 },
    { key: 11, text: "VP", fill: "#f68c06", stroke: "#4d90fe", parent: 1 },
    { key: 12, text: "VBZ", fill: "#ccc", stroke: "#4d90fe", parent: 11 },
    { key: 13, text: "has", fill: "#f8f8f8", stroke: "#4d90fe", parent: 12 },
    { key: 14, text: "VP", fill: "#f68c06", stroke: "#4d90fe", parent: 11 },
    { key: 15, text: "VBN", fill: "#ccc", stroke: "#4d90fe", parent: 14 },
    { key: 16, text: "become", fill: "#f8f8f8", stroke: "#4d90fe", parent: 15 },
    { key: 17, text: "NP", fill: "#f68c06", stroke: "#4d90fe", parent: 14 },
    { key: 18, text: "NP", fill: "#f68c06", stroke: "#4d90fe", parent: 17 },
    { key: 19, text: "DT", fill: "#ccc", stroke: "#4d90fe", parent: 18 },
    { key: 20, text: "a", fill: "#f8f8f8", stroke: "#4d90fe", parent: 19 },
    { key: 21, text: "JJ", fill: "#ccc", stroke: "#4d90fe", parent: 18 },
    { key: 22, text: "regular", fill: "#f8f8f8", stroke: "#4d90fe", parent: 21 },
    { key: 23, text: "NN", fill: "#ccc", stroke: "#4d90fe", parent: 18 },
    { key: 24, text: "visitor", fill: "#f8f8f8", stroke: "#4d90fe", parent: 23 },
    { key: 25, text: "PP", fill: "#f68c06", stroke: "#4d90fe", parent: 17 },
    { key: 26, text: "TO", fill: "#ccc", stroke: "#4d90fe", parent: 25 },
    { key: 27, text: "to", fill: "#f8f8f8", stroke: "#4d90fe", parent: 26 },
    { key: 28, text: "NP", fill: "#f68c06", stroke: "#4d90fe", parent: 25 },
    { key: 29, text: "DT", fill: "#ccc", stroke: "#4d90fe", parent: 28 },
    { key: 30, text: "a", fill: "#f8f8f8", stroke: "#4d90fe", parent: 29 },
    { key: 31, text: "JJ", fill: "#ccc", stroke: "#4d90fe", parent: 28 },
    { key: 32, text: "suburban", fill: "#f8f8f8", stroke: "#4d90fe", parent: 31 },
    { key: 33, text: "NN", fill: "#ccc", stroke: "#4d90fe", parent: 28 },
    { key: 34, text: "garden", fill: "#f8f8f8", stroke: "#4d90fe", parent: 33 },
    { key: 35, text: ".", fill: "#ccc", stroke: "#4d90fe", parent: 1 },
    { key: 36, text: ".", fill: "#f8f8f8", stroke: "#4d90fe", parent: 35 }
]
@param {GraphMeta} graphmeta
*/
function parsetree(graphmeta) {
	const nodeList = [];
	function addEdgeedVertex(left, right) {
		if (!(left instanceof GraphVertex)) return;
		if (!(right instanceof GraphVertex)) return;
		const key=right.id;
		const parent=left.id;
		const text=(!right.label) ? right.name : right.label;
		nodeList.push({key: key, text: text, fill: "#f8f8f8", stroke: "#4d90fe", parent: parent});
	}

	//debug(JSON.stringify(graphmeta.EDGES));

	const root = graphmeta.GRAPHROOT.ROOTVERTICES;
	if (root.length > 1) {
		throw new Error('Only one root node supported');
	}

	(() => {
		root[0].id = 1;
		const text=(!root[0].label) ? root[0].name : root[0].label;
		nodeList.push({key: root[0].id, text: text, fill: "#f8f8f8", stroke: "#4d90fe"});
		let keyId = 2;
		graphmeta.GRAPHROOT.OBJECTS.forEach((node) => {
			if (!node.id) {
				node.id = keyId++;
			}
		});
	})();

	traverseEdges(graphmeta, edge => {
		debug('edge '+edge.left.name+' to '+edge.right.name);
		addEdgeedVertex(edge.left, edge.right);
	});
	//debug(JSON.stringify(nodeList));
	output(graphmeta, JSON.stringify(nodeList));
	output(false);
}
generators.set('parsetree', parsetree);