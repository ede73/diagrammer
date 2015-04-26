Link.prototype = new GraphObject();
Link.prototype.constructor = Link;

/**
 * Create a new link between objects (nodes,groups,lists)
 *
 * @param linkType Type of the link(grammar!)
 * @param l Left hand side of the link
 * @param r Right hand side of the link
 * @constructor
 */
function Link(linkType, l, r) {
    this.linkType = linkType.trim();
    this.left = l;
    this.right = r;
    this.toString = function () {
	var fmt=""; 
	var tmp = getAttrFmt(this, 'lcompass','');
	if (tmp !== undefined && tmp != '')
	    fmt += ",lcompass: " + tmp;
	tmp = getAttrFmt(this, 'rcompass','');
	if (tmp !== undefined && tmp != '')
	    fmt += ",rcompass: " + tmp;
	tmp = getAttrFmt(this, 'linkcolor','');
	if (tmp !== undefined && tmp != '')
	    fmt += ",color: " + tmp;
	tmp = getAttrFmt(this, 'linktextcolor','');
	if (tmp !== undefined && tmp != '')
	    fmt += ",textcolor: " + tmp;
        return "Link(type:" + this.linkType + " as L:" +
            this.left.toString() + ", R:" +
            this.right.toString() + ",label=" +
            this.getLabel() + fmt + ")";
    };
}
