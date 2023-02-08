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

node js/parse.js verbose dendrogram.test dendrogram
@param {GraphMeta} graphmeta
*/
function dendrogram(graphmeta) {
	let tree;
    /**
     * @param {GraphObject} lhs
     * @param {GraphObject} rhs
     */
	function addNode(lhs, rhs) {
		if (!tree) {
			tree = new TreeNode(lhs);
		}
		if (!(lhs instanceof Node)) return;
		const cl = findNode(tree, lhs);
		if (!cl) {
			throw new Error('Left node (' + lhs.name + ') not found from tree');
		}
		if (!findNode(tree, rhs) && (rhs instanceof Node)) {
			debug('Add ' + rhs.name + ' as child of ' + cl.data.name + " co " + rhs.container);
			cl.CHILDREN.push(new TreeNode(rhs));
		}
	}

	//debug(JSON.stringify(graphmeta.LINKS));
	/**
	 * For a dendrogram we're not interested in nodes
	 * just edges(for now!)
	 */
	traverseLinks(graphmeta, link => {
		//debug('link node '+l.left.name+' to '+l.right.name);
		addNode(link.left, link.right);
	});

	//output(graphmeta,'{',true);
	traverseTree(tree, (t, isLeaf, hasSibling) => {
		if (isLeaf) {
			comma = '';
			if (hasSibling)
				comma = ',';
			output(graphmeta, '{"name": "' + t.data.name + '", "size": 1}' + comma);
		} else {
			output(graphmeta, '{', true);
			output(graphmeta, '"name": "' + t.data.name + '",');
		}
	}, (t)=> {
		output(graphmeta, '"children": [', true);
	},  (t, hasNextSibling)=> {
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
generators.set('dendrogram', dendrogram);