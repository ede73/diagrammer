# Project Goals & Architectural Vision

This document captures the long-term vision, component architecture, and active milestone roadmap for the `diagrammer` project.

---

## 1. Primary Objectives

### 1.1 Eliminate Node.js & TypeScript Bloat
- **Problem**: The project historically relied on TypeScript transpilation (`tsc`), which pulls in Node.js, `npm`, large `node_modules` trees (Jest, Puppeteer, ts-node), and build-step friction.
- **Goal**: Because Diagrammer is a 100% Rust core compiled to WebAssembly and native binaries, Node.js is no longer a mandatory dependency. We have eliminated all TypeScript and Node runtime requirements from the build and web application. Only headless browser regression tests retain an isolated Node test runner in `tests/`.

### 1.2 Modularize into Independent Rust Library Crates
Restructure the project so that parsing, AST modeling, code generation, layout engines, and UI bindings are cleanly isolated library components with clear API boundaries:
1. **`diagrammer-parser`**: Grammar (Pest PEG) and lexing into CST/AST. Standalone parser library.
2. **`diagrammer-ast`**: Central graph model (`GraphCanvas`, `GraphVertex`, `GraphEdge`, `GraphGroup`).
3. **`diagrammer-generators`**: Target code transpilers (Graphviz DOT, MSCGen, PlantUML, Mermaid, JSON, etc.).
4. **`diagrammer-layout`**: First-party layout engines (Sequence, Hierarchical DAG, Tree, Force) producing vector SVG directly without external binaries.
5. **`diagrammer-cli`**: Native CLI application consuming the library for command-line parsing, generation, and direct SVG/image rendering.
6. **`diagrammer-wasm`**: Clean WebAssembly bindings (`wasm-bindgen`) for zero-build in-browser execution.

### 1.3 Unified Visualizer Pipeline (CLI & Web Parity)
- Visualizers operate identically across CLI and Web environments.
- Zero behavioral divergence between what is parsed/generated on the command line versus in the browser.
- **Piping Capabilities**:
  - The CLI supports piping raw intermediate output to stdout:
    ```bash
    echo 'a>b>c' | ./diagrammer dot
    echo 'a>b>c' | ./diagrammer mscgen
    ```
  - And piping directly into host visualizers or files:
    ```bash
    echo 'a>b>c' | ./diagrammer dot -o out.png
    echo 'a>b>c' | ./diagrammer sequence -o out.svg
    ```

### 1.4 Web UI Modernization & Decoupling
- Lightweight, zero-build frontend using browser ES modules.
- Assets served using the native Rust HTTP dev server (`./diagrammer serve`).
- Frontend connected directly to the WebAssembly engine (`build/wasm`).
- Responsive, dark-mode/light-mode theme-adaptive UI with crisp vector typography and SVG icon sets.

### 1.5 Generator vs. Visualizer Architecture & Runtime Metadata
- **Separation of Concerns**: Clarify the distinction between **Generator** (target code representation) and **Visualizer** (rendering engine):
  - *Graphviz*: Generator is DOT language; visualizer engines include `dot`, `neato`, `fdp`, `osage`, `twopi`, `sfdp`.
  - *AST*: Generators include JSON AST and Record Visualizer.
  - *D3*: Generator is hierarchical JSON; visualizers include Reingold-Tilford, Radial Dendrogram, CirclePacked, Sankey.
  - *Mermaid & PlantUML*: Domain-specific sequence generators rendered by external or in-browser engines.
- **Runtime Metadata**: Every visualizer exposes its execution runtime in the UI:
  - ⚡ **Browser (WASM/JS)**: Runs locally and privately in the browser with zero network or backend dependencies.
  - 🖥️ **CLI (Backend)**: Requires native host CLI binaries (`plantuml.jar`, `blockdiag`, etc.).
- **Graceful Group Degradation**: When an input graph relies on groups/clusters but the target visualizer lacks group support (e.g., flat sequence visualizers or group-less graph engines), the generator must gracefully flatten the group container while preserving all member nodes and internal edges. Group-to-group or group-to-node edges are either gracefully omitted, converted to contextual notes, or expanded to entrance/exit boundary nodes.

### 1.6 In-Browser WebAssembly Everywhere (Zero CLI Tools)
- Eliminate all backend CLI requirements for browser users:
  - **Mermaid**: Migrate from backend Node `mmdc` CLI to client-side `mermaid.js` rendering (`mermaid.render()`), making Mermaid diagrams 100% in-browser.
  - **Mermaid Generator Architecture**: Group Mermaid engines by semantic language families (Flowchart/Graph vs State vs Sequence vs ER) rather than string hacks. Provide clean structural generators mapped to matching visualizer engines.
  - **External Python tools** (`blockdiag`, `actdiag`, `nwdiag`, `seqdiag`) & **Java tools** (`plantuml.jar`): Rather than running heavy multi-megabyte Pyodide or JVM WASM emulators, replace them directly with Diagrammer's native Rust layout engines.

### 1.7 First-Party Native Rust Layout Engines (Surpassing Graphviz & Mermaid)
Diagrammer's end goal is to provide its own native, beautifully styled layout engines in `crates/diagrammer-core/src/layout/` that render directly to vector SVG with zero external dependencies:
1. **Sequence Layout Engine (`layout/sequence.rs`)**:
   - Outperforms MSCGen and SeqDiag with modern vector aesthetics, theme awareness, and drop shadows.
   - Lifeline timeline geometry, message routing, self-referential loopbacks.
   - Lifeline activations (execution spans `[` and `]`).
   - Notes anchored to lifelines (`note right of A`, `note over A, B`).
   - Group frames (`loop`, `alt`, `opt`, `par`).
