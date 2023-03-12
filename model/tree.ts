// @ts-check
import { debug } from './debug.js'
import { type GraphConnectable } from './graphconnectable.js'
import { GraphContainer } from './graphcontainer.js'
import { type GraphCanvas } from './graphcanvas.js'
import { GraphEdgeDirectionType } from './graphedge.js'
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
    return `tree(${this.data.getName()}, children=[${this.CHILDREN.map(c => c.data.getName()).join(', ')}])`
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
    debug(`vertex ${String(tn.data.name)} is leaf?${isLeaf ? 'yeah' : 'nope'} hasSiblings${hasVertexSiblings ? 'yeah' : 'nope'} i=${i + 1}/`)
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
    debug(`${String(root.data.name)}has sibling`)
    exit(root, hasSibling)
  }
}

/**
 * Convert graph canvas to a tree. Does not consider edges
 *
 * TODO:  This makes things odd z>(q)>(a b c) will link q to a, b and c, but in model this is GraphInner that holds a,b,c,
 * so we should fade that a way. Compatible way to present this would be z>q>(a b c), but BOTH should be accepted and produce same results
 *
 * @param canvas
 */
export function makeEdgeslessTree(node: GraphConnectable, allowReferences: boolean = false): TreeVertex {
  if (node instanceof GraphContainer) {
    // go thru all the nodes
    const subTree = new TreeVertex(node)
    subTree.CHILDREN = node.getObjects(allowReferences).map((node) => makeEdgeslessTree(node, allowReferences))
    return subTree
  } else {
    // add to tree and return
    return new TreeVertex(node)
  }
}

/**
 * Construct a connected tree from edges. Alas this MAY result to tree having multiple roots.
 *
 * A TreeVertex represents a subtree, and all of its children are connected subtrees
 *
 * Currently collects all directional or non-directional edges. Left/Right make perfect one way directions
 * Bidirectional will be pointing back and forth and so will unidirectional
 * @param canvas
 * @param allowReferences if true, allows GraphReferences handled separately
 * @returns Return all the roots of the connected tree. Notice! Does not support cyclical trees
 */
export function makeConnectedTree(canvas: GraphCanvas, allowReferences: boolean = false): TreeVertex[] {
  const trees: TreeVertex[] = []

  // make a new or find a TreeVertex that contains node
  function makeSubTree(node: GraphConnectable): TreeVertex {
    const found = trees.find((p) => p.data === node)
    if (found) {
      return found
    }
    const newVertex = new TreeVertex(node)
    trees.push((newVertex))
    return newVertex
  }

  canvas.getEdges().forEach(edge => {
    // we've now an edge from node to node, alas it may be ANY node in the tree, but it DOES produce a subtree
    switch (edge.direction()) {
      case GraphEdgeDirectionType.LEFT: {
        const r = makeSubTree(edge.right)
        r.CHILDREN.push(makeSubTree(edge.left))
      }
        break
      case GraphEdgeDirectionType.RIGHT: {
        const r = makeSubTree(edge.left)
        r.CHILDREN.push(makeSubTree(edge.right))
      }
        break
      case GraphEdgeDirectionType.BIDIRECTIONAL: {
        const r1 = makeSubTree(edge.left)
        r1.CHILDREN.push(makeSubTree(edge.right))
        const r2 = makeSubTree(edge.right)
        r2.CHILDREN.push(makeSubTree(edge.left))
      }
        break
      case GraphEdgeDirectionType.UNIDIRECTIONAL: {
        const r1 = makeSubTree(edge.left)
        r1.CHILDREN.push(makeSubTree(edge.right))
        const r2 = makeSubTree(edge.right)
        r2.CHILDREN.push(makeSubTree(edge.left))
      }
        break
    }
  })

  // since we process the EDGEs, there are no TreeVertices that have no children
  // Simple way is to remove all TreeVertex's that are someone's children, that leaves root
  // (if uni-directed non-cyclical tree)
  const isSomeonesChild = (vertex: TreeVertex) => {
    return trees.some(p => p.CHILDREN.includes(vertex))
  }

  const roots = trees.filter(n => !isSomeonesChild(n))
  return roots
}
