// @ts-check
import * as d3 from 'd3'
import { makeSVG, removeOldVisualizations } from '../d3support'
import { visualizations } from '../globals.js'
import { type DendrogramDocument } from '../../generators/dendrogram'

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
  const root = tree(data)

  removeOldVisualizations()
  const svgimg = makeSVG(width, height)
    .attr('transform', `translate(${width / 2},${height / 2})`)

  // not sure what this type is, but DEFINITELY not what ts suggests
  // It is as =>
  // h { children:[],data:{},depth,number,height,parent,x:number,y:number}
  interface JooJoo {
    x: number
    y: number
  }
  const links = root.links()
  svgimg.selectAll('path.link')
    .data(links)
    .enter().append('path')
    .attr('class', 'link')
    // @ts-expect-error TODO: TS type detection is totally off here (perhaps I've mismatch with types/implementation)
    .attr('d', d3.linkRadial()
      .angle(d => (d as unknown as JooJoo).x)
      .radius(d => (d as unknown as JooJoo).x))

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
      // @ts-expect-error TODO: just import conflict node vs. browser vs. VSCode, will resolve eventually
      return d.data.name
    })

  d3.select(self.frameElement).style('height', `${height}px`)
}
