# TESTING.md

## Purpose
This document describes the test workflows and suites for the `diagrammer` project.

## Quick Test Commands

- **Run Rust unit & parity tests**:
  ```bash
  cargo test --manifest-path crates/diagrammer-core/Cargo.toml
  ```
- **Run browser visual snapshot & regression tests**:
  ```bash
  make -C tests jesttests
  ```
- **Run full test suite (Rust tests + browser tests)**:
  ```bash
  make test
  ```

---

## Test Suites

### 1. Rust Core Unit & Golden Parity Tests (`crates/diagrammer-core`)
Located in [`crates/diagrammer-core/`](file:///Users/ede/src/diagrammer/crates/diagrammer-core):
- **Unit Tests** ([`src/lib.rs`](file:///Users/ede/src/diagrammer/crates/diagrammer-core/src/lib.rs)): Validates PEG grammar parsing, edge directions, vertex shapes, and group container broadcasting.
- **AST Golden Parity Tests** ([`tests/ast_parity.rs`](file:///Users/ede/src/diagrammer/crates/diagrammer-core/tests/ast_parity.rs)): Validates that Pest PEG parser produces serialized AST JSON identical to baseline fixtures across all 53 language test inputs.
- **Generator Parity Tests** ([`tests/generator_parity.rs`](file:///Users/ede/src/diagrammer/crates/diagrammer-core/tests/generator_parity.rs)): Validates that all 12 generator backends (`dot`, `seqdiag`, `actdiag`, `blockdiag`, `nwdiag`, `mscgen`, `plantuml_sequence`, `dendrogram`, `sankey`, `layerbands`, `parsetree`, `umlclass`) produce exact matching output across regression test inputs.

Run via:
```bash
cargo test --manifest-path crates/diagrammer-core/Cargo.toml
```

### 2. Browser Visual Snapshot & UI Tests (`tests/web`)
Located in [`tests/web/`](file:///Users/ede/src/diagrammer/tests/web):
- Uses Jest and Puppeteer in headless Chrome.
- Automatically launches the embedded Rust dev server (`./diagrammer serve 8999`) for test isolation and terminates it when complete.
- **Visual Snapshot Tests** ([`tests/web/rendering.test.js`](file:///Users/ede/src/diagrammer/tests/web/rendering.test.js)): Renders diagrams in Chrome and performs pixel-by-pixel image comparisons with reference PNGs in [`tests/web/snapshots/`](file:///Users/ede/src/diagrammer/tests/web/snapshots) (CirclePacked, RadialDendrogram, ReingoldTilford, Sankey, LayerBands, ParseTree, UMLClass).
- **LocalStorage & UI Tests** ([`tests/web/localstorage.test.js`](file:///Users/ede/src/diagrammer/tests/web/localstorage.test.js)): Verifies local diagram saving, loading, importing, and exporting.

Run via:
```bash
make -C tests jesttests
```

---

## Targeted CLI Checks

To verify generator output directly from the command line:
```bash
# Output generated visualizer code
./diagrammer dot tests/test_inputs/state.txt
./diagrammer seqdiag tests/test_inputs/state.txt

# Render visual image output
./diagrammer dot tests/test_inputs/state.txt -o /tmp/out.png
```

---

## Test Directory Structure

- [`tests/package.json`](file:///Users/ede/src/diagrammer/tests/package.json) — Isolated npm dependencies for Jest, Puppeteer, and pixelmatch.
- [`tests/jest.config.js`](file:///Users/ede/src/diagrammer/tests/jest.config.js) — Jest configuration.
- [`tests/test_inputs/`](file:///Users/ede/src/diagrammer/tests/test_inputs) — Diagrammer test scripts and grammar test files.
- [`tests/web/snapshots/`](file:///Users/ede/src/diagrammer/tests/web/snapshots) — Reference snapshot PNGs for visual comparisons.
- [`tests/Makefile`](file:///Users/ede/src/diagrammer/tests/Makefile) — Test runner orchestration.
