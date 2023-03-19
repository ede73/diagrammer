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

export class Visualization {
  constructor(public name: string, public menuName: string, public generator: typeof Generator, public visualization?: (generatedResult: string) => Promise<void>) { }
}
const _visualizations: Visualization[] = [
  new Visualization('actdiag', 'Activity Diagram(cli)', ActDiag),
  new Visualization('ast', 'AST(JSON only)', AST),
  new Visualization('ast_record', 'Abstract Syntax Tree(Record)', ASTRecord, async (g) => {
    await visualizeGraphviz(g, 'dot')
  }),
  new Visualization('blockdiag', 'Block Diagram(cli)', BlockDiag),
  new Visualization('dot', 'Graphviz - dot(www/cli)', DiGraph, async (g) => {
    await visualizeGraphviz(g, 'dot')
  }),
  new Visualization('fdp', 'Graphviz - fdp(www/cli)', DiGraph, async (g) => {
    await visualizeGraphviz(g, 'fdp')
  }),
  new Visualization('neato', 'Graphviz - neato(www/cli)', DiGraph, async (g) => {
    await visualizeGraphviz(g, 'neato')
  }),
  new Visualization('osage', 'Graphviz - osage(www/cli)', DiGraph, async (g) => {
    await visualizeGraphviz(g, 'osage')
  }),
  new Visualization('twopi', 'Graphviz - twopi(www/cli)', DiGraph, async (g) => {
    await visualizeGraphviz(g, 'twopi')
  }),
  new Visualization('sfdp', 'Graphviz - sfdp(cli)', DiGraph),
  new Visualization('layerbands', 'LayerBands(GoJS)', LayerBands, visualizeLayerBands),
  new Visualization('mscgen', 'MSCGen(www/cli)', MSCGen, visualizeMscGen),
  new Visualization('nwdiag', 'Network Diagram(cli)', NWDiag),
  new Visualization('parsetree', 'ParseTree(GoJS)', ParseTree, visualizeParseTree),
  new Visualization('circlepacked', 'Circle packed', Dendrogram, visualizeCirclePacked),
  new Visualization('radialdendrogram', 'Radial Dendrogram', Dendrogram, visualizeRadialDendrogram),
  new Visualization('reingoldtilford', 'Reingold-Tilford', Dendrogram, visualizeReingoldTilford),
  new Visualization('plantuml_sequence', 'PlantUML Sequence Diagram(cli)', PlantUMLSequence),
  new Visualization('sankey', 'Sankey', Sankey, visualizeSankey),
  new Visualization('seqdiag', 'Sequence Diagram(cli)', SeqDiag),
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
