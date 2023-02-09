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

node js/diagrammer.js verbose dendrogram.test dendrogram
@param {GraphCanvas} graphcanvas
*/
function dendrogram(graphcanvas) {
	let tree;
	/**
	 * @param {GraphObject} lhs
	 * @param {GraphObject} rhs
	 */
	function addVertex(lhs, rhs) {
		if (!tree) {
			tree = new TreeVertex(lhs);
		}
		if (!(lhs instanceof GraphVertex)) return;
		const cl = findVertex(tree, lhs);
		if (!cl) {
			throw new Error('Left node (' + lhs.name + ') not found from tree');
		}
		if (!findVertex(tree, rhs) && (rhs instanceof GraphVertex)) {
			debug('Add ' + rhs.name + ' as child of ' + cl.data.name + " co " + rhs.container);
			cl.CHILDREN.push(new TreeVertex(rhs));
		}
	}

	//debug(JSON.stringify(graphcanvas.EDGES));
	/**
	 * For a dendrogram we're not interested in vertices
	 * just edges(for now!)
	 */
	traverseEdges(graphcanvas, edge => {
		//debug('edge '+l.left.name+' to '+l.right.name);
		addVertex(edge.left, edge.right);
	});

	//output(graphcanvas,'{',true);
	traverseTree(tree, (t, isLeaf, hasSibling) => {
		if (isLeaf) {
			let comma = '';
			if (hasSibling)
				comma = ',';
			output(graphcanvas, '{"name": "' + t.data.name + '", "size": 1}' + comma);
		} else {
			output(graphcanvas, '{', true);
			output(graphcanvas, '"name": "' + t.data.name + '",');
		}
	}, (t) => {
		output(graphcanvas, '"children": [', true);
	}, (t, hasNextSibling) => {
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
generators.set('dendrogram', dendrogram);
visualizations.set('dendrogram', ['radialdendrogram', 'circlepacked', 'reingoldtilford']);
