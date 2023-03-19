// @ts-check
import { ActDiag } from '../generators/actdiag.js'
import { AST } from '../generators/ast.js'
import { ASTRecord } from '../generators/ast_record.js'
import { BlockDiag } from '../generators/blockdiag.js'
import { Dendrogram } from '../generators/dendrogram.js'
import { DiGraph } from '../generators/digraph.js'
import { type Generator } from '../generators/generator.js'
import { LayerBands } from '../generators/layerbands.js'
import { MSCGen } from '../generators/mscgen.js'
import { NWDiag } from '../generators/nwdiag.js'
import { ParseTree } from '../generators/parsetree.js'
import { PlantUMLSequence } from '../generators/plantuml_sequence.js'
import { Sankey } from '../generators/sankey.js'
import { SeqDiag } from '../generators/seqdiag.js'
import { UMLClass } from '../generators/umlclass.js'
import { visualizeCirclePacked } from '../web/visualizations/visualizeCirclePacked.js'
import { visualizeGraphviz } from '../web/visualizations/visualizeGraphviz.js'
import { visualizeLayerBands } from '../web/visualizations/visualizeLayerBands.js'
import { visualizeMscGen } from '../web/visualizations/visualizeMscGen.js'
import { visualizeParseTree } from '../web/visualizations/visualizeParseTree.js'
import { visualizeRadialDendrogram } from '../web/visualizations/visualizeRadialDendrogram.js'
import { visualizeReingoldTilford } from '../web/visualizations/visualizeReingoldTilford.js'
import { visualizeSankey } from '../web/visualizations/visualizeSankey.js'
import { visualizeUmlClass } from '../web/visualizations/visualizeUmlClass.js'

type ICommandLine = (format: string, outputFile?: string) => string[]

export class Visualization {
  public webVisualizer: boolean
  constructor(public name: string,
    public menuName: string,
    public generator: typeof Generator,
    public visualization?: (generatedResult: string) => Promise<void>,
    public cli?: ICommandLine) {
    this.webVisualizer = visualization !== undefined
  }
}

const buggyDiags = (command: string, format: string, outputFile: string) => {
  const font = '/usr/share/fonts/truetype/dejavu//DejaVuSans-Bold.ttf'
  const redirectingDiag = true
  if (redirectingDiag) {
    return [
      `${command}`,
      '-a',
      `-T${format}`,
      '-f',
      font,
      '-',
      `-o${outputFile}`]
  } else {
    return [
      // piping works if running as cat file|nwdiag3 -o/dev/stdout -o/dev/stdin
      // of course node.js spawn doesn't provide /dev/stdout nor /dev/stdin
      // https://github.com/nodejs/node/issues/21941
      'sh',
      '-c',
      `cat -| /usr/bin/${command}3 -a -T${format} -f${font} -o/dev/stdout /dev/stdin|cat`]
  }
}

