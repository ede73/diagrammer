/**
 * Create a new tree node with data
 * @constructor
 */
class TreeNode {
	constructor(data) {
		this.CHILDREN = [];
		this.data = data;
	}
	toString() {
		return "tree(" +
			data +
			",children=[" +
			JSON.stringify(this.data) +
			"])";
	}
};

/**
 * Find a tree node from a tree if one exists
 * (with matching data)
 */
function findNode(tree, findData) {
	if (tree.data === findData) {
		return tree;
	}
	for (const i in tree.CHILDREN) {
		if (!tree.CHILDREN.hasOwnProperty(i)) continue;
		const tn = tree.CHILDREN[i];
		if (tn.data === findData) {
			return tn;
		}
		if (tn.CHILDREN.length > 0) {
			const tmp = findNode(tn, findData);
			if (tmp) {
				return tmp;
			}
		}
	}
	return undefined;
}

function traverseTree(root, callback, enter, exit, level, hasSibling, parent) {
	//debug('process node '+root.data.name + ' childmount'+siblingAmount);
	if (!level) level = 0;
	if (!hasSibling) hasSibling = false;
	if (level === 0) {
		callback(root, root.CHILDREN.length === 0, false);
	}
	if (root.CHILDREN.length > 0) {
		enter(root);
	}
	for (var i in root.CHILDREN) {
		if (!root.CHILDREN.hasOwnProperty(i)) continue;
		const tn = root.CHILDREN[i];
		const isLeaf = tn.CHILDREN.length === 0;
		const hasNodeSiblings = (parseInt(i) + 1) !== root.CHILDREN.length;
		debug('node ' + tn.data.name + ' is leaf?' + isLeaf + " hasSiblings" + hasNodeSiblings + " i=" + (parseInt(i) + 1) + "/");
		callback(tn, isLeaf, hasNodeSiblings);
		if (tn.CHILDREN.length > 0) {
			traverseTree(tn,
				callback, enter, exit,
				level + 1,
				hasNodeSiblings,
				root);
		}
	}
	if (root.CHILDREN.length > 0) {
		debug(root.data.name += "has sibling");
		exit(root, hasSibling);
	}
}
