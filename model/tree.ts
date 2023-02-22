import { debug } from '../model/support.js'
/**
 * Tree representration
 */
export class TreeVertex {
  CHILDREN: TreeVertex[] = []
  data: any
  constructor(data: any) {
    this.data = data
  }

  toString() {
    return `tree(${this.data},children=[${JSON.stringify(this.data)}])`
  }
};

/**
 * Find a tree vertex from a tree if one exists
 * (with matching data)
 *
 * @param findData What ever data the tree vertex might have
 */
export function findVertex(tree: TreeVertex, findData: any): TreeVertex | undefined {
  if (tree.data === findData) {
    return tree
  }
  for (const i in tree.CHILDREN) {
    if (!Object.prototype.hasOwnProperty.call(tree.CHILDREN, i)) continue
    const tn = tree.CHILDREN[i]
    if (tn.data === findData) {
      return tn
    }
    if (tn.CHILDREN.length > 0) {
      const tmp = findVertex(tn, findData)
      if (tmp) {
        return tmp
      }
    }
  }
  return undefined
}

/**
 * Traverse the tree, calling callbacks as iteration progresses
 *
 * @param root
 * @param callback Called for each vertex, boolean is this is leaf (no children) and boolean if this vertex has siblings (same level)
 * @param exit the TreeVertex, boolean value if this vertex has siblings (same level)
 * @param level Just used internally, omit
 * @param hasSibling Just used internally, omit
 * @param parent Just used internally, omit
 */
export function traverseTree(root: TreeVertex,
  callback: (node: TreeVertex, isLeaf: boolean, hasSiblings: boolean) => void,
  enter: (node: TreeVertex) => void,
  exit: (node: TreeVertex, hasSiblings: boolean) => void,
  level?: number,
  hasSibling?: boolean,
  parent?: TreeVertex) {
  if (!level) level = 0
  if (!hasSibling) hasSibling = false
  if (level === 0) {
    callback(root, root.CHILDREN.length === 0, false)
  }
  if (root.CHILDREN.length > 0) {
    enter(root)
  }
  for (const i in root.CHILDREN) {
    if (!Object.prototype.hasOwnProperty.call(root.CHILDREN, i)) continue
    const tn = root.CHILDREN[i]
    const isLeaf = tn.CHILDREN.length === 0
    const hasVertexSiblings = (parseInt(i) + 1) !== root.CHILDREN.length
    debug(`vertex ${tn.data.name} is leaf?${isLeaf} hasSiblings${hasVertexSiblings} i=${parseInt(i) + 1}/`)
    callback(tn, isLeaf, hasVertexSiblings)
    if (tn.CHILDREN.length > 0) {
      traverseTree(tn,
        callback, enter, exit,
        level + 1,
        hasVertexSiblings,
        root)
    }
  }
  if (root.CHILDREN.length > 0) {
    debug(`${root.data.name}has sibling`)
    exit(root, hasSibling)
  }
}
