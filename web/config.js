import { visualizeCirclePacked } from './visualizations/visualizeCirclePacked.js';
import { visualizeGraphviz } from './visualizations/visualizeGraphviz.js';
import { visualizeLayerBands } from './visualizations/visualizeLayerBands.js';
import { visualizeMscGen } from './visualizations/visualizeMscGen.js';
import { visualizeParseTree } from './visualizations/visualizeParseTree.js';
import { visualizeRadialDendrogram } from './visualizations/visualizeRadialDendrogram.js';
import { visualizeReingoldTilford } from './visualizations/visualizeReingoldTilford.js';
import { visualizeSankey } from './visualizations/visualizeSankey.js';
import { visualizeUmlClass } from './visualizations/visualizeUmlClass.js';
import { visualizeNativeSequence } from './visualizations/visualizeNativeSequence.js';
import { visualizeMermaid } from './visualizations/visualizeMermaid.js';
export class Visualization {
    constructor(name, menuName, generator, visualization, cli, metadata = {}) {
        this.name = name;
        this.menuName = menuName;
        this.generator = generator;
        this.visualization = visualization;
        this.cli = cli;
        this.webVisualizer = visualization !== undefined;
        this.family = metadata.family || generator;
        this.engine = metadata.engine || name;
        this.runtime = visualization !== undefined ? 'web' : 'cli';
        this.description = metadata.description || '';
        this.visualizerLabel = metadata.visualizerLabel || (menuName.includes(':') ? menuName.split(':')[1].trim() : menuName);
    }
}
export function getGeneratorFamilies() {
    const families = [];
    visualizations.forEach(v => {
        if (!families.includes(v.family)) {
            families.push(v.family);
        }
    });
    return families;
}
export function getVisualizersForFamily(family) {
    return visualizations.filter(v => v.family === family);
}
let localRepoFont;
if (typeof window !== 'undefined') {
    localRepoFont = 'fonts/dejavu-sans-bold.ttf';
}
else {
    try {
        const fs = (await import('fs')).default;
        const path = (await import('path')).default;
        const cwdFont = path.resolve(process.cwd(), 'fonts/dejavu-sans-bold.ttf');
        if (fs.existsSync(cwdFont)) {
            localRepoFont = cwdFont;
        }
        else {
            const url = (await import('url')).default;
            const moduleFont = url.fileURLToPath(new URL('../fonts/dejavu-sans-bold.ttf', import.meta.url));
            if (fs.existsSync(moduleFont)) {
                localRepoFont = moduleFont;
            }
        }
    }
    catch (_) { }
}
function getLocalRepoFont() {
    return localRepoFont;
}
const buggyDiags = (command, format, outputFile) => {
    const font = getLocalRepoFont();
    const redirectingDiag = true;
    if (redirectingDiag) {
        return [
            `${command}`,
            '-a',
            `-T${format}`,
            '-f',
            font !== null && font !== void 0 ? font : 'fonts/dejavu-sans-bold.ttf',
            '-',
            `-o${outputFile}`
        ];
    }
    else {
        return [
            'sh',
            '-c',
            `cat -| /usr/bin/${command}3 -a -T${format} -f${font !== null && font !== void 0 ? font : 'fonts/dejavu-sans-bold.ttf'} -o/dev/stdout /dev/stdin|cat`
        ];
    }
};
const _visualizations = [
    new Visualization('dot', 'Graphviz: dot (Hierarchical)', 'digraph', async (g) => {
        await visualizeGraphviz(g, 'dot');
    }, (format) => [
        'dot',
        '-q',
        `-T${format}`
    ], { family: 'Graphviz', engine: 'dot', description: 'Hierarchical DAG layout' }),
    new Visualization('fdp', 'Graphviz: fdp (Force-directed)', 'digraph', async (g) => {
        await visualizeGraphviz(g, 'fdp');
    }, (format) => [
        'fdp',
        '-q',
        `-T${format}`
    ], { family: 'Graphviz', engine: 'fdp', description: 'Force-directed spring model' }),
    new Visualization('neato', 'Graphviz: neato (Spring model)', 'digraph', async (g) => {
        await visualizeGraphviz(g, 'neato');
    }, (format) => [
        'neato',
        '-q',
        `-T${format}`
    ], { family: 'Graphviz', engine: 'neato', description: 'Spring model layout' }),
    new Visualization('osage', 'Graphviz: osage (Pack array)', 'digraph', async (g) => {
        await visualizeGraphviz(g, 'osage');
    }, (format) => [
        'osage',
        '-q',
        `-T${format}`
    ], { family: 'Graphviz', engine: 'osage', description: 'Array/pack clustered layout' }),
    new Visualization('twopi', 'Graphviz: twopi (Radial)', 'digraph', async (g) => {
        await visualizeGraphviz(g, 'twopi');
    }, (format) => [
        'twopi',
        '-q',
        `-T${format}`
    ], { family: 'Graphviz', engine: 'twopi', description: 'Radial layout' }),
    new Visualization('sfdp', 'Graphviz: sfdp [CLI]', 'digraph', undefined, (format) => [
        'sfdp',
        '-q',
        `-T${format}`
    ], { family: 'Graphviz', engine: 'sfdp', description: 'Scalable force-directed (CLI only)' }),

    new Visualization('reingoldtilford', 'D3.js: Reingold-Tilford (Tree)', 'dendrogram', visualizeReingoldTilford, undefined, { family: 'D3.js', engine: 'Reingold-Tilford', description: 'Tidy tree hierarchy' }),
    new Visualization('radialdendrogram', 'D3.js: Radial Dendrogram', 'dendrogram', visualizeRadialDendrogram, undefined, { family: 'D3.js', engine: 'Radial Dendrogram', description: 'Radial circular tree' }),
    new Visualization('circlepacked', 'D3.js: Circle Packed', 'dendrogram', visualizeCirclePacked, undefined, { family: 'D3.js', engine: 'Circle Packed', description: 'Nested enclosure circles' }),
    new Visualization('sankey', 'D3.js: Sankey (Flow)', 'sankey', visualizeSankey, undefined, { family: 'D3.js', engine: 'Sankey', description: 'Flow and distribution diagram' }),

    new Visualization('umlclass', 'GoJS: UML Class Diagram', 'umlclass', visualizeUmlClass, undefined, { family: 'GoJS', engine: 'UMLClass', description: 'Class hierarchy and methods' }),
    new Visualization('layerbands', 'GoJS: LayerBands (Swimlanes)', 'layerbands', visualizeLayerBands, undefined, { family: 'GoJS', engine: 'LayerBands', description: 'Layered swimlane bands' }),
    new Visualization('parsetree', 'GoJS: ParseTree', 'parsetree', visualizeParseTree, undefined, { family: 'GoJS', engine: 'ParseTree', description: 'Visual parse tree' }),

    new Visualization('mscgen', 'MSCGen: Message Sequence Chart', 'mscgen', visualizeMscGen, (format) => [
        'mscgen',
        '-i-',
        '-o-',
        `-T${format}`
    ], { family: 'MSCGen', engine: 'mscgenjs', description: 'Message Sequence Chart' }),

    new Visualization('native_sequence', 'Diagrammer: Native Sequence [WASM]', 'native_sequence', visualizeNativeSequence, undefined, { family: 'Diagrammer Native', engine: 'Rust Layout Engine', description: 'First-party zero-dependency vector sequence diagram' }),

    new Visualization('actdiag', 'Blockdiag: Activity Diagram [CLI]', 'actdiag', undefined, (format, outputFile) => buggyDiags('actdiag', format, outputFile !== null && outputFile !== void 0 ? outputFile : '-'), { family: 'Blockdiag', engine: 'actdiag', description: 'Activity diagram (Python CLI)' }),
    new Visualization('blockdiag', 'Blockdiag: Block Diagram [CLI]', 'blockdiag', undefined, (format, outputFile) => buggyDiags('blockdiag', format, outputFile !== null && outputFile !== void 0 ? outputFile : '-'), { family: 'Blockdiag', engine: 'blockdiag', description: 'Block diagram (Python CLI)' }),
    new Visualization('nwdiag', 'Blockdiag: Network Diagram [CLI]', 'nwdiag', undefined, (format, outputFile) => buggyDiags('nwdiag', format, outputFile !== null && outputFile !== void 0 ? outputFile : '-'), { family: 'Blockdiag', engine: 'nwdiag', description: 'Network diagram (Python CLI)' }),
    new Visualization('seqdiag', 'Blockdiag: Sequence Diagram [CLI]', 'seqdiag', undefined, (format, outputFile) => buggyDiags('seqdiag', format, outputFile !== null && outputFile !== void 0 ? outputFile : '-'), { family: 'Blockdiag', engine: 'seqdiag', description: 'Sequence diagram (Python CLI)' }),

    new Visualization('plantuml_sequence', 'PlantUML: Sequence Diagram [CLI]', 'plantuml_sequence', undefined, (format) => [
        'java',
        '-Djava.awt.headless=true',
        '-Xmx2048m',
        '-jar',
        'ext/plantuml.jar',
        `-t${format.toLocaleLowerCase()}`,
        '-p'
    ], { family: 'PlantUML', engine: 'plantuml.jar', description: 'PlantUML sequence diagram (Java CLI)' }),

    new Visualization('mermaid', 'Mermaid: Flowchart', 'mermaid', async (g) => {
        await visualizeMermaid(g);
    }, undefined, { family: 'Mermaid', engine: 'mermaid.js (Flowchart)', description: 'Mermaid flowchart in-browser' }),

    new Visualization('mermaid_state', 'Mermaid: State Diagram', 'mermaid_state', async (g) => {
        await visualizeMermaid(g);
    }, undefined, { family: 'Mermaid', engine: 'mermaid.js (State Diagram)', description: 'Mermaid state diagram in-browser' }),

    new Visualization('mermaid_class', 'Mermaid: Class Diagram', 'mermaid_class', async (g) => {
        await visualizeMermaid(g);
    }, undefined, { family: 'Mermaid', engine: 'mermaid.js (Class Diagram)', description: 'Mermaid class diagram in-browser' }),

    new Visualization('mermaid_mindmap', 'Mermaid: Mindmap', 'mermaid_mindmap', async (g) => {
        await visualizeMermaid(g);
    }, undefined, { family: 'Mermaid', engine: 'mermaid.js (Mindmap)', description: 'Mermaid mindmap in-browser' }),

    new Visualization('mermaid_er', 'Mermaid: ER Diagram', 'mermaid_er', async (g) => {
        await visualizeMermaid(g);
    }, undefined, { family: 'Mermaid', engine: 'mermaid.js (ER)', description: 'Mermaid ER diagram in-browser' }),

    new Visualization('mermaid_sequence', 'Mermaid: Sequence Diagram', 'mermaid_sequence', async (g) => {
        await visualizeMermaid(g);
    }, (format) => [
        'mmdc',
        '-e png',
        '-i-',
        '-o-'
    ], { family: 'Mermaid', engine: 'mermaid.js (Sequence)', description: 'Mermaid sequence diagram in-browser' }),

    new Visualization('ast_record', 'AST: Record Visualizer', 'ast_record', async (g) => {
        await visualizeGraphviz(g, 'dot');
    }, undefined, { family: 'AST', engine: 'Graphviz Record', description: 'Abstract Syntax Tree structure' }),
    new Visualization('ast', 'AST: JSON Only', 'ast', undefined, undefined, { family: 'AST', engine: 'Raw JSON', description: 'Abstract Syntax Tree JSON' })
];
export let visualizations = _visualizations;
export function setVisualizationsForTests(testVisualizations) {
    visualizations = testVisualizations;
}
export function resetVisualizationsForTests() {
    visualizations = _visualizations;
}
export function visualizationsToGenerators() {
    return new Map(visualizations.map((p) => {
        return [p.name.replace('_', ''), p.generator.toLowerCase()];
    }));
}
export function findGeneratorForVisualization(visualization) {
    const generator = visualizationsToGenerators().get(visualization.toLocaleLowerCase().replace('_', ''));
    if (!generator) {
        throw Error(`Cannot map visualizer (${visualization}) to a generator`);
    }
    return generator;
}
export function hasGenerator(generator) {
    return visualizations.some((p) => p.generator.toLowerCase() === generator.replace('_', '').toLowerCase());
}
export function hasVisualizer(visualizer) {
    return visualizations.some((p) => p.name.toLocaleLowerCase() === visualizer.toLowerCase());
}
