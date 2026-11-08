# AGENTS.md

## Purpose
This document describes the `diagrammer` repository layout, key entry points, and the exact commands you can use for build, run, and test workflows.

## Quick commands
- Build the full project (Rust binary, WASM, web UI, CLI):
  - `make all`
- Build Rust core parser & generators only:
  - `cargo build --release -p diagrammer-core`
- Build WebAssembly module only:
  - `make wasm_pkg`
- Run Rust AST & generator parity tests:
  - `cargo test --manifest-path crates/diagrammer-core/Cargo.toml`
- Run all Jest browser tests (auto-installs test dependencies if needed):
  - `make -C tests jesttests`
- Clean build artifacts:
  - `make clean`
- Start the browser/web server:
  - `./diagrammer serve [port]` (defaults to 8000)
- Run native Rust CLI parse/generate:
  - `./diagrammer [VISUALIZER] [INPUT_FILE]` (or piped via stdin: `echo 'a>b' | ./diagrammer [VISUALIZER]`)
- Run native Rust CLI visualization to output image:
  - `echo 'a>b' | ./diagrammer dot -o out.png`
  - `./diagrammer dot tests/test_inputs/state.txt -o out.png`

## Main repo paths
- `Makefile` — top-level build rules; builds Rust core, WASM, CLI, and web UI (zero Node requirements)
- `README.md` — user-facing project overview and installation notes
- `tests/Makefile` — web and test runner orchestration
- `tests/package.json` — isolated test dependencies (Jest, Puppeteer)
- `diagrammer` — symlink to `./target/release/diagrammer` native Rust CLI binary

## Core directories
- `crates/diagrammer-core/` — 100% Rust core (Pest PEG grammar, AST model, and all 13 generators)
- `web/` — browser UI, interactive editor, Ace mode, WebAssembly integration, and web visualizations (zero-build ES modules)
- `tests/` — language inputs, reference outputs, browser Jest regression infrastructure
- `build/` — generated WASM packages and build artifacts
- `scripts/` — auxiliary build utilities

## What to use first
For new work, follow this order:
1. `make all`
2. `./diagrammer serve 8777`
3. open `http://localhost:8777/index.html`

For CLI-only checks:
1. `cargo build --release -p diagrammer-core`
2. `./diagrammer dot tests/test_inputs/state.txt`
3. `echo 'a>b>c' | ./diagrammer dot -o /tmp/out.png`

## Notes for agents
- If you need to modify parser or AST behavior, inspect `crates/diagrammer-core/src/parser.rs` and `builder.rs`.
- If you need to change output generator formats, inspect `crates/diagrammer-core/src/generators/`.
- If you need to update web UI behavior, inspect `web/` and `ace/`.
- If you need to test Rust core changes, run `cargo test --manifest-path crates/diagrammer-core/Cargo.toml`.
- If you need to test browser UI changes, run `make -C tests jesttests`.

## Helpful facts
- The core diagrammer parser and all 13 generators are 100% Rust (`crates/diagrammer-core`), compiled to WebAssembly for the browser and native binary for the CLI.
- No legacy Jison or TypeScript generators exist.
- `make all` compiles the native Rust CLI binary, builds WebAssembly via `wasm-pack`, and transpiles web TypeScript assets.
- `make -C tests jesttests` executes the full Puppeteer browser test suite against the local miniserver.
