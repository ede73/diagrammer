// @ts-check
import { visualizeCirclePacked } from './visualizations/visualizeCirclePacked.js'
import { visualizeGraphviz } from './visualizations/visualizeGraphviz.js'
import { visualizeLayerBands } from './visualizations/visualizeLayerBands.js'
import { visualizeMscGen } from './visualizations/visualizeMscGen.js'
import { visualizeParseTree } from './visualizations/visualizeParseTree.js'
import { visualizeRadialDendrogram } from './visualizations/visualizeRadialDendrogram.js'
import { visualizeReingoldTilford } from './visualizations/visualizeReingoldTilford.js'
import { visualizeSankey } from './visualizations/visualizeSankey.js'
import { visualizeUmlClass } from './visualizations/visualizeUmlClass.js'

type ICommandLine = (format: string, outputFile?: string) => string[]

export class Visualization {
  public webVisualizer: boolean
  constructor(
    public name: string,
    public menuName: string,
    public generator: string,
    public visualization?: (generatedResult: string) => Promise<void>,
    public cli?: ICommandLine
  ) {
    this.webVisualizer = visualization !== undefined
  }
}

let localRepoFont: string | undefined

if (typeof window !== 'undefined') {
  localRepoFont = 'fonts/dejavu-sans-bold.ttf'
} else {
  try {
    const fs = (await import('fs')).default
    const path = (await import('path')).default
    const cwdFont = path.resolve(process.cwd(), 'fonts/dejavu-sans-bold.ttf')
    if (fs.existsSync(cwdFont)) {
      localRepoFont = cwdFont
    } else {
      const url = (await import('url')).default
      const moduleFont = url.fileURLToPath(new URL('../fonts/dejavu-sans-bold.ttf', import.meta.url))
      if (fs.existsSync(moduleFont)) {
        localRepoFont = moduleFont
      }
    }
  } catch (_) {}
}

function getLocalRepoFont(): string | undefined {
  return localRepoFont
}

const buggyDiags = (command: string, format: string, outputFile: string) => {
  const font = getLocalRepoFont()
  const redirectingDiag = true
  if (redirectingDiag) {
    return [
      `${command}`,
      '-a',
      `-T${format}`,
      '-f',
      font ?? 'fonts/dejavu-sans-bold.ttf',
      '-',
      `-o${outputFile}`
    ]
  } else {
    return [
      'sh',
      '-c',
      `cat -| /usr/bin/${command}3 -a -T${format} -f${font ?? 'fonts/dejavu-sans-bold.ttf'} -o/dev/stdout /dev/stdin|cat`
    ]
  }
}

