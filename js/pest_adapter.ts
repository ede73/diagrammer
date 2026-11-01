// @ts-check
import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

import { GraphCanvas } from '../model/graphcanvas.js'
import { GraphVertex } from '../model/graphvertex.js'
import { GraphEdge } from '../model/graphedge.js'
import { GraphGroup } from '../model/graphgroup.js'
import { GraphInner } from '../model/graphinner.js'
import { GraphReference } from '../model/graphreference.js'
import { makeGenerator } from './config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const binaryPath = path.join(rootDir, 'target', 'release', 'diagrammer_pest_parse')

export function runPestBinary(inputCode: string): string {
  if (!fs.existsSync(binaryPath)) {
    throw new Error(`Pest binary not found at ${binaryPath}. Run 'make parser PARSER_BACKEND=pest' or 'cargo build --release' first.`)
  }
  return execFileSync(binaryPath, [], {
    input: inputCode,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  })
}

export function buildGraphCanvasFromJson(data: any, targetCanvas?: GraphCanvas): GraphCanvas {
  const canvas = targetCanvas || new GraphCanvas()
  if (data.visualizer) canvas.setVisualizer(data.visualizer)
  if (data.shape) canvas.setCurrentShape(data.shape)
  if (data.direction) canvas.setDirection(data.direction)
  if (data.start) canvas.setStart(data.start)
  if (data.defaults) {
    Object.entries(data.defaults).forEach(([k, v]) => canvas.setDefault(k as any, v as string))
  }

  const vertexMap = new Map<string, any>()

  function instantiateContainer(containerData: any, parentContainer: any) {
    const container = (containerData.__PSEUDOTYPE === 'GraphInner')
      ? new GraphInner(containerData.name, parentContainer)
      : new GraphGroup(containerData.name, parentContainer)

    if (containerData.label) container.setLabel(containerData.label)
    if (containerData.color) container.setColor(containerData.color)
    if (containerData.defaults) {
      Object.entries(containerData.defaults).forEach(([k, v]) => container.setDefault(k as any, v as string))
    }
    if (containerData.exitvertex) container.exitvertex = containerData.exitvertex
    if (containerData.conditional) container.conditional = containerData.conditional

    return container
  }

  function processObjects(rawObjects: any[], currentContainer: any) {
    for (const raw of rawObjects) {
      if (raw.GraphVertex || raw.__PSEUDOTYPE === 'GraphVertex') {
        const name = raw.GraphVertex ? raw.GraphVertex.name : raw.name
        const v = new GraphVertex(name, currentContainer, raw.shape, raw.style)
        if (raw.label) v.setLabel(raw.label)
        if (raw.color) v.setColor(raw.color)
        if (raw.image) v.setImage(raw.image)
        vertexMap.set(name, v)
        currentContainer.addObject(v)
      } else if (raw.__PSEUDOTYPE === 'GraphGroup' || raw.__PSEUDOTYPE === 'GraphConditional' || raw.__PSEUDOTYPE === 'GraphInner') {
        const group = instantiateContainer(raw, currentContainer)
        vertexMap.set(group.getName(), group)
        currentContainer.addObject(group)
        if (raw._OBJECTS) {
          processObjects(raw._OBJECTS, group)
        }
        if (raw._ROOTVERTICES) {
          group._ROOTVERTICES.length = 0
          for (const r of raw._ROOTVERTICES) {
            const name = r.GraphVertex ? r.GraphVertex.name : (r.name || (r.GraphReference && r.GraphReference.name))
            const v = vertexMap.get(name)
            if (v && !group._ROOTVERTICES.includes(v)) {
              group._ROOTVERTICES.push(v)
            }
          }
        }
      } else if (raw.__PSEUDOTYPE === 'GraphReference' || raw.GraphReference) {
        const name = raw.GraphReference ? raw.GraphReference.name : raw.name
        const ref = new GraphReference(name, currentContainer)
        currentContainer.addObject(ref)
      } else if (raw.GraphEdge || raw.__PSEUDOTYPE === 'GraphEdge') {
        const edgeData = raw.GraphEdge || raw
        const lhs = vertexMap.get(edgeData.left)
        const rhs = vertexMap.get(edgeData.right)
        if (lhs && rhs) {
          const edge = new GraphEdge(edgeData.edgeType, canvas, lhs, rhs)
          if (edgeData.label) edge.setLabel(edgeData.label)
          if (edgeData.color) edge.setColor(edgeData.color)
          if (edgeData.lcompass) edge.lcompass = edgeData.lcompass
          if (edgeData.rcompass) edge.rcompass = edgeData.rcompass
          canvas.addEdge(edge)
        }
      }
    }
  }

  if (data._OBJECTS) {
    processObjects(data._OBJECTS, canvas)
  }

  canvas._ROOTVERTICES.length = 0
  if (data._ROOTVERTICES) {
    for (const raw of data._ROOTVERTICES) {
      const name = raw.GraphVertex ? raw.GraphVertex.name : (raw.name || (raw.GraphReference && raw.GraphReference.name))
      const v = vertexMap.get(name)
      if (v && !canvas._ROOTVERTICES.includes(v)) {
        canvas._ROOTVERTICES.push(v)
      }
    }
  }

  canvas.equal.length = 0
  if (data.equal) {
    for (const raw of data.equal) {
      const name = raw.GraphVertex ? raw.GraphVertex.name : raw.name
      const v = vertexMap.get(name)
      if (v && !canvas.equal.includes(v)) {
        canvas.equal.push(v)
      }
    }
  }

  return canvas
}

export function pestParse(diagrammerCode: string, parserYY: any) {
  const jsonStr = runPestBinary(diagrammerCode)
  const data = JSON.parse(jsonStr)

  const canvas = parserYY && parserYY.GRAPHCANVAS ? parserYY.GRAPHCANVAS : new GraphCanvas()
  buildGraphCanvasFromJson(data, canvas)

  const useVisualizer = (parserYY && parserYY.USE_VISUALIZER) || canvas.getVisualizer() || 'dot'
  canvas.setVisualizer(useVisualizer)
  if (parserYY && parserYY.result) {
    canvas.result = parserYY.result
  }

  const generator = makeGenerator(useVisualizer, canvas)
  if (generator) {
    generator.generate()
  } else {
    throw new Error(`Cannot find generator for visualizer "${useVisualizer}"`)
  }
}
