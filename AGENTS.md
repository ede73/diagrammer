# AGENTS.md

## Purpose
This document describes the `diagrammer` repository layout, key entry points, and the exact commands you can use for build, run, and test workflows.

## Quick commands
- Install dependencies:
  - `npm install`
- Build the full project:
  - `make all`
- Build parser only:
  - `make parser`
- Run all tests:
  - `make test`
- Run Jest tests only:
  - `npm test`
- Clean build artifacts:
  - `make clean`
- Start the browser/web server:
  - `node web/miniserver.js [port]`
- Run CLI parse/generate:
  - `node js/generate.js [INPUT] [VISUALIZER]`
- Run CLI visualization via web-capable output:
  - `node js/visualize.js [INPUT] [VISUALIZER]`
- Run the image/graph regression test runner:
  - `scripts/runtests.js [visualizer:testPattern]`

## Main repo paths
- `package.json` — Node dependencies and `npm test`
- `Makefile` — top-level build rules; depends on subfolders and generated parser
- `README.md` — user-facing project overview and installation notes
- `tests/Makefile` — web and test runner orchestration
- `web/miniserver.js` — development web server for browser UI and web tests
- `js/generate.js` — CLI parser + transpiler entry for diagrammer source input
- `js/visualize.js` — CLI visualizer entrypoint
- `js/runtests.js` — end-to-end regression test runner comparing text and image output

## Core directories
- `grammar/` — Jison grammar and lexer source
- `model/` — AST/model implementation for parsed diagrams
- `generators/` — transpilers from diagrammer AST into external visualizer languages
- `js/` — runtime CLI helpers, parser integrations, and visualization support
- `web/` — browser UI, interactive editor, and web visualization support
- `tests/` — language inputs, reference outputs, regression infrastructure
- `build/` — generated parser/lexer outputs and build artifacts
- `scripts/` — auxiliary build/test/export utilities

## What to use first
For new work, follow this order:
1. `npm install`
2. `make all`
3. `node web/miniserver.js 8777`
4. open `http://localhost:8777/index.html`

For CLI-only checks:
1. `npm install`
2. `make parser`
3. `node js/generate.js tests/test_inputs/state13.txt seqdiag`

## Notes for agents
- If you need to modify or inspect parser behavior, start in `grammar/` and `js/diagrammer.js`.
- If you need to change output format, inspect `generators/`.
- If you need to update web UI behavior, inspect `web/` and `ace/`.
- If you need to add tests, inspect `tests/` and `js/runtests.js`.

## Helpful facts
- `make all` builds grammar, model, web assets, generators, and parser artifacts.
- `make test` runs `make all` before invoking tests.
- `npm test` invokes Jest directly via `node --experimental-vm-modules ./node_modules/.bin/jest`.
- `scripts/runtests.js` compares output text and graph images against stored baselines.
