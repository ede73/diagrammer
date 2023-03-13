import { GraphCanvas } from '../../model/graphcanvas.js'
import { GraphEdge } from '../../model/graphedge.js'
import { GraphVertex } from '../../model/graphvertex.js'
import { dendrogram } from '../../generators/dendrogram.js'
import { makeConnectedTree, type TreeVertex, traverseTree } from '../../model/tree.js'

const findNode = (name: string, canvas: GraphCanvas): GraphVertex | undefined => {
  return canvas.getObjects().find(p => p.getName() === name)
}

const addConnectedNodePair = (left: string, right: string, canvas: GraphCanvas): GraphCanvas => {
  // Notice, doesnt find node from (sub)containers
  const l = findNode(left, canvas) ?? new GraphVertex(left, canvas)
  const r = findNode(right, canvas) ?? new GraphVertex(right, canvas)
  const eLR = new GraphEdge('>', canvas, l, r)
  canvas.addObject(l)
  canvas.addObject(r)
  canvas.addEdge(eLR)
  return canvas
}

const simpleCyclicalTree = () => {
  const canvas = new GraphCanvas()
  addConnectedNodePair('a', 'b', canvas)
  addConnectedNodePair('b', 'c', canvas)
  addConnectedNodePair('c', 'b', canvas)
  return canvas
}

const simpleTwoRootTree = () => {
  const canvas = new GraphCanvas()
  addConnectedNodePair('root1', 'child1', canvas)
  addConnectedNodePair('root2', 'child2', canvas)
  return canvas
}

const childList = (subTree: TreeVertex): string => {
  return subTree.CHILDREN.map((c) => c.data.getName()).join(',')
}

const describeEdge = (edge: GraphEdge) => {
  return [edge.left.getName(), edge.edgeType, edge.right.getName()]
}

const edgeList = (subTree: TreeVertex): string => {
  return subTree.EDGES.map((e) => describeEdge(e)).join(',')
}

it('Ensure making cyclical tree succeeds', async () => {
  // make a graph a>b>c>b

  // first of all - making the tree must succeed
  const tree = makeConnectedTree(simpleCyclicalTree())

  // This tree has 1 root
  expect(tree.length).toBe(1)

  const root = tree[0]
  expect(root.data.getName()).toBe('a')
  expect(childList(root)).toMatch('b')
  expect(edgeList(root)).toMatch('a,>,b')

  const b = root.CHILDREN[0]
  expect(b.data.getName()).toBe('b')
  expect(childList(b)).toMatch('c')
  expect(edgeList(b)).toMatch('b,>,c')

  const c = b.CHILDREN[0]
  expect(c.data.getName()).toBe('c')
  expect(childList(c)).toMatch('')
  expect(edgeList(c)).toMatch('c,>,b')
})

it('Ensure making two root tree succeeds', async () => {
  // make a graph a b

  // first of all - making the tree must succeed
  const tree = makeConnectedTree(simpleTwoRootTree())

  // This tree has 1 root
  expect(tree.length).toBe(2)

  const root1 = tree[0]
  expect(root1.data.getName()).toBe('root1')
  expect(childList(root1)).toMatch('child1')
  expect(edgeList(root1)).toMatch('root1,>,child1')

  const root2 = tree[1]
  expect(root2.data.getName()).toBe('root2')
  expect(childList(root2)).toMatch('child2')
  expect(edgeList(root2)).toMatch('root2,>,child2')
})

it('Ensure traversing cyclical tree succeeds', async () => {
  const tree = makeConnectedTree(simpleCyclicalTree())

  const traversal: string[] = []
  traverseTree(tree[0], (node, isLeaf, hasSiblings, nthNodeOnTheLevel, edge) => {
    traversal.push(node.data.getName())
    traversal.push(isLeaf ? 'leaf' : 'node')
    traversal.push(hasSiblings ? 'siblings' : 'single')
    traversal.push(nthNodeOnTheLevel ? 'first' : 'subsequent')
    if (edge) {
      traversal.push(describeEdge(edge).join(','))
    }
  }, (node) => {
    traversal.push(node.data.getName())
  }, (node, hasSiblings) => {
    traversal.push(node.data.getName())
    traversal.push(hasSiblings ? 'siblings' : 'single')
  })

  expect(traversal.join(',')).toBe('a,node,single,subsequent,a,b,node,single,subsequent,a,>,b,b,c,node,single,subsequent,b,>,c,c,c,single,b,single,a,single')
})

// TODO:
/*
// this is a bug in tree traversal (cyclic trees)
/*
ROOT > FirstRootLeaf1 > ( SecondLeaf > ROOT > FirstRootLeaf2 )

ROOT            has children (recursive list w/ lelvel) 1 - FirstRootLeaf1, 1 - FirstRootLeaf2, 2 - SecondLeaf
FirstRootLeaf1  has children 1 - ROOT, 2 - SecondLeaf
SecondLeaf      has children 1 - ROOT
FirstRootLeaf2  has no children
*/
