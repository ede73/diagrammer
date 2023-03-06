// @ts-check
import * as d3 from 'd3'
import { makeSVG, removeOldVisualizations } from '../d3support'
import { visualizations } from '../globals.js'

visualizations.set('radialdendrogram', visualizeRadialDendrogram)

// https://medium.com/analytics-vidhya/creating-a-radial-tree-using-d3-js-for-javascript-be943e23b74e
export function visualizeRadialDendrogram(generatorResult: string) {
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

  // eslint-disable-next-line no-unused-vars
  const link = svgimg.selectAll('.link')
    .data(links)
    .join('path')
    .attr('class', 'link')
    // @ts-ignore
    .attr('d', d3.linkRadial()
      // @ts-ignore
      .angle(d => d.x)
      // @ts-ignore
      .radius(d => d.y))

  const node = svgimg.selectAll('.node')
    .data(nodes)
    .enter().append('g')
    .style('font', '18px sans-serif')
    .attr('class', 'node')
    .attr('transform', function (d) { return `rotate(${d.x - 90})translate(${d.y})` })

  node.append('circle')
    .attr('r', 4.5)

  node.append('text')
    .attr('dy', '.31em')
    .attr('fill', 'blue')
    .attr('text-anchor', function (d) { return d.x < 180 ? 'start' : 'end' })
    .attr('transform', function (d) { return d.x < 180 ? 'translate(8)' : 'rotate(180)translate(-8)' })
    .text(function (d) {
      // @ts-ignore
      return d.data.name
    })
}
