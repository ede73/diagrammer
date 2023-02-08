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

node js/parse.js verbose dendrogram.test dendrogram
@param {GraphMeta} graphmeta
*/
function dendrogram(graphmeta) {
	let tree;
	/**
	 * @param {GraphObject} lhs
	 * @param {GraphObject} rhs
	 */
	function addVertex(lhs, rhs) {
		if (!tree) {
			tree = new TreeVertex(lhs);
		}
		if (!(lhs instanceof Vertex)) return;
		const cl = findVertex(tree, lhs);
		if (!cl) {
			throw new Error('Left node (' + lhs.name + ') not found from tree');
		}
		if (!findVertex(tree, rhs) && (rhs instanceof Vertex)) {
			debug('Add ' + rhs.name + ' as child of ' + cl.data.name + " co " + rhs.container);
			cl.CHILDREN.push(new TreeVertex(rhs));
		}
	}

	//debug(JSON.stringify(graphmeta.EDGES));
	/**
	 * For a dendrogram we're not interested in vertices
	 * just edges(for now!)
	 */
	traverseEdges(graphmeta, edge => {
		//debug('edge '+l.left.name+' to '+l.right.name);
		addVertex(edge.left, edge.right);
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
	}, (t) => {
		output(graphmeta, '"children": [', true);
	}, (t, hasNextSibling) => {
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
visualizations.set('dendrogram', ['radialdendrogram', 'circlepacked', 'reingoldtilford']);
