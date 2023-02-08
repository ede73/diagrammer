/**
a>b>c,d
a>e;link text
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

node js/parse.js verbose sankey.test sankey
@param {GraphMeta} graphmeta
*/
function sankey(graphmeta) {
	let tree;
	function addVertex(left, right) {
		if (!tree) {
			tree = new TreeVertex(left);
		}
		if (!(left instanceof Vertex)) return;
		const cl = findVertex(tree, left);
		if (!cl) {
			throw new Error('Left node (' + left.name + ') not found from tree');
		}
		if (!findVertex(tree, right) && (right instanceof Vertex)) {
			debug('Add ' + right.name + ' as child of ' + cl.data.name + " co " + right.container);
			cl.CHILDREN.push(new TreeVertex(right));
		}
	}

	//debug(JSON.stringify(grpahmeta.LINKS));
	/**
	 * For a dendrogram we're not interested in vertices
	 * just edges(for now!)
	 */
	traverseLinks(graphmeta, function (link) {
		//debug('link node '+l.left.name+' to '+l.right.name);
		addVertex(link.left, link.right);
	});

	//output(graphmeta,'{',true);
	traverseTree(tree, function (t, isLeaf, hasSibling) {
		if (isLeaf) {
			comma = '';
			if (hasSibling)
				comma = ',';
			output(graphmeta, '{"name": "' + t.data.name + '", "size": 1}' + comma);
		} else {
			output(graphmeta, '{', true);
			output(graphmeta, '"name": "' + t.data.name + '",');
		}
	}, function (t) {
		output(graphmeta, '"children": [', true);
	}, function (t, hasNextSibling) {
		output(false);
		output(graphmeta, ']', false);
		if (hasNextSibling) {
			output(graphmeta, '},');
		} else {
			output(graphmeta, '}');
		}
	});
	output(false);
}
generators.set('sankey', sankey);
