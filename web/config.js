import { visualizeCirclePacked } from './visualizations/visualizeCirclePacked.js';
import { visualizeGraphviz } from './visualizations/visualizeGraphviz.js';
import { visualizeLayerBands } from './visualizations/visualizeLayerBands.js';
import { visualizeMscGen } from './visualizations/visualizeMscGen.js';
import { visualizeParseTree } from './visualizations/visualizeParseTree.js';
import { visualizeRadialDendrogram } from './visualizations/visualizeRadialDendrogram.js';
import { visualizeReingoldTilford } from './visualizations/visualizeReingoldTilford.js';
import { visualizeSankey } from './visualizations/visualizeSankey.js';
import { visualizeUmlClass } from './visualizations/visualizeUmlClass.js';
export class Visualization {
    constructor(name, menuName, generator, visualization, cli) {
        this.name = name;
        this.menuName = menuName;
        this.generator = generator;
        this.visualization = visualization;
        this.cli = cli;
        this.webVisualizer = visualization !== undefined;
    }
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
    new Visualization('actdiag', 'Activity Diagram(cli)', 'actdiag', undefined, (format, outputFile) => buggyDiags('actdiag', format, outputFile !== null && outputFile !== void 0 ? outputFile : '-')),
    new Visualization('ast', 'AST(JSON only)', 'ast'),
    new Visualization('ast_record', 'Abstract Syntax Tree(Record)', 'ast_record', async (g) => {
        await visualizeGraphviz(g, 'dot');
    }),
    new Visualization('blockdiag', 'Block Diagram(cli)', 'blockdiag', undefined, (format, outputFile) => buggyDiags('blockdiag', format, outputFile !== null && outputFile !== void 0 ? outputFile : '-')),
    new Visualization('dot', 'Graphviz - dot(www/cli)', 'digraph', async (g) => {
        await visualizeGraphviz(g, 'dot');
    }, (format) => [
        'dot',
        '-q',
        `-T${format}`
    ]),
    new Visualization('fdp', 'Graphviz - fdp(www/cli)', 'digraph', async (g) => {
        await visualizeGraphviz(g, 'fdp');
    }, (format) => [
        'fdp',
        '-q',
        `-T${format}`
    ]),
    new Visualization('neato', 'Graphviz - neato(www/cli)', 'digraph', async (g) => {
        await visualizeGraphviz(g, 'neato');
    }, (format) => [
        'neato',
        '-q',
        `-T${format}`
    ]),
    new Visualization('osage', 'Graphviz - osage(www/cli)', 'digraph', async (g) => {
        await visualizeGraphviz(g, 'osage');
    }, (format) => [
        'osage',
        '-q',
        `-T${format}`
    ]),
    new Visualization('twopi', 'Graphviz - twopi(www/cli)', 'digraph', async (g) => {
        await visualizeGraphviz(g, 'twopi');
    }, (format) => [
        'twopi',
        '-q',
        `-T${format}`
    ]),
    new Visualization('sfdp', 'Graphviz - sfdp(cli)', 'digraph', undefined, (format) => [
        'sfdp',
        '-q',
        `-T${format}`
    ]),
    new Visualization('layerbands', 'LayerBands(GoJS)', 'layerbands', visualizeLayerBands),
    new Visualization('mscgen', 'MSCGen(www/cli)', 'mscgen', visualizeMscGen, (format) => [
        'mscgen',
        '-i-',
        '-o-',
        `-T${format}`
    ]),
    new Visualization('nwdiag', 'Network Diagram(cli)', 'nwdiag', undefined, (format, outputFile) => buggyDiags('nwdiag', format, outputFile !== null && outputFile !== void 0 ? outputFile : '-')),
    new Visualization('parsetree', 'ParseTree(GoJS)', 'parsetree', visualizeParseTree),
    new Visualization('circlepacked', 'Circle packed', 'dendrogram', visualizeCirclePacked),
    new Visualization('radialdendrogram', 'Radial Dendrogram', 'dendrogram', visualizeRadialDendrogram),
    new Visualization('reingoldtilford', 'Reingold-Tilford', 'dendrogram', visualizeReingoldTilford),
    new Visualization('plantuml_sequence', 'PlantUML Sequence Diagram(cli)', 'plantuml_sequence', undefined, (format) => [
        'java',
        '-Djava.awt.headless=true',
        '-Xmx2048m',
        '-jar',
        'ext/plantuml.jar',
        `-t${format.toLocaleLowerCase()}`,
        '-p'
    ]),
    new Visualization('mermaid_sequence', 'Mermain Sequence Diagram(cli)', 'mermaid_sequence', undefined, (format) => [
        'mmdc',
        '-e png',
        '-i-',
        '-o-'
    ]),
    new Visualization('sankey', 'Sankey', 'sankey', visualizeSankey),
    new Visualization('seqdiag', 'Sequence Diagram(cli)', 'seqdiag', undefined, (format, outputFile) => buggyDiags('seqdiag', format, outputFile !== null && outputFile !== void 0 ? outputFile : '-')),
    new Visualization('umlclass', 'UMLClass(GoJS)', 'umlclass', visualizeUmlClass)
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
