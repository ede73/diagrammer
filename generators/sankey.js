// WEB VISUALIZER ONLY -- DO NOT REMOVE - USE IN AUTOMATED TEST RECOGNITION
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
function sankey(graphcanvas) {
	let tree;
	function addVertex(left, right) {
		if (!tree) {
			tree = new TreeVertex(left);
		}
		if (!(left instanceof GraphVertex)) return;
		const cl = findVertex(tree, left);
		if (!cl) {
			throw new Error('Left node (' + left.name + ') not found from tree');
		}
		if (!findVertex(tree, right) && (right instanceof GraphVertex)) {
			debug('Add ' + right.name + ' as child of ' + cl.data.name + " co " + right.container);
			cl.CHILDREN.push(new TreeVertex(right));
		}
	}

	//debug(JSON.stringify(grpahmeta.EDGES));
	/**
	 * For a dendrogram we're not interested in vertices
	 * just edges(for now!)
	 */
	traverseEdges(graphcanvas, function (edge) {
		//debug('edge '+l.left.name+' to '+l.right.name);
		addVertex(edge.left, edge.right);
	});

	//output(graphcanvas,'{',true);
	traverseTree(tree, function (t, isLeaf, hasSibling) {
		if (isLeaf) {
			let comma = '';
			if (hasSibling)
				comma = ',';
			output(graphcanvas, '{"name": "' + t.data.name + '", "size": 1}' + comma);
		} else {
			output(graphcanvas, '{', true);
			output(graphcanvas, '"name": "' + t.data.name + '",');
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
