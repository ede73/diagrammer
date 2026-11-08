# DEVELOPMENT.md

## Purpose
This document describes how to set up, build, develop, and run `diagrammer`.

## Environment Setup

### Core Requirements
1. **Rust & Cargo** (1.70+):
   - Install via [rustup.rs](https://rustup.rs): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
2. **wasm-pack**:
   - Install via Cargo: `cargo install wasm-pack` (or use `npx wasm-pack`)
3. **Make** (standard build tool)

### Optional Setup
- **External CLI Visualizer Engines**: Run [`scripts/setup.sh`](file:///Users/ede/src/diagrammer/scripts/setup.sh) to interactively install optional external visualization tools (Graphviz, mscgen, PlantUML + Java, and Python blockdiag/nwdiag/actdiag/seqdiag).
- **Browser Regression Testing**: Test dependencies (Jest, Puppeteer) are strictly isolated to `tests/`. Run `make -C tests jest_test_deps` (or `cd tests && npm install`).

*Note: Zero Node.js runtime or npm dependencies are required to build or run the native Rust CLI or embedded web server.*

---

## Build Workflow

- **Full build** (Rust CLI binary, WebAssembly module, and web UI):
  ```bash
  make all
  ```
- **Build Rust core parser & generators only**:
  ```bash
  cargo build --release -p diagrammer-core
  ```
- **Build WebAssembly module only**:
  ```bash
  make wasm_pkg
  ```
- **Build web UI entry point only**:
  ```bash
  make web
  ```
- **Clean build artifacts**:
  ```bash
  make clean
  ```

---

## Runtime Workflows

### Browser / Web UI
1. Start the native embedded HTTP server:
   ```bash
   ./diagrammer serve 8000
   ```
2. Open in your browser:
   ```text
   http://localhost:8000/
   ```
3. The web UI executes the 100% Rust core entirely client-side via WebAssembly ([`build/wasm/diagrammer_core_bg.wasm`](file:///Users/ede/src/diagrammer/build/wasm)), with zero server roundtrips for parsing and code generation.
4. **Live Development & Zero-Build**:
   - Files in [`web/`](file:///Users/ede/src/diagrammer/web) are native ES modules and Vanilla CSS. Edits to `web/*.js` take effect immediately upon refreshing your browser without any compilation.
   - If editing Rust core or [`web/index_template.html`](file:///Users/ede/src/diagrammer/web/index_template.html), run `make watch` to automatically recompile via [`scripts/watch.sh`](file:///Users/ede/src/diagrammer/scripts/watch.sh) on file changes. Stop with `make stopwatch`.

### CLI Usage
- **Parse & generate generator code**:
  ```bash
  ./diagrammer [VISUALIZER] [INPUT_FILE]
  ./diagrammer seqdiag tests/test_inputs/state.txt
  ```
- **Pipe input from stdin**:
  ```bash
  echo 'a>b>c' | ./diagrammer dot
  ```
- **Direct image output visualization**:
  ```bash
  ./diagrammer dot tests/test_inputs/state.txt -o out.png
  echo 'a>b>c' | ./diagrammer dot -o /tmp/output.png
  ```

---

## Project Structure

- [`crates/diagrammer-core/`](file:///Users/ede/src/diagrammer/crates/diagrammer-core) — 100% Rust core:
  - Pest PEG grammar: [`src/diagrammer.pest`](file:///Users/ede/src/diagrammer/crates/diagrammer-core/src/diagrammer.pest)
  - AST model and builder: [`src/ast/`](file:///Users/ede/src/diagrammer/crates/diagrammer-core/src/ast), [`src/builder.rs`](file:///Users/ede/src/diagrammer/crates/diagrammer-core/src/builder.rs)
  - All 13 diagram generators: [`src/generators/`](file:///Users/ede/src/diagrammer/crates/diagrammer-core/src/generators)
  - Native CLI binary: [`src/bin/diagrammer.rs`](file:///Users/ede/src/diagrammer/crates/diagrammer-core/src/bin/diagrammer.rs)
- [`build/wasm/`](file:///Users/ede/src/diagrammer/build/wasm) — WebAssembly package compiled via `wasm-pack` with `--no-typescript`
- [`web/`](file:///Users/ede/src/diagrammer/web) — Zero-build web frontend:
  - Embedded Ace editor: [`web/ace/`](file:///Users/ede/src/diagrammer/web/ace)
  - Node types, icons, and arrows: [`web/types/`](file:///Users/ede/src/diagrammer/web/types), [`web/icons/`](file:///Users/ede/src/diagrammer/web/icons), [`web/arrows/`](file:///Users/ede/src/diagrammer/web/arrows)
  - Web visualizations: [`web/visualizations/`](file:///Users/ede/src/diagrammer/web/visualizations) (D3, GoJS, Viz.js, mscgen)
  - Master template and entry point: [`web/index_template.html`](file:///Users/ede/src/diagrammer/web/index_template.html), [`web/index.html`](file:///Users/ede/src/diagrammer/web/index.html)
- [`tests/`](file:///Users/ede/src/diagrammer/tests) — Test suite:
  - Diagram test inputs and fixtures: [`tests/test_inputs/`](file:///Users/ede/src/diagrammer/tests/test_inputs)
  - Browser Jest + Puppeteer visual snapshot tests: [`tests/web/`](file:///Users/ede/src/diagrammer/tests/web)
  - Isolated test dependencies: [`tests/package.json`](file:///Users/ede/src/diagrammer/tests/package.json)
- [`scripts/`](file:///Users/ede/src/diagrammer/scripts) — Developer utilities:
  - [`scripts/watch.sh`](file:///Users/ede/src/diagrammer/scripts/watch.sh) — Cross-platform file change watcher
  - [`scripts/setup.sh`](file:///Users/ede/src/diagrammer/scripts/setup.sh) — Environment and CLI visualizer installer
  - [`scripts/display_image.sh`](file:///Users/ede/src/diagrammer/scripts/display_image.sh) — Image viewer helper

---

## Recommended Development Flow

1. **Build the project**:
   ```bash
   make all
   ```
2. **Start the dev server**:
   ```bash
   ./diagrammer serve 8000
   ```
3. **Run Rust unit & parity tests**:
   ```bash
   cargo test --manifest-path crates/diagrammer-core/Cargo.toml
   ```
4. **Run browser regression & visual snapshot tests**:
   ```bash
   make -C tests jesttests
   ```