const _visualizations: Visualization[] = [
  new Visualization('actdiag', 'Activity Diagram(cli)', ActDiag,
    undefined, (format: string, outputFile?: string) => buggyDiags('actdiag', format, outputFile ?? '-')),
  new Visualization('ast', 'AST(JSON only)', AST),
  new Visualization('ast_record', 'Abstract Syntax Tree(Record)', ASTRecord, async (g) => {
    await visualizeGraphviz(g, 'dot')
  }),
  new Visualization('blockdiag', 'Block Diagram(cli)', BlockDiag, undefined, (format: string, outputFile?: string) => buggyDiags('blockdiag', format, outputFile ?? '-')),
  new Visualization('dot', 'Graphviz - dot(www/cli)', DiGraph, async (g) => {
    await visualizeGraphviz(g, 'dot')
  }, (format: string) => [
    'dot',
    '-q',
    `-T${format}`
  ]),
  new Visualization('fdp', 'Graphviz - fdp(www/cli)', DiGraph, async (g) => {
    await visualizeGraphviz(g, 'fdp')
  }, (format: string) => [
    'fdp',
    '-q',
    `-T${format}`
  ]),
  new Visualization('neato', 'Graphviz - neato(www/cli)', DiGraph, async (g) => {
    await visualizeGraphviz(g, 'neato')
  }, (format: string) => [
    'neato',
    '-q',
    `-T${format}`
  ]),
  new Visualization('osage', 'Graphviz - osage(www/cli)', DiGraph, async (g) => {
    await visualizeGraphviz(g, 'osage')
  }, (format: string) => [
    'osage',
    '-q',
    `-T${format}`
  ]),
  new Visualization('twopi', 'Graphviz - twopi(www/cli)', DiGraph, async (g) => {
    await visualizeGraphviz(g, 'twopi')
  }, (format: string) => [
    'twopi',
    '-q',
    `-T${format}`
  ]),
  new Visualization('sfdp', 'Graphviz - sfdp(cli)', DiGraph, undefined, (format: string) => [
    'sfdp',
    '-q',
    `-T${format}`
  ]),
  new Visualization('layerbands', 'LayerBands(GoJS)', LayerBands, visualizeLayerBands),
  new Visualization('mscgen', 'MSCGen(www/cli)', MSCGen, visualizeMscGen, (format: string) => [
    'mscgen',
    '-i-',
    '-o-',
    `-T${format}`
  ]),
  new Visualization('nwdiag', 'Network Diagram(cli)', NWDiag, undefined, (format: string, outputFile?: string) => buggyDiags('nwdiag', format, outputFile ?? '-')),
  new Visualization('parsetree', 'ParseTree(GoJS)', ParseTree, visualizeParseTree),
  new Visualization('circlepacked', 'Circle packed', Dendrogram, visualizeCirclePacked),
  new Visualization('radialdendrogram', 'Radial Dendrogram', Dendrogram, visualizeRadialDendrogram),
  new Visualization('reingoldtilford', 'Reingold-Tilford', Dendrogram, visualizeReingoldTilford),
  new Visualization('plantuml_sequence', 'PlantUML Sequence Diagram(cli)', PlantUMLSequence, undefined, (format: string) => [
    'java',
    '-Djava.awt.headless=true',
    '-Xmx2048m',
    '-jar',
    'ext/plantuml.jar',
    `-t${format.toLocaleLowerCase()}`,
    '-p'
  ]),
  new Visualization('sankey', 'Sankey', Sankey, visualizeSankey),
  new Visualization('seqdiag', 'Sequence Diagram(cli)', SeqDiag, undefined, (format: string, outputFile?: string) => buggyDiags('seqdiag', format, outputFile ?? '-')),
  new Visualization('umlclass', 'UMLClass(GoJS)', UMLClass, visualizeUmlClass)
]

// Uh, jest mocking doesn't really work, so doing this hard way, see tests/parser/parse.test.js
export let visualizations: Visualization[] = _visualizations
export function setVisualizationsForTests(testVisualizations: Visualization[]) {
  visualizations = testVisualizations
}
export function resetVisualizationsForTests() {
  visualizations = _visualizations
}

export function visualizationsToGenerators(): Map<string, string> {
  return new Map(visualizations.map(p => {
    return [p.name.replace('_', ''), p.generator.name.toLocaleLowerCase()]
  }))
}

export function findGeneratorForVisualization(visualization: string) {
  const generator = visualizationsToGenerators().get(visualization.toLocaleLowerCase().replace('_', ''))
  if (!generator) {
    throw Error(`Cannot map visualizer (${visualization}) to a generator`)
  }
  return generator
}

export function hasGenerator(generator: string) {
  return visualizations.some(p => p.generator.name.toLocaleLowerCase() === generator.replace('_', ''))
}

export function hasVisualizer(visualizer: string) {
  return visualizations.some(p => p.name.toLocaleLowerCase() === visualizer)
}
