// @ts-check
import * as d3 from 'd3'
import { makeSVG, removeOldVisualizations } from '../d3support.js'
import { type DendrogramDocument } from 'generators/dendrogram.js'
import { type HierarchyPointNode, type HierarchyPointLink } from 'd3'

export async function visualizeReingoldTilford(generatorResult: string) {
  try {
    JSON.parse(generatorResult)
  } catch (e) {
    console.error(e, generatorResult)
  }
  const jsonData: DendrogramDocument = JSON.parse(generatorResult)

  removeOldVisualizations()
  // TODO: pull the zoom out
  const svgimg = makeSVG()
  const svgelement = svgimg.node()?.parentNode as SVGSVGElement
  const width = Number(svgelement.width.baseVal.valueAsString)
  const height = Number(svgelement.height.baseVal.valueAsString)// svgimg.node()?.parentNode.attr('height')
  svgimg.attr('transform', `translate(${width / 2},${height / 2})`)
  const radius = Math.min(width, height) // / 2

  // TODO: Add autoresize
  const tree = d3.tree<DendrogramDocument>()
    .size([2 * Math.PI, radius])
    .separation((a, b) => {
      return (a.parent === b.parent ? 1 : 2) / a.depth
    })

  const data = d3.hierarchy(jsonData)
  const treeData = tree(data)

  const links = treeData.links()
  const nodes = treeData.descendants()

  const getRadial = (d: HierarchyPointNode<DendrogramDocument>): number => {
    // from 100 to 800 it goes
    return d.y
  }

  // https://developer.mozilla.org/en-US/docs/Web/SVG/Element/path
  svgimg.selectAll('.link')
    .data(links)
    .join('path')
    .attr('class', 'link')
    .attr('stroke', d => {
      if (d.source.data.edgecolor) {
        return d.source.data.edgecolor
      }
      if (d.target.data.edgecolor) {
        return d.target.data.edgecolor
      }
      return 'yellow'
    })
    // https://github.com/d3/d3-shape#curves
    // https://observablehq.com/@d3/d3-lineradial
    .attr('d', d3.linkRadial<HierarchyPointLink<DendrogramDocument>, HierarchyPointNode<DendrogramDocument>>()
      .angle((d, i) => d.x)
      .radius((d, i) => getRadial(d))
    )

  // https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g
  const node = svgimg.selectAll('g.node')
    .data(nodes)
    .enter().append('g')
    .style('font', '10px sans-serif')
    .attr('class', 'node')
    .attr('transform', (d) => {
      // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform
      // ${d.x * 180 / Math.PI - 90}
      return `rotate(${d.x * 180 / Math.PI - 90}) translate(${getRadial(d)})`
    })

  // https://developer.mozilla.org/en-US/docs/Web/SVG/Element/circle
  node.append('circle')
    .attr('r', 4.5)

  // https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text
  node.append('text')
    .attr('fill', (d) => {
      if (d.data.nodecolor) {
        return d.data.nodecolor
      }
      return 'blue'
    })
    .attr('dx', (d) => {
      return d.children ? -8 : 8
    })
    .attr('dy', 3)
    .attr('text-anchor', (d) => {
      return d.children ? 'end' : 'start'
    })
    .attr('transform', (d) => {
      // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform
      // ${d.x * 180 / Math.PI - 90}
      return `rotate(${-(d.x * 180 / Math.PI - 90)})`
    })
    .append('a')
    // Could not get link color changed in CSS. SVG A is its own element(?)
    // See end of index.css at SVG namespace. Remove once fixed
    .attr('fill', (d) => {
      if (d.data.nodecolor) {
        return d.data.nodecolor
      }
      return 'blue'
    })
    .attr('href', (d) => {
      const label = d.data.nodelabel
      if (label?.includes('::')) {
        const [, url] = label.split('::')
        return url
      }
      return ''
    })
    .attr('target', '_blank')
    .text((d) => {
      const label = d.data.nodelabel
      if (label?.includes('::')) {
        const [head] = label.split('::')
        return head
      }
      if (label) {
        return label
      }
      return d.data.name
    })

  d3.select(self.frameElement).style('height', `${height}px`)
}
