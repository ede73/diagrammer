// @ts-check
import * as d3 from 'd3'
import { makeSVG, removeOldVisualizations } from '../d3support'
import { visualizations } from '../globals.js'

visualizations.set('radialdendrogram', visualizeRadialDendrogram)

// https://medium.com/analytics-vidhya/creating-a-radial-tree-using-d3-js-for-javascript-be943e23b74e
export async function visualizeRadialDendrogram(generatorResult: string) {
  const jsonData = JSON.parse(generatorResult)
  const radius = 250
  const width = 600
  const height = 600

  const tree = d3.tree()
    .size([2 * Math.PI, radius])
    .separation(function (a, b) {
      return (a.parent === b.parent ? 1 : 2) / a.depth
    })
  const data = d3.hierarchy(jsonData)
  const treeData = tree(data)

  const nodes = treeData.descendants()
  const links = treeData.links()

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
      .angle(d => d.x)
      .radius(d => d.y))

  // https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g
  const node = svgimg.selectAll('g.node')
    .data(nodes)
    .enter().append('g')
    .style('font', '18px sans-serif')
    .attr('class', 'node')
    .attr('transform', function (d) {
      // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform
      return `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y})`
    })

  // https://developer.mozilla.org/en-US/docs/Web/SVG/Element/circle
  node.append('circle')
    .attr('r', 4.5)

  // https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text
  node.append('text')
    .attr('fill', 'blue')
    .attr('dy', '.31em')
    .attr('text-anchor', function (d) { return d.x < 180 ? 'start' : 'end' })
    .attr('transform', function (d) { return d.x < 180 ? 'translate(8)' : 'rotate(180) translate(-8)' })
    .text(function (d) {
      // @ts-expect-error TODO: just import conflict node vs. browser vs. VSCode, will resolve eventually
      return d.data.name
    })
}