const _visualizations: Visualization[] = [
  new Visualization(
    'actdiag',
    'Activity Diagram(cli)',
    'actdiag',
    undefined,
    (format: string, outputFile?: string) => buggyDiags('actdiag', format, outputFile ?? '-')
  ),
  new Visualization('ast', 'AST(JSON only)', 'ast'),
  new Visualization('ast_record', 'Abstract Syntax Tree(Record)', 'ast_record', async (g) => {
    await visualizeGraphviz(g, 'dot')
  }),
  new Visualization(
    'blockdiag',
    'Block Diagram(cli)',
    'blockdiag',
    undefined,
    (format: string, outputFile?: string) => buggyDiags('blockdiag', format, outputFile ?? '-')
  ),
  new Visualization(
    'dot',
    'Graphviz - dot(www/cli)',
    'digraph',
    async (g) => {
      await visualizeGraphviz(g, 'dot')
    },
    (format: string) => [
      'dot',
      '-q',
      `-T${format}`
    ]
  ),
  new Visualization(
    'fdp',
    'Graphviz - fdp(www/cli)',
    'digraph',
    async (g) => {
      await visualizeGraphviz(g, 'fdp')
    },
    (format: string) => [
      'fdp',
      '-q',
      `-T${format}`
    ]
  ),
  new Visualization(
    'neato',
    'Graphviz - neato(www/cli)',
    'digraph',
    async (g) => {
      await visualizeGraphviz(g, 'neato')
    },
    (format: string) => [
      'neato',
      '-q',
      `-T${format}`
    ]
  ),
  new Visualization(
    'osage',
    'Graphviz - osage(www/cli)',
    'digraph',
    async (g) => {
      await visualizeGraphviz(g, 'osage')
    },
    (format: string) => [
      'osage',
      '-q',
      `-T${format}`
    ]
  ),
  new Visualization(
    'twopi',
    'Graphviz - twopi(www/cli)',
    'digraph',
    async (g) => {
      await visualizeGraphviz(g, 'twopi')
    },
    (format: string) => [
      'twopi',
      '-q',
      `-T${format}`
    ]
  ),
  new Visualization('sfdp', 'Graphviz - sfdp(cli)', 'digraph', undefined, (format: string) => [
    'sfdp',
    '-q',
    `-T${format}`
  ]),
  new Visualization('layerbands', 'LayerBands(GoJS)', 'layerbands', visualizeLayerBands),
  new Visualization('mscgen', 'MSCGen(www/cli)', 'mscgen', visualizeMscGen, (format: string) => [
    'mscgen',
    '-i-',
    '-o-',
    `-T${format}`
  ]),
  new Visualization(
    'nwdiag',
    'Network Diagram(cli)',
    'nwdiag',
    undefined,
    (format: string, outputFile?: string) => buggyDiags('nwdiag', format, outputFile ?? '-')
  ),
  new Visualization('parsetree', 'ParseTree(GoJS)', 'parsetree', visualizeParseTree),
  new Visualization('circlepacked', 'Circle packed', 'dendrogram', visualizeCirclePacked),
  new Visualization('radialdendrogram', 'Radial Dendrogram', 'dendrogram', visualizeRadialDendrogram),
  new Visualization('reingoldtilford', 'Reingold-Tilford', 'dendrogram', visualizeReingoldTilford),
  new Visualization(
    'plantuml_sequence',
    'PlantUML Sequence Diagram(cli)',
    'plantuml_sequence',
    undefined,
    (format: string) => [
      'java',
      '-Djava.awt.headless=true',
      '-Xmx2048m',
      '-jar',
      'ext/plantuml.jar',
      `-t${format.toLocaleLowerCase()}`,
      '-p'
    ]
  ),
  new Visualization(
    'mermaid_sequence',
    'Mermain Sequence Diagram(cli)',
    'mermaid_sequence',
    undefined,
    (format: string) => [
      'mmdc',
      '-e png',
      '-i-',
      '-o-'
    ]
  ),
  new Visualization('sankey', 'Sankey', 'sankey', visualizeSankey),
  new Visualization(
    'seqdiag',
    'Sequence Diagram(cli)',
    'seqdiag',
    undefined,
    (format: string, outputFile?: string) => buggyDiags('seqdiag', format, outputFile ?? '-')
  ),
  new Visualization('umlclass', 'UMLClass(GoJS)', 'umlclass', visualizeUmlClass)
]

export let visualizations: Visualization[] = _visualizations
export function setVisualizationsForTests(testVisualizations: Visualization[]) {
  visualizations = testVisualizations
}
export function resetVisualizationsForTests() {
  visualizations = _visualizations
}

export function visualizationsToGenerators(): Map<string, string> {
  return new Map(
    visualizations.map((p) => {
      return [p.name.replace('_', ''), p.generator.toLowerCase()]
    })
  )
}

export function findGeneratorForVisualization(visualization: string) {
  const generator = visualizationsToGenerators().get(visualization.toLocaleLowerCase().replace('_', ''))
  if (!generator) {
    throw Error(`Cannot map visualizer (${visualization}) to a generator`)
  }
  return generator
}

export function hasGenerator(generator: string) {
  return visualizations.some((p) => p.generator.toLowerCase() === generator.replace('_', '').toLowerCase())
}

export function hasVisualizer(visualizer: string) {
  return visualizations.some((p) => p.name.toLocaleLowerCase() === visualizer.toLowerCase())
}
