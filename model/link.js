// @ts-check
/**
 * Represents an link (edge) between objects (vertices,groups,lists)
 */
class Link extends GraphObject {
	/**
	 * 
 	 * @param {string} linkType Type of the link(grammar!)
 	 * @param {GraphObject} lhs Left hand side of the link
	 * @param {GraphObject} rhs Right hand side of the link
	 * @constuctor
	 */
	constructor(linkType, lhs, rhs) {
		super(undefined); // TODO:
		/** @type {string} */
		this.linkType = linkType.trim();
		/** @type {GraphObject} */
		this.left = lhs;
		/** @type {GraphObject} */
		this.right = rhs;
		/** @type {string} */
		this.lcompass = undefined;
		/** @type {string} */
		this.rcompass = undefined;
		/** @type {string} */
		this.linktextcolor = undefined;
		/** @type {string} */
		this.linkcolor = undefined;
		/** @type {GraphObject} */
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
