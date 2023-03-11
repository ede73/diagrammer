// @ts-check
import * as d3 from 'd3'
import { makeSVG, removeOldVisualizations } from '../d3support.js'
import { visualizations } from '../globals.js'
import { type DendrogramDocument } from '../../generators/dendrogram.js'
import { Link, L } from 'd3-shape'

visualizations.set('reingoldtilford', visualizeReingoldTilford)

export async function visualizeReingoldTilford(generatorResult: string) {
  const jsonData: DendrogramDocument = JSON.parse(generatorResult)
  const width = 600
  const height = 400
  const diameter = height * 0.75
  const radius = diameter / 2

  const tree = d3.tree()
    .size([2 * Math.PI, radius])
    .separation(function (a, b) {
      return (a.parent === b.parent ? 1 : 2) / a.depth
    })

  const data = d3.hierarchy(jsonData)
  const treeData = tree(data)

  const links = treeData.links()
  const nodes = treeData.descendants()

  removeOldVisualizations()
  const svgimg = makeSVG(width, height)
    .attr('transform', `translate(${width / 2},${height / 2})`)

  // https://developer.mozilla.org/en-US/docs/Web/SVG/Element/path
  svgimg.selectAll('.link')
    .data(links)
    .join('path')
    .attr('class', 'link')
    // https://github.com/d3/d3-shape#curves
    // https://observablehq.com/@d3/d3-lineradial
    // @ts-expect-error odd issue with studio
    .attr('d', d3.linkRadial()
      .angle((d, i) => d.x)
      .radius((d, i) => d.y))

  // https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g
  const node = svgimg.selectAll('g.node')
    .data(nodes)
    .enter().append('g')
    .style('font', '18px sans-serif')
    .attr('class', 'node')
    .attr('transform', function (d) {
      // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform
      // ${d.x * 180 / Math.PI - 90}
      return `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y})`
    })

  // https://developer.mozilla.org/en-US/docs/Web/SVG/Element/circle
  node.append('circle')
    .attr('r', 4.5)

  // https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text
  node.append('text')
    .attr('fill', 'blue')
    .attr('dx', function (d) { return d.children ? -8 : 8 })
    .attr('dy', 3)
    .attr('text-anchor', function (d) { return d.children ? 'end' : 'start' })
    .text(function (d) {
      // @ts-expect-error TODO: just import conflict node vs. browser vs. VSCode, will resolve eventually
      return d.data.name
    })

  d3.select(self.frameElement).style('height', `${height}px`)
}