2. **Hierarchical Layered DAG Engine (`layout/layered.rs`)**:
   - Replaces Graphviz `dot` with a pure Rust Sugiyama layout:
     - Phase 1: Cycle removal (greedy feedback arc set).
     - Phase 2: Rank assignment (longest path / network simplex).
     - Phase 3: Crossing minimization (barycenter / median heuristic).
     - Phase 4: Coordinate assignment (Brandes-Köpf algorithm).
     - Phase 5: Smooth cubic Bézier spline routing avoiding node collisions.
3. **Tree & Force Engines (`layout/tree.rs`, `layout/force.rs`)**:
   - Standalone Reingold-Tilford tree layout and physics spring-electrical layouts in pure Rust.

### 1.8 Diagrammer Language & Grammar Evolution
Extend Diagrammer's unified DSL to natively express rich diagram structures:
- **Participant Declarations & Stereotypes**:
  ```diagrammer
  participant "API Gateway" as api [color=#3b82f6, shape=actor]
  database "User DB" as db [color=#10b981, shape=cylinder]
  ```
- **Flow Control & Container Blocks**:
  - `loop "Retry 3 times" { ... }`
  - `alt "Success" { ... } else { ... }`
  - `while condition { ... }`
- **Rich Edge Heads & Multi-exit Subgraphs**:
  - Arrow types: `|->`, `<<->`, `|-|`, `..>`.
  - Subgraph entrance/exit auto-linking: `b > (c > d, e > f) > z`.

---

## 2. Target Component Architecture

```text
               +----------------------------------+
               |        diagrammer-parser         |  (Pest PEG grammar)
               +----------------------------------+
                                |
                                v
               +----------------------------------+
               |          diagrammer-ast          |  (GraphCanvas model)
               +----------------------------------+
                                |
                +---------------+---------------+
                |                               |
                v                               v
    +-----------------------+       +-----------------------+
    | diagrammer-generators |       |   diagrammer-layout   |
    | (DOT, MSCGen, etc.)   |       | (Sequence, DAG, Tree) |
    +-----------------------+       +-----------------------+
                |                               |
                +---------------+---------------+
                                |
                +---------------+---------------+
                |                               |
                v                               v
    +-----------------------+       +-----------------------+
    |    diagrammer-cli     |       |    diagrammer-wasm    |
    |   (Native binary)     |       |  (In-browser engine)  |
    +-----------------------+       +-----------------------+
         |             |                        |
      [stdout]     [render]                     v
    Raw code text   SVG/PNG            [Web UI / DOM Canvas]
```

---

## 3. Incremental Milestones

| Milestone | Scope | Status | Outcome |
| :--- | :--- | :---: | :--- |
| **M1: Legacy JS Elimination** | Delete `js/`, `export/`, decouple web configs, update build rules. | **Done** | Zero legacy JS CLI tools; pure Rust core. |
| **M2: Rust CLI Pipelining** | Native `diagrammer` binary supporting text stdout and image rendering. | **Done** | `echo 'a>b' \| ./diagrammer dot -o out.png`. |
| **M3: Web UI Modernization** | Replace TypeScript with zero-build ES modules; vector icons and dark theme. | **Done** | Modern theme-adaptive UI, vector SVG nodes, zero-build ES modules. |
| **M4: Native Rust Dev Server** | Built-in HTTP static dev server in the CLI. | **Done** | `./diagrammer serve [port]`. |
| **M5: Generator & Visualizer UI Reorganization** | Enriched metadata (`family`, `engine`, `runtime`), clean dropdowns, runtime status badge. | **Done** | Real-time ⚡ Browser vs 🖥️ CLI indicator; clean menu layout. |
| **M6: Native Sequence Layout Engine (Prototype)** | First-party Rust sequence layout in `crates/diagrammer-core/src/layout/sequence.rs`. | **Done** | Standalone vector SVG directly in CLI (`-o out.svg`) and WASM browser UI without external tools. |
| **M7: In-Browser Mermaid Client** | Embed `mermaid.min.js` in `web/` to execute `mermaid_sequence` client-side. | **Planned** | Eliminates Node `mmdc` CLI requirement; runs 100% in browser. |
| **M8: Advanced Sequence Engine Features** | Activations (`[`/`]`), notes (`note right of A`), and container frames (`loop`/`alt`). | **Planned** | Completely supersedes MSCGen and SeqDiag feature sets. |
| **M9: First-Party Hierarchical DAG Engine** | Implement Sugiyama layered layout in pure Rust (`layout/layered.rs`). | **Planned** | Zero-dependency Graphviz replacement compiling to CLI and WebAssembly. |
| **M10: Grammar & DSL Extensions** | Control flow blocks (`alt`, `loop`, `while`), rich arrowheads, subgraph linking. | **Planned** | Native expressiveness without relying on external syntax hacks. |
| **M11: Rust Crate Splitting** | Split `diagrammer-core` into modular workspace crates (`parser`, `ast`, `generators`, `layout`). | **Planned** | Standalone library usage and crisp crate boundaries. |
