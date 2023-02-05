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

node js/parse.js verbose sankey.test sankey
*/
function sankey(yy) {
	let tree;
	function addNode(left, right) {
		if (!tree) {
			tree = new TreeNode(left);
		}
		if (!(left instanceof Node)) return;
		const cl = findNode(tree, left);
		if (!cl) {
			throw new Error('Left node (' + left.name + ') not found from tree');
		}
		if (!findNode(tree, right) && (right instanceof Node)) {
			debug('Add ' + right.name + ' as child of ' + cl.data.name + " co " + right.container);
			cl.CHILDREN.push(new TreeNode(right));
		}
	}

	//debug(JSON.stringify(yy.LINKS));
	/**
	 * For a dendrogram we're not interested in nodes
	 * just edges(for now!)
	 */
	traverseLinks(yy, function (link) {
		//debug('link node '+l.left.name+' to '+l.right.name);
		addNode(link.left, link.right);
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
