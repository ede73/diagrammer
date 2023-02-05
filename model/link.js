/**
 * Create a new link between objects (nodes,groups,lists)
 *
 * @param linkType Type of the link(grammar!)
 * @param l Left hand side of the link
 * @param r Right hand side of the link
 * @constructor
 */
class Link extends GraphObject {
	constructor(linkType, l, r) {
		super();
		this.linkType = linkType.trim();
		this.left = l;
		this.right = r;
	}
	toString() {
		var fmt = "";
		var tmp = getAttrFmt(this, 'lcompass', '');
		if (tmp !== undefined && tmp != '')
			fmt += ",lcompass: " + tmp;
		tmp = getAttrFmt(this, 'rcompass', '');
		if (tmp !== undefined && tmp != '')
			fmt += ",rcompass: " + tmp;
		tmp = getAttrFmt(this, 'linkcolor', '');
		if (tmp !== undefined && tmp != '')
			fmt += ",color: " + tmp;
		tmp = getAttrFmt(this, 'linktextcolor', '');
		if (tmp !== undefined && tmp != '')
			fmt += ",textcolor: " + tmp;
		return "Link(type:" + this.linkType + " as L:" +
			this.left.toString() + ", R:" +
			this.right.toString() + ",label=" +
			this.getLabel() + fmt + ")";
	}
};
