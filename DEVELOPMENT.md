# DEVELOPMENT.md

## Purpose
This document describes how to set up, build, and run `diagrammer` for development.

## Environment setup
1. Install Node.js 18 (or newer as supported by `package.json`).
2. From the repo root, run:
   - `npm install`
3. If you want the local web backend and all integrations, inspect `scripts/setup.sh` and run:
   - `scripts/setup.sh`
4. For a self-contained test environment:
   - `scripts/setup.sh SELFTEST`

## Build workflow
- Full build:
  - `make all`
- Build only parser artifacts:
  - `make parser`
- Build the web assets and generators:
  - `make web`
- Build the test tree and support files:
  - `make -C tests`
- Clean workspace:
  - `make clean`

## Runtime workflows
### Browser / Web UI
1. Start the local server:
   - `node web/miniserver.js 8777`
2. Open in a browser:
   - `http://localhost:8777/index.html`
3. The browser UI uses the same parser/runtime as CLI and can be used to inspect diagrams interactively.

### CLI usage
- Parse and transpile a diagram file:
  - `node js/generate.js tests/test_inputs/state.txt seqdiag`
- Visualize a diagram through the CLI:
  - `node js/t.js tests/test_inputs/state.txt dot output /tmp/output.png`
- If piping input:
  - `cat file.txt | node js/generate.js - seqdiag`

## Project structure
- `grammar/` — Jison lexer/grammar source
- `model/` — internal AST and graph model implementation
- `generators/` — output generators for supported visualizers
- `js/` — runtime CLI helpers, parser integration, visualization
- `web/` — browser editor, UI logic, web renderer support
- `tests/` — regression inputs, outputs, and test harness
- `build/` — generated parser artifacts and build outputs
- `scripts/` — auxiliary build/test/export scripts

## Recommended development flow
1. `npm install`
2. `make all`
3. Edit code in `js/`, `model/`, `generators/`, or `web/`
4. Run a targeted CLI check:
   - `node js/generate.js tests/test_inputs/state_sequence.txt mscgen`
5. Run targeted tests or full regressions:
   - `make -C tests testrunner`
   - `make -C tests jesttests`

## Notes for contributors
- `build/diagrammer_parser.js` is generated from `grammar/diagrammer.grammar` and `make all`.
- `tests/` contains both JS/TS test code and reference regression fixtures.
- Browser/web integration uses `web/miniserver.js` plus `web/visualizations` modules.
- Always run `make test` after grammar/parser changes to validate both text and image output.
