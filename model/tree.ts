// @ts-check
import { debug } from './debug.js'

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
export function findVertex(subTree: TreeVertex, findData: any): TreeVertex | undefined {
  if (subTree.data === findData) {
    return subTree
  }
  for (const treeNode of subTree.CHILDREN) {
    if (treeNode.data === findData) {
      return treeNode
    }
    if (treeNode.CHILDREN.length > 0) {
      const tmp = findVertex(treeNode, findData)
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
  for (const [i, tn] of root.CHILDREN.entries()) {
    const isLeaf = tn.CHILDREN.length === 0
    const hasVertexSiblings = (i + 1) !== root.CHILDREN.length
    debug(`vertex ${tn.data.name} is leaf?${isLeaf} hasSiblings${hasVertexSiblings} i=${i + 1}/`)
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
