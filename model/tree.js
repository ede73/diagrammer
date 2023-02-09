import { debug } from "../model/support.js";
/**
 * Tree representration
 */
export class TreeVertex {
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
 * Find a tree vertex from a tree if one exists
 * (with matching data)
 * 
 * @param {TreeVertex} tree
 * @param {any} findData What ever data the tree vertex might have
 * @return {TreeVertex}
 */
export function findVertex(tree, findData) {
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
			const tmp = findVertex(tn, findData);
			if (tmp) {
				return tmp;
			}
		}
	}
	return undefined;
}

/**
 * Traverse the tree, calling callbacks as iteration progresses
 * 
 * @param {TreeVertex} root 
 * @param {function(TreeVertex,boolean,boolean)} callback Called for each vertex, boolean is this is leaf (no children) and boolean if this vertex has siblings (same level)
 * @param {function(TreeVertex):void} enter 
 * @param {function(TreeVertex,boolean):void} exit the TreeVertex, boolean value if this vertex has siblings (same level)
 * @param {int} level Just used internally, omit
 * @param {boolean} hasSibling Just used internally, omit
 * @param {TreeVertex} parent Just used internally, omit
 */
export function traverseTree(root, callback, enter, exit, level = undefined, hasSibling = undefined, parent = undefined) {
	//debug('process vertex '+root.data.name + ' childmount'+siblingAmount);
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
		const hasVertexSiblings = (parseInt(i) + 1) !== root.CHILDREN.length;
		debug('vertex ' + tn.data.name + ' is leaf?' + isLeaf + " hasSiblings" + hasVertexSiblings + " i=" + (parseInt(i) + 1) + "/");
		callback(tn, isLeaf, hasVertexSiblings);
		if (tn.CHILDREN.length > 0) {
			traverseTree(tn,
				callback, enter, exit,
				level + 1,
				hasVertexSiblings,
				root);
		}
	}
	if (root.CHILDREN.length > 0) {
		debug(root.data.name += "has sibling");
		exit(root, hasSibling);
	}
}
