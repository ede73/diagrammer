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
        return "Link(type:" + this.linkType + " as L:" +
            this.left.toString() + ", R:" +
            this.right.toString() + ",label=" +
            this.getLabel() + ")";
    };
}
