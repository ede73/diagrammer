/*

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

*/

function parsetree(yy) {
	var tree;
	function addNode(l, r) {
		if (tree === undefined) {
			tree = new TreeNode(l);
		}
		if (!(l instanceof Node)) return;
		var cl = findNode(tree, l);
		if (cl === undefined) {
			throw new Error('Left node (' + l.name + ') not found from tree');
		}
		if (undefined === findNode(tree, r) && (r instanceof Node)) {
			debug('Add ' + r.name + ' as child of ' + cl.data.name + " co " + r.container);
			cl.CHILDREN.push(new TreeNode(r));
		}
	}

	console.log(JSON.stringify(yy.LINKS));

	traverseLinks(yy, function (l) {
		debug('link node '+l.left.name+' to '+l.right.name);
		addNode(l.left, l.right);
	});

	traverseTree(tree, function (t, isLeaf, hasSibling) {
		if (isLeaf) {
			comma = '';
			if (hasSibling)
				comma = ',';
			output(yy, '{"name": "' + t.data.name + '", "size": 1}' + comma);
		} else {
			output(yy, '{', true);
			output(yy, '"name": "' + t.data.name + '",');
		}
	}, function (t) {
		output(yy, '"children": [', true);
	}, function (t, hasNextSibling) {
		output(false);
		output(yy, ']', false);
		if (hasNextSibling) {
			output(yy, '},');
		} else {
			output(yy, '}');
		}
	});
	output(false);
}
