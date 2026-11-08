# Project Goals & Architectural Vision

This document captures the long-term vision and structural goals for the `diagrammer` project.

---

## 1. Primary Objectives

### 1.1 Eliminate Node.js & TypeScript Bloat
- **Problem**: The project historically relied on TypeScript transpilation (`tsc`), which pulls in Node.js, `npm`, large `node_modules` trees (Jest, Puppeteer, ts-node), and build-step friction.
- **Goal**: Because Diagrammer is now a Rust core compiled to WebAssembly and native binaries, Node.js should no longer be a mandatory dependency. We want to remove all TypeScript and Node runtime requirements from the repository.

### 1.2 Modularize into Independent Rust Library Crates
Restructure the project so that parsing, AST modeling, code generation, and UI bindings are cleanly isolated library components with clear API boundaries:
1. **`diagrammer-parser`**: Responsible solely for grammar (Pest PEG) and lexing into CST/AST. Borderline standalone parser library.
2. **`diagrammer-ast`**: The central graph model (`GraphCanvas`, `GraphVertex`, `GraphEdge`, `GraphGroup`).
3. **`diagrammer-generators`**: Output transpilers that consume the AST model and emit target representations (Graphviz DOT, MSCGen, PlantUML, JSON, etc.).
4. **`diagrammer-cli`**: Native CLI application consuming the library for command-line workflows.
5. **`diagrammer-wasm`**: Clean WebAssembly bindings (`wasm-bindgen`) for in-browser execution.

### 1.3 Unified Visualizer Pipeline (CLI & Web Parity)
- Visualizers should operate identically across CLI and Web environments (including Sankey, D3, MSCGen).
- There should be zero behavioral divergence between what is parsed/generated on the command line versus in the browser.
- **Piping Capabilities**:
  - The CLI must support piping raw intermediate output to stdout:
    ```bash
    echo 'a>b>c' | diagrammer dot
    echo 'a>b>c' | diagrammer mscgen
    ```
  - And piping intermediate output directly into host/external visualizers for comparison:
    ```bash
    echo 'a>b>c' | diagrammer mscgen | mscgen -Tpng -o /tmp/mscgen_ref.png
    ```
  - While also supporting direct image generation:
    ```bash
    echo 'a>b>c' | diagrammer dot -o out.png
    ```

### 1.4 Web UI Modernization
- Redo the web interface to be a lightweight, zero-Node frontend.
- Serve assets using a tiny native Rust web server (or standalone static files) without npm/Node dev servers.
- Connect the frontend directly to the WebAssembly engine.

### 1.5 Native Rust Renderers (Replacing Legacy External Tools)
- Progressively replace legacy, third-party Python visualizers (`blockdiag`, `actdiag`, `nwdiag`, `seqdiag`) and external tools with native, modern, high-performance Rust layout and rasterization engines.
- Provide out-of-the-box diagram rendering directly in the native binary without requiring external Python or Java runtimes.

---

## 2. Target Component Architecture

```text
               +----------------------------------+
               |        diagrammer-parser         |  (Pest PEG grammar)
               +----------------------------------+
                                |
                                v
               +----------------------------------+
               |         diagrammer-ast           |  (GraphCanvas model)
               +----------------------------------+
                                |
                                v
               +----------------------------------+
               |      diagrammer-generators       |  (AST -> DOT, MSCGen, etc.)
               +----------------------------------+
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
    Raw code text   PNG/SVG            [Web UI / DOM Canvas]
```

---

## 3. Incremental Milestones

| Milestone | Scope | Outcome |
| :--- | :--- | :--- |
| **M1: Legacy JS Elimination** | Delete `js/`, `export/`, decouple web configs, update build rules. | *(Completed)* Zero legacy JS CLI tools. |
| **M2: Rust CLI Pipelining** | Native `diagrammer` binary supporting text stdout and image rendering. | *(Completed)* `echo 'a>b' \| diagrammer dot -o out.png`. |
| **M3: Rust Crate Splitting** | Split `diagrammer-core` into modular crates (`parser`, `ast`, `generators`). | Strict API boundaries; standalone library usage. |
| **M4: Native Rust Dev Server** | Replace `web/miniserver.ts` with lightweight Rust server binary. | Eliminates Node server requirement. |
| **M5: Web UI Decoupling** | Replace TypeScript in `web/` with zero-build ES modules or Rust WASM UI. | Deletes `package.json`, `node_modules`, and npm dependency entirely. |
| **M6: Native Rust Renderers** | Implement native sequence / block layout engines in Rust. | Replaces Python `blockdiag`/`actdiag`/etc. |
