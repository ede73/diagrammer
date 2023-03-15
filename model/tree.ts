// @ts-check
import { debug } from './debug.js'
import { type GraphConnectable } from './graphconnectable.js'
import { GraphContainer } from './graphcontainer.js'
import { type GraphCanvas } from './graphcanvas.js'
import { type GraphEdge, GraphEdgeDirectionType } from './graphedge.js'
import { type GraphObject } from './graphobject.js'
/**
 * Tree representration
 */
export class TreeVertex {
  CHILDREN: TreeVertex[] = []
  // Store edges, so we can get the edge properties between this tree root and its children
  EDGES: GraphEdge[] = []

  constructor(public data: GraphObject) { }

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
 * Traverse the tree, calling callbacks as iteration progresses.
 *
 * Traverses tree In-Order (*). Root of the subtree is processed first, then all of it's children, recursively. Each node is visited ONCE to avoid loops.
 * This restriction may also cause some problems.
 * For instance on a tree a>b>c>b only a,b,c are visited, in that order
 * A tree a>b>c>b>b like wise, only nodes a,b,c as visited. Alas for c we 'lie' saying it has siblings (which it indeed has ie. b), but "that instance" b is never visited, since it was already processed earlier
 *
 * Since callbacks are activated as traversal progresses, we cannot fix that siblingness issue. It was used as a convenience for the generator to get commas right in the list
 * Same problem could occur with !isLeaf (having children, but then not processing them)
 * (*) The AST of the whole graph is constructed as it occurs, nodes may precede edges, graph may contain multiple trees
 * and edges do not have to be in any particular order, than they can go in which ever ditection. Nodes can be actual nodes or backward references to them.
 * The AST is made to a tree by some rules unbeknownst to this function, so that may affect the processing
 *
 * To support cyclical trees, algorithm visits a vertex once!
 *
 * @param root
 * @param visitNode Called once for each tree node, hasSiblings is true if node has a sibling. NOTE! On cyclical graphs it is possible siblings WILL NOT be visited.
 * @param beginListingChildren Called once before beginning listing child nodes
 * @param finishedListingChildren Called once after listing the child nodes
 */
export function traverseTree(root: TreeVertex,
  visitNode: (node: TreeVertex, isLeaf: boolean, hasSiblings: boolean, nThNodeOnTheLevel: boolean, edge?: GraphEdge) => void,
  beginListingChildren: (node: TreeVertex) => void,
  finishedListingChildren: (node: TreeVertex, hasSiblings: boolean) => void) {
  const visited = new Set<TreeVertex>()
  const _traverseTree = (root: TreeVertex,
    visitNode: (node: TreeVertex, isLeaf: boolean, hasSiblings: boolean, nThNodeOnTheLevel: boolean, edge?: GraphEdge) => void,
    beginListingChildren: (node: TreeVertex) => void,
    finishedListingChildren: (node: TreeVertex, hasSiblings: boolean) => void,
    level: number = 0,
    hasSibling: boolean = false,
    parent?: TreeVertex) => {
    if (visited.has(root)) {
      debug(`Alas node ${root.data.getName()} already visited`)
      return
    }
    debug(`add visited (${root.data.getName()} / ${root.data.constructor.name})`)
    visited.add(root)
    if (level === 0) {
      debug(`VISITNODE(root has no siblings) ${root.data.getName()} / ${root.data.constructor.name}}`)
      visitNode(root, root.CHILDREN.length === 0, false, false)
    }
    if (root.CHILDREN.length > 0) {
      debug(`BEGINLISTINGCHILDREN ${root.data.getName()} / ${root.data.constructor.name}`, true)
      beginListingChildren(root)
    }

    // helps generator track need for commas statelessly
    let nThNodeOnTheLevel = false
    for (const [i, tn] of root.CHILDREN.entries()) {
      const isLeaf = tn.CHILDREN.length === 0
      // indicative, doesn't mean we'll VISIT the code (it might have already been visited on cyclical tree)
      const nodeHasSiblings = (i + 1) !== root.CHILDREN.length
      debug(`VISITNODE ${String(tn.data.name)}/${root.data.constructor.name} is leaf?${isLeaf ? 'yeah' : 'nope'} hasSiblings${nodeHasSiblings ? 'yeah' : 'nope'} i=${i + 1}/`, true)
      if (!visited.has(tn)) {
        visitNode(tn, isLeaf, nodeHasSiblings, nThNodeOnTheLevel, root.EDGES[i])
        nThNodeOnTheLevel = true
      }
      if (tn.CHILDREN.length > 0) {
        _traverseTree(tn,
          visitNode, beginListingChildren, finishedListingChildren,
          level + 1,
          nodeHasSiblings,
          root)
      }
      debug(false)
    }
    if (root.CHILDREN.length > 0) {
      debug(`FINISHEDLISTINGCHILDREN ${root.data.getName()}/${root.data.constructor.name}`, false)
      finishedListingChildren(root, hasSibling)
    }
  }
  debug(true)
  _traverseTree(root, visitNode, beginListingChildren, finishedListingChildren)
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
 *
 * Supports cyclical trees as well. Root detection has no vertex precedence, it must be clear root.
 * Tree a>b>a doesn't have a root (according to this algorithm, even though visually you could say "a" is the root)
 *
 * TODO: In ambiguous cases, add a order precedence to the tree, first vertex defined in the canvas will be the root. Fixes a>b>a
 * TODO: Utilize start node property, so in case of a>b>a what ever is said start node would be the root. Would also help if graph has multiple trees
 *
 * @param canvas
 * @param allowReferences if true, allows GraphReferences handled separately
 * @returns Return all the roots of the connected tree
 */
export function makeConnectedTree(canvas: GraphCanvas, allowReferences: boolean = false): TreeVertex[] {
  const trees: TreeVertex[] = []

  // make a new or find a TreeVertex that contains node
  function makeSubTree(node: GraphConnectable): TreeVertex {
    const nodeFound = trees.find((p) => p.data === node)
    if (nodeFound) {
      return nodeFound
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
        r.EDGES.push(edge)
      }
        break
      case GraphEdgeDirectionType.RIGHT: {
        const l = makeSubTree(edge.left)
        l.CHILDREN.push(makeSubTree(edge.right))
        l.EDGES.push(edge)
      }
        break
      case GraphEdgeDirectionType.BIDIRECTIONAL: {
        const r1 = makeSubTree(edge.left)
        r1.CHILDREN.push(makeSubTree(edge.right))
        r1.EDGES.push(edge)
        const r2 = makeSubTree(edge.right)
        r2.CHILDREN.push(makeSubTree(edge.left))
        r2.EDGES.push(edge)
      }
        break
      case GraphEdgeDirectionType.UNIDIRECTIONAL: {
        const r1 = makeSubTree(edge.left)
        r1.CHILDREN.push(makeSubTree(edge.right))
        r1.EDGES.push(edge)
        const r2 = makeSubTree(edge.right)
        r2.CHILDREN.push(makeSubTree(edge.left))
        r2.EDGES.push(edge)
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
