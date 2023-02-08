// @ts-check
/**
 * Represents an edge(link) between objects (vertices,groups,lists)
 */
class Edge extends GraphObject {
	/**
	 * 
 	 * @param {string} edgeType Type of the edge(grammar!)
 	 * @param {GraphObject} lhs Left hand side of the edge
	 * @param {GraphObject} rhs Right hand side of the edge
	 * @constuctor
	 */
	constructor(edgeType, lhs, rhs) {
		super(undefined); // TODO:
		/** @type {string} */
		this.edgeType = edgeType.trim();
		/** @type {GraphObject} */
		this.left = lhs;
		/** @type {GraphObject} */
		this.right = rhs;
		/** @type {string} */
		this.lcompass = undefined;
		/** @type {string} */
		this.rcompass = undefined;
		/** @type {string} */
		this.edgetextcolor = undefined;
		/** @type {string} */
		this.edgecolor = undefined;
		/** @type {GraphObject} */
		this.container = undefined;
	}

	isDotted() {
		return this.edgeType.indexOf(".") !== -1;
	}

	isDashed() {
		return this.edgeType.indexOf("-") !== -1;
	}

	isBroken() {
		return this.edgeType.indexOf("/") !== -1;
	}

	/**
	 * @returns True if edge has arrows on both sides
	 */
	isBidirectional() {
		return this.isLeftPointingEdge() && this.isRightPointingEdge();
	}

	/**
	 * @returns true if this edge is undirected (no arrows)
	 */
	isUndirected() {
		return !this.isLeftPointingEdge() && !this.isRightPointingEdge();
	}

	/**
	 * @returns true if edge points left. Notice! Edge can still be birectional!
	 */
	isLeftPointingEdge() {
		return this.edgeType.indexOf("<") !== -1;
	}

	/**
	 * @returns true if edge points right. Notice! Edge can still be birectional!
	 */
	isRightPointingEdge() {
		return this.edgeType.indexOf(">") !== -1;
	}

	toString() {
		let fmt = "";
		if (this.lcompass)
			fmt += ",lcompass: " + this.lcompass;
		if (this.rcompass)
			fmt += ",rcompass: " + this.rcompass;
		if (this.edgecolor)
			fmt += ",color: " + this.edgecolor;
		if (this.edgetextcolor)
			fmt += ",textcolor: " + this.edgetextcolor;
		return "Edge(type:" + this.edgeType + " as L:" +
			this.left.toString() + ", R:" +
			this.right.toString() + ",label=" +
			this.getLabel() + fmt + ")";
	}
};
