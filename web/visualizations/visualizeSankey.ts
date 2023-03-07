// @ts-check
import { makeSVG, removeOldVisualizations } from '../d3support'
import { visualizations } from '../globals.js'
// d3 is loaded directly in index.html as well as d3-sankey
// this local (typed) import does not have d3-sankey
// so..import typed d3 as d4 for now, d3 is loaded in index.html
import * as d4 from 'd3'
import { type SankeyNodeT, type SankeyLinkT, type SankeyDocumentT } from '../../generators/sankey'

visualizations.set('sankey', visualizeSankey)

// https://github.com/ricklupton/d3-sankey-diagram or
// https://github.com/d3/d3-sankey/blob/master/README.md
export async function visualizeSankey(generatorResult: string) {
  const jsonData = JSON.parse(generatorResult)
  const width = 964
  const height = 600

  // === reverse engineered, removed all fields not used here
  interface ys {
    y0: number
    y1: number
  }
  interface xs {
    x0: number
    x1: number
  }

  interface SankeyMappedPartialT extends xs, ys {
    name: string
  }

  interface indexValue {
    value: number
  }

  interface SankeyMappedLinkT extends ys, indexValue {
    source: SankeyMappedPartialT
    target: SankeyMappedPartialT
    uid: string
    width: number
  }

  interface SankeyMappedNodeT extends xs, ys, indexValue {
    name: string
  }

  const edgeColor = 'path'

  // @ts-expect-error TODO: import error with types/implementation node.js/web browser
  // eslint-disable-next-line no-undef
  const _sankey = d3.sankey()
    .nodeWidth(15)
    .nodePadding(10)
    .extent([[1, 1], [width - 1, height - 5]])

  const sankey = ({ nodes, links }: SankeyDocumentT): { nodes: SankeyMappedNodeT[], links: SankeyMappedLinkT[] } =>
    _sankey({
      nodes: nodes.map((d: SankeyNodeT) => Object.assign({}, d)),
      links: links.map((d: SankeyLinkT) => Object.assign({}, d))
    })

  const f = d4.format(',.0f')
  const format = (d: any) => `${f(d)}`

  const _color = d4.scaleOrdinal(d4.schemeCategory10)
  const color = (name: any) => _color('red')

  removeOldVisualizations()
  const svgimg = makeSVG(width, height)

  {
    const { nodes, links } = sankey(jsonData)

    svgimg.append('g')
      .attr('stroke', '#000')
      .selectAll('rect')
      .data(nodes)
      .join('rect')
      .attr('x', d =>
        d.x0
      )
      .attr('y', d =>
        d.y0)
      .attr('height', d =>
        (d.y1 - d.y0))
      .attr('width', d =>
        (d.x1 - d.x0))
      .attr('fill', d => color(
        d.name))
      .append('title')
      .text(d => {
        return `${d.name}\n${format(d.value)}`
      })

    const link = svgimg.append('g')
      .attr('fill', 'none')
      .attr('stroke-opacity', 0.5)
      .selectAll('g')
      .data(links)
      .join('g')
      .style('mix-blend-mode', 'multiply')

    function update() {
      if (edgeColor === 'path') {
        const gradient = link.append('linearGradient')
          .attr('id', (d, i) => {
            //  (d.uid = DOM.uid("link")).id
            const id = `link-${i}`
            d.uid = `url(#${id})`
            return id
          })
          .attr('gradientUnits', 'userSpaceOnUse')
          .attr('x1', d =>
            d.source.x1)
          .attr('x2', d =>
            d.target.x0)

        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', d =>
            color(d.source.name))

        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', d =>
            color(d.target.name))
      }

      link.append('path')
        // @ts-expect-error TODO: import error with types/implementation node.js/web browser
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke', (d) =>
          (edgeColor === 'path' ? d.uid : edgeColor === 'input' ? color(d.source.name) : color(d.target.name)))
        .attr('stroke-width', d =>
          Math.max(1, d.width))
    }

    update()

    link.append('title')
      .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)}`)

    svgimg.append('g')
      .style('font', '10px sans-serif')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('x', d =>
        (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
      .attr('y', d =>
        (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d =>
        (d.x0 < width / 2 ? 'start' : 'end'))
      .text(d =>
        d.name)
  }
}
