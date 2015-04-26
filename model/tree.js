TreeNode.prototype.constructor = TreeNode
/**
 * Create a new tree node with data
 * @constructor
 */
function TreeNode(data) {
    this.CHILDREN = [];
    this.data = data;
    this.toString = function () {
        return "tree("+
	    data+
	    ",children=["+
	    JSON.stringify(this.data)+
	    "])";
    };
}

/**
 * Find a tree node from a tree if one exists
 * (with matching data)
 */
function findNode(tree, findData) {
    if(tree.data === findData){
	return tree;
    }
    for(var i in tree.CHILDREN){
	if (!tree.CHILDREN.hasOwnProperty(i)) continue;
	var tn = tree.CHILDREN[i];
	if(tn.data === findData){
	    return tn;
	}
	if (tn.CHILDREN.length>0){
	    var tmp = findNode(tn, findData);
	    if (tmp !== undefined) {
		return tmp;
	    }
	}
    }
    return undefined;
}

function traverseTree(root, callback, enter, exit, level, index, siblingAmount) {
    //debug('process node '+root.data.name + ' childmount'+siblingAmount);
    if (level===undefined) level=0;
    if (level===0) {
	callback(root, root.CHILDREN.length===0, level);
    }
    if (root.CHILDREN.length>0) {
	enter(root);
    }
    for(var i in root.CHILDREN){
	if (!root.CHILDREN.hasOwnProperty(i)) continue;
	var tn = root.CHILDREN[i];
	callback(tn, tn.CHILDREN.length===0, level+1);
	if (tn.CHILDREN.length>0){
	    traverseTree(tn, callback, enter, exit, level+1, i, tn.CHILDREN.length);
	}
    }
    if (root.CHILDREN.length>0) {
	exit(root, index, siblingAmount);
    }
}
