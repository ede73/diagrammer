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
		this.lcompass = undefined;
		this.rcompass = undefined;
		this.linktextcolor = undefined;
		this.container = undefined;
	}

	isDotted() {
		return this.linkType.indexOf(".") !== -1;
	}

	isDashed() {
		return this.linkType.indexOf("-") !== -1;
	}

	isBroken() {
		return this.linkType.indexOf("/") !== -1;
	}

	/**
	 * @returns True if link has arrows on both sides
	 */
	isBidirectional() {
		return this.isLeftLink() && this.isRightLink();
	}

	/**
	 * @returns true if this link is undirected (no arrows)
	 */
	isUndirected() {
		return !this.isLeftLink() && !this.isRightLink();
	}

	/**
	 * @returns true if link points left. Notice! Link can still be birectional!
	 */
	isLeftLink() {
		return this.linkType.indexOf("<") !== -1;
	}

	/**
	 * @returns true if link points right. Notice! Link can still be birectional!
	 */
	isRightLink() {
		return this.linkType.indexOf(">") !== -1;
	}

	toString() {
		let fmt = "";
		if (this.lcompass)
			fmt += ",lcompass: " + this.lcompass;
		if (this.rcompass)
			fmt += ",rcompass: " + this.rcompass;
		if (this.linkcolor)
			fmt += ",color: " + this.linkcolor;
		if (this.linktextcolor)
			fmt += ",textcolor: " + this.linktextcolor;
		return "Link(type:" + this.linkType + " as L:" +
			this.left.toString() + ", R:" +
			this.right.toString() + ",label=" +
			this.getLabel() + fmt + ")";
	}
};
