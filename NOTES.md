# Developer & Architectural Notes (NOTES.md)

This document collects critical technical findings, architectural details, gotchas, and documentation corrections discovered from analyzing the codebase that are missing from or inaccurate in the existing markdown files ([README.md](file:///Users/ede/src/diagrammer/README.md), [AGENTS.md](file:///Users/ede/src/diagrammer/AGENTS.md), [DEVELOPMENT.md](file:///Users/ede/src/diagrammer/DEVELOPMENT.md), [TESTING.md](file:///Users/ede/src/diagrammer/TESTING.md), and [DOCKER.md](file:///Users/ede/src/diagrammer/DOCKER.md)).

---

## 1. Documentation Corrections & Errata

| Document | Statement in Existing Doc | Actual Reality / Fix | Impact |
| :--- | :--- | :--- | :--- |
| [AGENTS.md](file:///Users/ede/src/diagrammer/AGENTS.md), [TESTING.md](file:///Users/ede/src/diagrammer/TESTING.md) | `scripts/runtests.js [visualizer:testPattern]` | Script is at [`js/runtests.js`](file:///Users/ede/src/diagrammer/js/runtests.js) (or `node js/runtests.js`). `scripts/runtests.js` does **not** exist. | Direct command fails with `No such file or directory`. |
| [AGENTS.md](file:///Users/ede/src/diagrammer/AGENTS.md), [DEVELOPMENT.md](file:///Users/ede/src/diagrammer/DEVELOPMENT.md) | `node js/generate.js tests/test_inputs/state13.txt seqdiag` | [`tests/test_inputs/state13.txt`](file:///Users/ede/src/diagrammer/tests/test_inputs) does **not** exist. Use [`tests/test_inputs/state.txt`](file:///Users/ede/src/diagrammer/tests/test_inputs/state.txt) or [`state_sequence.txt`](file:///Users/ede/src/diagrammer/tests/test_inputs/state_sequence.txt). | Command fails on first run. |
| [AGENTS.md](file:///Users/ede/src/diagrammer/AGENTS.md), [DEVELOPMENT.md](file:///Users/ede/src/diagrammer/DEVELOPMENT.md) | `node js/visualize.js [INPUT] [VISUALIZER]` | Historically, `visualize.js` passed raw source code directly to CLI tools without transpiling it first. This is now fixed in the stack: `visualize.js` transpiles via `doParse` before running CLI visualizers (e.g. `node js/visualize.js tests/test_inputs/state.txt dot output /tmp/out.png`). [`node js/t.js [INPUT] [VISUALIZER] output [OUT.PNG]`](file:///Users/ede/src/diagrammer/js/t.js) is also available. | CLI visualizers receive properly transpiled definitions. |
| [AGENTS.md](file:///Users/ede/src/diagrammer/AGENTS.md), [TESTING.md](file:///Users/ede/src/diagrammer/TESTING.md) | `npm test` runs all tests | `npm test` runs Jest, but web Puppeteer tests depend on [`web/miniserver.js`](file:///Users/ede/src/diagrammer/web/miniserver.js) running. Running `npm test` alone causes connection errors (`ERR_CONNECTION_REFUSED`). Use `make -C tests jesttests` (spawns and terminates server automatically). | Web tests fail unless server is running. |
| [README.md](file:///Users/ede/src/diagrammer/README.md) (line 407) | `web/ - PHP Web Backend` | Modern backend is pure Node.js ([`web/miniserver.js`](file:///Users/ede/src/diagrammer/web/miniserver.js)). PHP scripts in `web/` are legacy. | Developers may look for Apache/PHP runtime unnecessarily. |

---

## 2. CLI Input File Validation

In earlier versions of [`js/generate.js`](file:///Users/ede/src/diagrammer/js/generate.js) and [`js/visualize.js`](file:///Users/ede/src/diagrammer/js/visualize.js), when an input file did not exist, the parser fell through and mistakenly attempted to treat the missing filename as a visualizer name:
```text
Error: Unknown visualizer (non_existent_file.txt)
```
This is now resolved in the stack (`fix_cli_missing_file_error` layer): missing input files are caught immediately and report:
```text
Error: Input file not found (non_existent_file.txt)
```

---

## 3. Architecture & Build System Mechanics

### 3.1 `index.html` is a Generated File
- [`index.html`](file:///Users/ede/src/diagrammer/index.html) is **generated** from [`index_template.html`](file:///Users/ede/src/diagrammer/index_template.html) during `make all` / `make index.html`.
- The [`Makefile`](file:///Users/ede/src/diagrammer/Makefile#L57-L59) uses an `awk` rule to dynamically replace:
  - `{REPLACE_WITH_TEST_EXAMPLES}` with `<option>` tags scanned from [`tests/test_inputs/*.txt`](file:///Users/ede/src/diagrammer/tests/test_inputs).
  - `{REPLACE_WITH_WEB_VISUALIZATION_MODULES}` with `<script type="module" src="...">` tags for each file in [`web/visualizations/*.ts`](file:///Users/ede/src/diagrammer/web/visualizations).
- **Rule**: Never edit [`index.html`](file:///Users/ede/src/diagrammer/index.html) directly; always edit [`index_template.html`](file:///Users/ede/src/diagrammer/index_template.html).

### 3.2 Parser Assembly & ES Module Wrapping
Jison natively outputs CommonJS, but the project is configured as `"type": "module"` in [`package.json`](file:///Users/ede/src/diagrammer/package.json):
1. [`grammar/Makefile`](file:///Users/ede/src/diagrammer/grammar/Makefile) concatenates `diagrammer.lex`, `lexmarker.txt`, and `diagrammer.grammar` into `build/diagrammer.all`.
2. [`Makefile`](file:///Users/ede/src/diagrammer/Makefile#L90-L126) runs `jison build/diagrammer.all -o build/diagrammer_parser.js`.
3. Post-build sed commands inject static ES module imports for all classes in [`generators/*.js`](file:///Users/ede/src/diagrammer/generators) and [`model/*.js`](file:///Users/ede/src/diagrammer/model), rewrite `var diagrammer_parser` to `export var diagrammerParser`, export the helper `parse()`, and create `build/package.json` with `{"type":"module"}`.
4. Parsing and code generation are tightly coupled: calling `diagrammerParser.parse(code)` initializes [`GraphCanvas`](file:///Users/ede/src/diagrammer/model/graphcanvas.ts), constructs the AST, resolves the appropriate generator via [`makeGenerator()`](file:///Users/ede/src/diagrammer/js/config.ts#L189), runs `generator.generate()`, and feeds output to `yy.result`.

### 3.3 In-Place TypeScript Compilation
- There is no single `dist/` or `outDir`.
- TypeScript is transpiled in-place (`.ts` -> `.js`) using `tsc` within each directory ([`model/`](file:///Users/ede/src/diagrammer/model), [`generators/`](file:///Users/ede/src/diagrammer/generators), [`js/`](file:///Users/ede/src/diagrammer/js), [`web/`](file:///Users/ede/src/diagrammer/web), [`tests/`](file:///Users/ede/src/diagrammer/tests)).
- Compilation options in [`Makefile.commands`](file:///Users/ede/src/diagrammer/Makefile.commands):
  ```makefile
  TRANSPILEOPTIONS=--module es6 --esModuleInterop --target es2017 --allowJs --removeComments --strict --checkJs --skipLibCheck
  ```

### 3.4 Dual Runtime: Node.js and Browser ESM
Files in [`js/config.ts`](file:///Users/ede/src/diagrammer/js/config.ts), [`model/`](file:///Users/ede/src/diagrammer/model), [`generators/`](file:///Users/ede/src/diagrammer/generators), and [`web/visualizations/`](file:///Users/ede/src/diagrammer/web/visualizations) are loaded both in Node.js (CLI, tests) and in the browser (via `<script type="importmap">` in [`index.html`](file:///Users/ede/src/diagrammer/index.html)):
- Static imports of Node built-ins (`fs`, `path`) would crash the browser module loader.
- Files needing Node APIs must use guarded checks (`if (typeof window !== 'undefined')`) or dynamic imports (`(await import('fs')).default`).

---

## 4. Visualizers & Backend Matrix

The system maps visualizer targets to generators in [`js/config.ts`](file:///Users/ede/src/diagrammer/js/config.ts). Not all visualizers run purely in the browser:

| Visualizer Name | Menu Label | Generator Class | Runtime Execution Mode | Prerequisites |
| :--- | :--- | :--- | :--- | :--- |
| `dot`, `neato`, `fdp`, `twopi`, `osage` | Graphviz (*cli/www*) | `DiGraph` | Client (Viz.js) **or** CLI binary (`dot`, `neato`, etc.) | Host Graphviz binary for CLI |
| `sfdp` | Graphviz sfdp (*cli*) | `DiGraph` | CLI binary only | Graphviz `sfdp` binary |
| `ast_record` | AST Record | `ASTRecord` | Client (Viz.js) **or** CLI binary | — |
| `ast` | AST (JSON only) | `AST` | Text/JSON dump | — |
| `mscgen` | MSCGen (*cli/www*) | `MSCGen` | Client (mscgenjs) **or** CLI binary | Host `mscgen` binary for CLI |
| `plantuml_sequence` | PlantUML Seq (*cli*) | `PlantUMLSequence` | CLI via Java sub-process | JRE + [`ext/plantuml.jar`](file:///Users/ede/src/diagrammer/ext) |
| `mermaid_sequence` | Mermaid Seq (*cli*) | `MermaidSequence` | CLI via `mmdc` | `@mermaid-js/mermaid-cli` |
| `actdiag` | Activity Diagram (*cli*) | `ActDiag` | CLI via Python script | Python package `actdiag` |
| `blockdiag` | Block Diagram (*cli*) | `BlockDiag` | CLI via Python script | Python package `blockdiag` |
| `nwdiag` | Network Diagram (*cli*) | `NWDiag` | CLI via Python script | Python package `nwdiag` |
| `seqdiag` | Sequence Diagram (*cli*) | `SeqDiag` | CLI via Python script | Python package `seqdiag` |
| `circlepacked` | Circle packed | `Dendrogram` | In-Browser (D3.js SVG) | Browser UI / Puppeteer |
| `radialdendrogram` | Radial Dendrogram | `Dendrogram` | In-Browser (D3.js SVG) | Browser UI / Puppeteer |
| `reingoldtilford` | Reingold-Tilford | `Dendrogram` | In-Browser (D3.js SVG) | Browser UI / Puppeteer |
| `sankey` | Sankey | `Sankey` | In-Browser (D3.js + d3-sankey SVG) | Browser UI / Puppeteer |
| `layerbands` | LayerBands | `LayerBands` | In-Browser (GoJS Canvas) | Browser UI / Puppeteer |
| `parsetree` | ParseTree | `ParseTree` | In-Browser (GoJS Canvas) | Browser UI / Puppeteer |
| `umlclass` | UMLClass | `UMLClass` | In-Browser (GoJS Canvas) | Browser UI / Puppeteer |

When a CLI-only visualizer is selected in the browser UI, the browser makes an AJAX POST to `/visualize?visualizer=<name>` on [`web/miniserver.js`](file:///Users/ede/src/diagrammer/web/miniserver.js), which invokes [`doCliVisualize()`](file:///Users/ede/src/diagrammer/js/clivisualize.ts) and streams back a base64-encoded PNG image.

---

## 5. Undocumented Language Features

Several grammar features exist in [`grammar/diagrammer.grammar`](file:///Users/ede/src/diagrammer/grammar/diagrammer.grammar) but are omitted from [README.md](file:///Users/ede/src/diagrammer/README.md):

### 5.1 Loop Constructs
In addition to `if ... elseif ... else ... endif`, the grammar parses loops into [`GraphLoop`](file:///Users/ede/src/diagrammer/model/graphloop.ts):
```text
while condition
  task_a > task_b
endwhile

do
  step_1 > step_2
until loop_condition_met
```

### 5.2 Canvas & Container Directives
- `VISUALIZER <name>`: Embeds preferred visualizer target inside diagram code (e.g. `visualizer seqdiag`). The parser checks this against `yy.PREFER_VISUALIZER_FROM_DIAGRAMMER`.
- `LANDSCAPE` / `PORTRAIT`: Sets canvas drawing direction.
- `START <vertex>`: Explicitly declares the starting root vertex.
- Container color defaults:
  - `VERTEX_COLOR <color|$(var)>`
  - `VERTEXTEXT_COLOR <color|$(var)>`
  - `EDGE_COLOR <color|$(var)>`
  - `EDGETEXT_COLOR <color|$(var)>`
  - `GROUP_COLOR <color|$(var)>`

---

## 6. Testing & Regression Harness Details

1. **Jest + Puppeteer Workflow**:
   - Web UI integration tests in [`tests/web/rendering.test.ts`](file:///Users/ede/src/diagrammer/tests/web/rendering.test.ts) launch headless Chromium, navigate to `http://localhost:<MINISERVER_TEST_PORT>`, type diagram DSL into the ACE editor, trigger parsing, and snapshot canvas/SVG DOM elements.
   - Always run via `make -C tests jesttests`, which binds `web/miniserver.js 8999` and sets `MINISERVER_TEST_PORT=8999`.

2. **Regression Runner ([`js/runtests.ts`](file:///Users/ede/src/diagrammer/js/runtests.ts))**:
   - Takes optional regex filter: `node js/runtests.js [visualizer:pattern]` (e.g. `node js/runtests.js dot:state_tcp`).
   - Parses each diagram in [`tests/test_inputs/`](file:///Users/ede/src/diagrammer/tests/test_inputs), saves output in `tests/testrun/current/`, and compares with `tests/testrun/previous/` using `diffJson`, `diffChars`, or `diffLines`.
   - Compares generated PNGs with baseline PNGs using `pixelmatch`.
   - Uses the `images` npm library to normalize/resize images prior to diffing to reduce font/DPI discrepancies across OS platforms.

3. **External Dependencies for Full Test Suite**:
   - [`ext/plantuml.jar`](file:///Users/ede/src/diagrammer/ext) (gitignored; required for PlantUML tests).
   - Local font [`fonts/DejaVuSans.ttf`](file:///Users/ede/src/diagrammer/fonts/DejaVuSans.ttf) is used by Python `*diag` tools to prevent font substitution mismatch.
