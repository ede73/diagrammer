// @ts-check
import * as d3 from 'd3'
import { makeSVG, removeOldVisualizations } from '../d3support'
import { visualizations } from '../globals.js'

visualizations.set('reingoldtilford', visualizeReingoldTilford)

export function visualizeReingoldTilford(generatorResult: string) {
  const jsonData = JSON.parse(generatorResult)
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
  const root = tree(data)

  removeOldVisualizations()
  const svgimg = makeSVG(width, height)
    .attr('transform', `translate(${width / 2},${height / 2})`)

  const links = root.links()
  // eslint-disable-next-line no-unused-vars
  const link = svgimg.selectAll('path.link')
    .data(links)
    .enter().append('path')
    .attr('class', 'link')
    // @ts-ignore
    .attr('d', d3.linkRadial()
      // @ts-ignore
      .angle(d => d.x)
      // @ts-ignore
      .radius(d => d.y))

  const nodes = root.descendants()
  const node = svgimg.selectAll('g.node')
    .data(nodes)
    .enter().append('g')
    .style('font', '18px sans-serif')
    .attr('class', 'node')
    .attr('transform', function (d) {
      return `rotate(${d.x * 180 / Math.PI - 90})` +
        `translate(${d.y}, 0)`
    })

  node.append('circle')
    .attr('r', 4.5)

  node.append('text')
    .attr('fill', 'blue')
    .attr('dx', function (d) { return d.children ? -8 : 8 })
    .attr('dy', 3)
    .attr('text-anchor', function (d) { return d.children ? 'end' : 'start' })
    .text(function (d) {
      // @ts-ignore
      return d.data.name
    })

  d3.select(self.frameElement).style('height', height + 'px')
}
