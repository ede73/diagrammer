import { debug } from '../model/support.js';
export class TreeVertex {
    constructor(data) {
        this.CHILDREN = [];
        this.data = data;
    }
    toString() {
        return `tree(${this.data},children=[${JSON.stringify(this.data)}])`;
    }
}
;
export function findVertex(tree, findData) {
    if (tree.data === findData) {
        return tree;
    }
    for (const i in tree.CHILDREN) {
        if (!Object.prototype.hasOwnProperty.call(tree.CHILDREN, i))
            continue;
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
export function traverseTree(root, callback, enter, exit, level = undefined, hasSibling = undefined, parent = undefined) {
    if (!level)
        level = 0;
    if (!hasSibling)
        hasSibling = false;
    if (level === 0) {
        callback(root, root.CHILDREN.length === 0, false);
    }
    if (root.CHILDREN.length > 0) {
        enter(root);
    }
    for (const i in root.CHILDREN) {
        if (!Object.prototype.hasOwnProperty.call(root.CHILDREN, i))
            continue;
        const tn = root.CHILDREN[i];
        const isLeaf = tn.CHILDREN.length === 0;
        const hasVertexSiblings = (parseInt(i) + 1) !== root.CHILDREN.length;
        debug(`vertex ${tn.data.name} is leaf?${isLeaf} hasSiblings${hasVertexSiblings} i=${parseInt(i) + 1}/`);
        callback(tn, isLeaf, hasVertexSiblings);
        if (tn.CHILDREN.length > 0) {
            traverseTree(tn, callback, enter, exit, level + 1, hasVertexSiblings, root);
        }
    }
    if (root.CHILDREN.length > 0) {
        debug(`${root.data.name}has sibling`);
        exit(root, hasSibling);
    }
}
