function dendrogram(yy) {
    var tree;
    function addNode(l, r) {
	if (tree === undefined) {
	    tree = new TreeNode(l);
	}
	var cl = findNode(tree,l);
	if (cl===undefined){
	    throw new Error('Left node not found from tree');
	}
	if (undefined === findNode(tree,r)){
	    //debug('Add '+r.name+' as child of '+cl.data.name);
	    cl.CHILDREN.push(new TreeNode(r));
	}
    }

    //debug(JSON.stringify(yy.LINKS));
    /**
     * For a dendrogram we're not interested in nodes
     * just edges(for now!)
     */
    traverseLinks(yy, function(l) {
	//debug('link node '+l.left.name+' to '+l.right.name);
	addNode(l.left, l.right);
    });

    //output(yy,'{',true);
    traverseTree(tree,function (t, isLeaf, level) {
	if (isLeaf){
	    output(yy,'{"name": "'+t.data.name+'", "size": 1},');
	    //debug("Node at "+level+"="+t);
	}else{
	    output(yy,'{',true);
	    output(yy,'"name": "'+t.data.name+'",');
	    //debug("Node at "+level+"="+t);
	}
    },function(t){
	output(yy,'"children": [',true);
    },function(t, index, siblingAmount){
	var isLast = (index)==siblingAmount-1;
	//debug('index '+index+' amo '+(siblingAmount-1));
	output(false);
	output(yy,']',false);
	if (isLast || index===undefined){
	    output(yy,'}');
	}else{
	    output(yy,'},');
	}
    });
    output(false);
}
