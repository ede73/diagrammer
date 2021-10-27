/*
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

node parse.js verbose parsetree.test sankey
*/
function sankey(yy) {
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

	//debug(JSON.stringify(yy.LINKS));
	/**
	 * For a dendrogram we're not interested in nodes
	 * just edges(for now!)
	 */
	traverseLinks(yy, function (l) {
		//debug('link node '+l.left.name+' to '+l.right.name);
		addNode(l.left, l.right);
	});

	//output(yy,'{',true);
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
