# Developer & Architectural Notes (NOTES.md)

This document collects critical technical findings, architectural details, gotchas, and documentation corrections discovered from analyzing the codebase that are missing from or inaccurate in the existing markdown files ([README.md](file:///Users/ede/src/diagrammer/README.md), [AGENTS.md](file:///Users/ede/src/diagrammer/AGENTS.md), [DEVELOPMENT.md](file:///Users/ede/src/diagrammer/DEVELOPMENT.md), and [TESTING.md](file:///Users/ede/src/diagrammer/TESTING.md)).

---

## 1. Documentation Corrections & Errata

| Document | Statement in Existing Doc | Actual Reality / Fix | Impact |
| :--- | :--- | :--- | :--- |
| [AGENTS.md](file:///Users/ede/src/diagrammer/AGENTS.md), [TESTING.md](file:///Users/ede/src/diagrammer/TESTING.md) | `scripts/runtests.js [visualizer:testPattern]` | Legacy JS test runner was replaced. Run Rust tests via `cargo test --manifest-path crates/diagrammer-core/Cargo.toml` and browser tests via `make -C tests jesttests`. | No Node CLI test runner needed. |
| [AGENTS.md](file:///Users/ede/src/diagrammer/AGENTS.md), [DEVELOPMENT.md](file:///Users/ede/src/diagrammer/DEVELOPMENT.md) | `node js/generate.js tests/test_inputs/state13.txt seqdiag` | Legacy `js/` directory was completely eliminated. Use the native Rust CLI `./diagrammer seqdiag tests/test_inputs/state.txt`. | Direct, native fast CLI execution. |
| [AGENTS.md](file:///Users/ede/src/diagrammer/AGENTS.md), [TESTING.md](file:///Users/ede/src/diagrammer/TESTING.md) | `npm test` runs all tests | `npm test` runs headless Jest browser tests against the dev server (`./diagrammer serve 8999`). Use `make -C tests jesttests` which handles server lifecycle automatically. | Full visual snapshot and browser regression testing. |
| [README.md](file:///Users/ede/src/diagrammer/README.md) | `web/ - PHP Web Backend` | The web UI is a zero-build client app using browser ES modules and WebAssembly (`build/wasm`). Dev server is native Rust (`./diagrammer serve`). | No Apache/PHP or Node server runtime needed. |

---

## 2. CLI Execution & Tooling

The legacy Node CLI scripts (`js/`) and compiler scripts (`export/`) have been completely eliminated and replaced by the native Rust `diagrammer` binary:
- **Parse & generate output**:
  ```bash
  ./diagrammer [VISUALIZER] [INPUT_FILE]
  echo 'a>b>c' | ./diagrammer dot
  ```
- **Direct image visualization**:
  ```bash
  ./diagrammer dot tests/test_inputs/state.txt -o out.png
  echo 'a>b>c' | ./diagrammer dot -o /tmp/out.png
  ```
- **Embedded Dev HTTP Server**:
  ```bash
  ./diagrammer serve [port]   # defaults to 8000
  ```

---

## 3. Architecture & Build System Mechanics

### 3.1 `index.html` is a Generated File
- [`index.html`](file:///Users/ede/src/diagrammer/index.html) is **generated** from [`index_template.html`](file:///Users/ede/src/diagrammer/index_template.html) during `make all` / `make index.html`.
- The [`Makefile`](file:///Users/ede/src/diagrammer/Makefile) uses an `awk` rule to dynamically replace:
  - `{REPLACE_WITH_TEST_EXAMPLES}` with `<option>` tags scanned from [`tests/test_inputs/*.txt`](file:///Users/ede/src/diagrammer/tests/test_inputs).
  - `{REPLACE_WITH_WEB_VISUALIZATION_MODULES}` with `<script type="module" src="...">` tags for each file in [`web/visualizations/visualize*.js`](file:///Users/ede/src/diagrammer/web/visualizations).
- **Rule**: Never edit [`index.html`](file:///Users/ede/src/diagrammer/index.html) directly; always edit [`index_template.html`](file:///Users/ede/src/diagrammer/index_template.html).

### 3.2 100% Rust Core & WebAssembly
- The entire parsing layer, AST data models, and all 13 generators are unified in Rust (`crates/diagrammer-core`):
  - **Pest PEG Grammar**: [`diagrammer.pest`](file:///Users/ede/src/diagrammer/crates/diagrammer-core/src/diagrammer.pest)
  - **AST Model**: [`ast/`](file:///Users/ede/src/diagrammer/crates/diagrammer-core/src/ast)
  - **AST Builder**: [`builder.rs`](file:///Users/ede/src/diagrammer/crates/diagrammer-core/src/builder.rs)
  - **Generators**: [`generators/`](file:///Users/ede/src/diagrammer/crates/diagrammer-core/src/generators)
- Compiles natively to `./diagrammer` and to WebAssembly via `wasm-pack build --target web --no-typescript` into `build/wasm`.
- Passes 100% of the 53 AST reference parity fixtures and 12 generator parity tests.

### 3.3 Zero-Build ES Modules
- The web frontend (`web/` and `web/visualizations/`) and web test suites (`tests/web/`) are written in native standard ES Modules (`.js`).
- No TypeScript compiler (`tsc`) step is required to build or serve the application.
- The browser loads `build/wasm/diagrammer_core.js` and standard ESM modules directly.

---

## 4. Visualizers & Backend Matrix

Visualizer targets and generator mappings are configured in [`web/config.js`](file:///Users/ede/src/diagrammer/web/config.js):

| Visualizer Name | Menu Label | Generator | Runtime Execution Mode | Prerequisites |
| :--- | :--- | :--- | :--- | :--- |
| `dot`, `neato`, `fdp`, `twopi`, `osage` | Graphviz (*cli/www*) | `dot` | Client (Viz.js) **or** CLI binary (`dot`, `neato`, etc.) | Host Graphviz binary for CLI |
| `sfdp` | Graphviz sfdp (*cli*) | `dot` | CLI binary only | Graphviz `sfdp` binary |
| `ast_record` | AST Record | `ast_record` | Client (Viz.js) **or** CLI binary | — |
| `ast` | AST (JSON only) | `ast` | Text/JSON dump | — |
| `mscgen` | MSCGen (*cli/www*) | `mscgen` | Client (mscgenjs) **or** CLI binary | Host `mscgen` binary for CLI |
| `plantuml_sequence` | PlantUML Seq (*cli*) | `plantuml_sequence` | CLI via Java sub-process | JRE + [`ext/plantuml.jar`](file:///Users/ede/src/diagrammer/ext) |
| `mermaid_sequence` | Mermaid Seq (*cli*) | `mermaid_sequence` | CLI via `mmdc` | `@mermaid-js/mermaid-cli` |
| `actdiag` | Activity Diagram (*cli*) | `actdiag` | CLI via Python script | Python package `actdiag` |
| `blockdiag` | Block Diagram (*cli*) | `blockdiag` | CLI via Python script | Python package `blockdiag` |
| `nwdiag` | Network Diagram (*cli*) | `nwdiag` | CLI via Python script | Python package `nwdiag` |
| `seqdiag` | Sequence Diagram (*cli*) | `seqdiag` | CLI via Python script | Python package `seqdiag` |
| `circlepacked` | Circle packed | `dendrogram` | In-Browser (D3.js SVG) | Browser UI / Puppeteer |
| `radialdendrogram` | Radial Dendrogram | `dendrogram` | In-Browser (D3.js SVG) | Browser UI / Puppeteer |
| `reingoldtilford` | Reingold-Tilford | `dendrogram` | In-Browser (D3.js SVG) | Browser UI / Puppeteer |
| `sankey` | Sankey | `sankey` | In-Browser (D3.js + d3-sankey SVG) | Browser UI / Puppeteer |
| `layerbands` | LayerBands | `layerbands` | In-Browser (GoJS Canvas) | Browser UI / Puppeteer |
| `parsetree` | ParseTree | `parsetree` | In-Browser (GoJS Canvas) | Browser UI / Puppeteer |
| `umlclass` | UMLClass | `umlclass` | In-Browser (GoJS Canvas) | Browser UI / Puppeteer |

When a CLI-only visualizer is selected in the browser UI, the browser makes an AJAX POST to `/visualize?visualizer=<name>` on `./diagrammer serve`, which executes the CLI tool and streams back the rendered output.

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

### 5.3 Grouping Semantics: Edge Broadcasting `()` vs Containment `{}`
- **`()` is purely Edge Distribution / Broadcasting syntactic sugar**:
  - `(a, b) > c` does **not** create a containment container, boundary box, or layout frame.
  - Nodes `a` and `b` remain wherever they were already declared in the canvas or hierarchy.
  - Follows strict commutative distribution rules:
    - `(a, b) > c` $\iff$ `a > c; b > c`
    - `c < (a, b)` $\iff$ `c < a; c < b` $\iff$ `a > c; b > c`
    - `(a, b) > (c, d)` $\iff$ `a > c; a > d; b > c; b > d`
  - The AST structure is preserved with zero breaking changes, expanding edges cleanly without creating unintended containment constraints.
- **`GROUP <name>` and `{ ... }` are Structural Containment**:
  - These define actual visual containers (`GraphGroup` / `GraphContainer`) with visual boundary frames, coordinate boundaries, and scoped defaults.


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

---

## 7. Known Issues & Resolved Fixes

- [x] **Anonymous group edge expansion `(b,c)>a` and `(b,c)<a` (RESOLVED)**:
  - **Issue**: Previously, LHS anonymous groups `(b,c)>a` produced `1->a;` and `(b,c)<a` produced `a->1;`.
  - **Fix**: In [`builder.rs`](file:///Users/ede/src/diagrammer/crates/diagrammer-core/src/builder.rs), `current_outgoing` now preserves the inner graph's member `roots` (instead of the group ID), and `elements[0].inner_edges` is retained before chain evaluation.
  - **Outcome**: Both forward and reverse group chaining expand completely and symmetrically:
    - `(b,c)>a` produces `subgraph cluster_1 { b; c; }` and `b->a; c->a;`
    - `(b,c)<a` produces `subgraph cluster_1 { b; c; }` and `a->b; a->c;` (fixing the legacy Jison bug where `c` was dropped)
    - Full cartesian chains like `(b,c)<(a,d)` link all 4 pairs: `a->b; d->b; a->c; d->c;`.
  - **Expected behavior** (from legacy Jison for `(b,c)>a`):
    ```dot
    digraph {
        compound=true;
        rankdir=TD;
        subgraph cluster_1 {
            graph[ style=invis ];
            b;
            c;
        }//end of 1 
        a;
        //links start
        b->a;
        c->a;
    }
    ```
  - **Expected behavior** (from legacy Jison for `(b,c)<a`):
    ```dot
    digraph {
        compound=true;
        rankdir=TD;
        subgraph cluster_1 {
            graph[ style=invis ];
            b;
            c;
        }//end of 1 
        a;
        //links start
        a->b;
        a->c;
    }
    ```

---

## 6. Full Rust Core & WebAssembly Migration

As of the final transition to Full Rust mode:
1. **Decommissioned Legacy Layers**:
   - `grammar/`: Legacy Jison parser and lexer removed.
   - `model/`: Legacy TypeScript model and GraphCanvas removed.
   - `generators/`: Legacy TypeScript generators removed.
   - `tests/generators/`, `tests/model/`, `tests/parser/`: Legacy TS unit tests retired in favor of native Rust unit and parity test suites.
2. **Unified Rust Core (`crates/diagrammer-core`)**:
   - Compiles natively to `diagrammer_pest_parse` CLI binary.
   - Compiles to WebAssembly (`build/wasm/diagrammer_core_bg.wasm`) with web-target bindings using `wasm-pack`.
   - Runs 100% client-side in the browser with zero server roundtrip for parsing/generation, and falls back to miniserver `/parse` if WebAssembly is not supported.
3. **Parity & Test Status**:
   - All 9 Rust unit tests pass.
   - Rust AST parity across all 53 test fixtures passes 100%.
   - Generator parity across all 12 generators passes 100%.
   - Jest / Puppeteer browser tests pass 100% (15/15 tests, 7/7 snapshots).
   - CLI generation and visualizer execution pass cleanly across all diagram formats.
