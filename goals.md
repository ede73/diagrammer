# Project Goals & Architectural Vision

This document captures the long-term vision, component architecture, and active milestone roadmap for the `diagrammer` project.

---

## 1. Primary Objectives

### 1.1 Eliminate Node.js & TypeScript Bloat
- **Problem**: The project historically relied on TypeScript transpilation (`tsc`), which pulls in Node.js, `npm`, large `node_modules` trees (Jest, Puppeteer, ts-node), and build-step friction.
- **Goal**: Because Diagrammer is a 100% Rust core compiled to WebAssembly and native binaries, Node.js is no longer a mandatory dependency. We have eliminated all TypeScript and Node runtime requirements from the build and web application.
- **Active Step (Complete Node Elimination)**: Replace the remaining isolated test runner in `tests/` (Jest + Puppeteer) with a 100% pure Rust Chrome DevTools Protocol (CDP) test suite via `headless_chrome` and the Rust `image` crate. This removes `tests/node_modules/`, `package.json`, and all npm friction, unifying tests under standard `cargo test`.

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
- **Visualizer Hints as Presentation Subtypes for Native Archetype Engines**:
  - Rather than creating $N$ separate generators and $M$ layout engines, Diagrammer maintains a concise set of **Core Topology Archetypes** (Layered DAG, Sequence, Tree, Force, Timeline).
  - The `visualizer <hint>` directive acts as a polymorphic **presentation and styling subtype hint** passed into the archetype engine:
    - `visualizer uml`: Layered DAG engine uses UML class cards, member compartments, orthogonal elbow routing, and hollow triangle inheritance markers.
    - `visualizer network`: Layered DAG engine uses network topology iconography, multi-drop bus lines, IP/port tags, and router/switch node skins.
    - `visualizer er`: Layered DAG engine uses relational entity tables and crow's foot cardinality connectors (`||--|{`).
    - `visualizer flowchart`: Layered DAG engine uses rounded flow nodes, diamond decision splits, and smooth Bézier connectors.
    - `visualizer <unrecognized>`: Gracefully falls back to the default general-purpose layered DAG layout.
  - This completely avoids code explosion while empowering users to guide diagram styling and routing nuances directly via `visualizer <hint>`.
- **Unified Global AST Configuration & Canonical Invariants**:
  - **Theme & Layout as Global Cascading State**: `theme { ... }` and `layout { ... }` blocks (whether included via `include` or written inline) are parsed into global canvas properties.
  - **The "Last Replaces" Principle**: Later declarations overwrite previous declarations for overlapping keys, while non-overlapping properties cascade forward.
  - **Single Unambiguous AST Contract for Generators**: Generators consume an AST containing at most ONE canonical `Theme` and ONE canonical `Layout` object. Generators are completely decoupled from provenance (they do not need to know whether settings came from 0, 1, or 5 includes or in-line blocks). Visualizers and generators that lack theme/layout support (e.g. basic mscgen) safely and completely ignore them.
  - **Declarative Graph Theming on Preceding Nodes**: Theme colors (`vertex-color`, `edge-color`, etc.) apply globally to all uncolored nodes and edges across the graph regardless of whether the theme block is placed at the top or bottom of the document. Explicit element-level colors (`a#ff0000`, `rect d#000000`) strictly override ambient theme defaults.
  - **Web UI Theme Preset Dropdown (`Theme: [ (None) v ]`)**: Provides an ambient theme selector in the web toolbar prepending `include "<theme>"\n` dynamically upon parse, keeping diagram source code 100% clean and allowing diagrams to effortlessly override any theme settings with in-graph blocks.
- **Runtime Metadata**: Every visualizer exposes its execution runtime in the UI:
  - ⚡ **Browser (WASM/JS)**: Runs locally and privately in the browser with zero network or backend dependencies.
  - 🖥️ **CLI (Backend)**: Requires native host CLI binaries (`plantuml.jar`, `blockdiag`, etc.).
- **Graceful Group Degradation**: When projecting a graph with groups onto a visualizer that has no concept of groups (analogous to projecting 3D onto 1D, e.g., Sequence Diagrams), some structural container information is naturally lost:
  - **Flatten Groups**: Unwrap all groups (including nested groups) so all inner vertices (`a, b, c` in `GROUP`, `d, e, f` in `AnotherGroup`) are preserved as first-class vertices/participants.
  - **Preserve Vertex-to-Vertex Edges**: All vertex-to-vertex connections (both within a group and across groups, such as `b > e`) are rendered normally.
  - **Ignore Group-Level Links**: Edges connected directly to or from a group container (`GROUP --> AnotherGroup` or `node --> GROUP`) are ignored/omitted in group-less visualizers.

### 1.6 In-Browser WebAssembly Everywhere (Zero CLI Tools)
- Eliminate all backend CLI requirements for browser users:
  - **Mermaid**: Migrate from backend Node `mmdc` CLI to client-side `mermaid.js` rendering (`mermaid.render()`), making Mermaid diagrams 100% in-browser.
  - **Mermaid Generator Architecture**: Group Mermaid engines by semantic language families (Flowchart/Graph vs State vs Sequence vs ER) rather than string hacks:
    - *Flowchart / Graph (`dagre-d3`)*: 1:1 match for general DAGs, vertices, shapes, and subgraphs. [Implemented]
    - *State Diagram (`stateDiagram-v2`)*: 95% native match for state charts, mapping `beginpoint`/`endpoint` to `[*]`, and nested groups to `state Composite { ... }`. [Implemented]
    - *Sequence Diagram (`sequenceDiagram`)*: Chronological interaction model with Graceful Group Degradation. [Implemented]
    - *Class Diagram (`classDiagram`)*: UML object model with properties, methods, generics `~T~`, and relationships (`<|--`, `*--`, `o--`, `-->`, `..>`). [Implemented]
    - *Mindmap (`mindmap`)*: Pure hierarchical DFS spanning-tree projection from root with indentation and node shapes. [Implemented]
    - *Entity Relationship (`erDiagram`)*: Relational models with entities, attributes, and cardinality specifications (`||--|{`, `||--o{`, `}|--||`). [Implemented]
    - *CLI Generator Test Suite*: Native Rust tests in `crates/diagrammer-core/tests/mermaid_generators.rs` run syntax and sanitization invariants across diagram fixtures in ~0.05s via `cargo test`, bypassing heavy headless browser test runners for fast generator verification. [Implemented]
    - *Excluded Non-Graph Languages*: Pie charts (`pie`), quadrant charts (`quadrantChart`), XY charts (`xychart`), Git commit logs (`gitGraph`), user journeys (`journey`), Gantt calendars (`gantt`), and packet headers (`packet`) do not represent topological graphs and are excluded by design.
  - **Mermaid Source Analysis (`/Users/ede/src/mermaid`)**:
    - Inspection of Jison grammars (`packages/mermaid/src/diagrams/`) reveals that while Mermaid shares surface lexer conventions across diagrams (copy-pasting `%lex`, `%x acc_title`, `%x acc_descr`, `%%` comments, and arrow tokens from Andrew Brampton's `js-sequence-diagrams`), their AST models and grammar productions are distinct and strictly incompatible.
    - Diagrammer's unified grammar (`diagrammer.pest`) serves as the universal adapter, allowing a single expressive model to project cleanly into any of Mermaid's specialized target sub-languages without syntax hacks.
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
     - Phase 5: Advanced Orthogonal & Spline Routing:
       * **Channel Routing & Track Assignment**: Allocate distinct horizontal/vertical lanes in inter-rank channels so parallel edge trunks do not collapse onto the exact same coordinate.
       * **Port Distribution**: Distribute multiple edge connections evenly across node perimeter rather than collapsing all onto a single center anchor.
       * **Non-Occluding Edge Labels**: Render labels borderless with subtle text halos or offset toward ports (head/tail anchors) to prevent occlusion of adjacent paths.
       * **Compound / Container Routing**: Partition edges into container-internal routes (confined inside a cluster) vs inter-container highways traversing cluster boundaries.
3. **Graph Archetypes & Routing Topologies**:
   - **Type A: Hierarchical Layered DAG** (UML, ER, Flowcharts, State machines): Topological rank dictates layers; channel routing handles connectors.
   - **Type B: Monotonic Timeline / Lifeline** (Sequence diagrams, MSC, Gantt): 1D entities on one axis, strictly monotonic time progression on the other.
   - **Type C: Constrained Radial / Dendrogram Trees** (Reingold-Tilford, Sunburst, Mindmap): Parent-child radial or branching projection where routes follow fixed geometry.
   - **Type D: Temporal / Genealogical Graphs** (Family trees, Git branching DAGs): Dual-axis constraints where generational rank can either collapse inline or map to continuous temporal coordinates.
4. **Tree & Force Engines (`layout/tree.rs`, `layout/force.rs`)**:
   - Standalone Reingold-Tilford tree layout and physics spring-electrical layouts in pure Rust.

### 1.8 Diagrammer Language & Grammar Evolution
- **Universal Representation Philosophy**:
  "A graph language that allows describing anything, visualizable with anything else."
  - Diagrammer's container/group syntax (`{Person;Person ...}`) acts as an expressive, polymorphic structural representation without requiring language-specific keywords.
  - The same unified construct projects seamlessly as a UML Class diagram (with members, methods, visibility, and inheritance), as a Graphviz cluster, as a Record Visualizer table, or as a nested state/loop container depending on the target visualizer.
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

### 1.9 Complete Variable Interpolation & Full Label Semantics in Rust Core
- **Problem**: Variable substitution (`$(var)`) was only hooked into direct property assignments in `AstBuilder`, leaving `$(var)` unexpanded in labels, strings, and URLs. Crucial label destructuring pipeline logic (`setLabel` from legacy TypeScript) was missed during migration: leading colors (`;#ff0000...` or `;$(darkviolet)...`) were not extracted to `textcolor`, URLs (`[http://...]`) were not extracted to `url`, and contextual defaults (`VERTEX COLOR`, `VERTEX TEXTCOLOR`, `EDGE COLOR`, etc.) did not propagate to rendered elements.
- **Goal**:
  1. Port the full `setLabel` destructuring pipeline into `crates/diagrammer-core/src/builder.rs`.
  2. Perform variable expansion across all labels, quoted strings, and attribute positions using `ParsingContext.variables`.
  3. Extract leading text colors and bracketed URLs from labels into dedicated AST fields (`textcolor`, `url`) across vertices, edges, and groups.
  4. Expand golden parity test fixtures to include `colors.txt` and `url.txt` to guarantee zero regressions against legacy reference outputs.

### 1.10 Adaptive Diagram Theming & Perceptual Dark Mode Engine
- **Problem**: Graphs created with light-mode colors (e.g., `#FF0000`, dark text on light backgrounds, saturated fills) appear harsh, illegible, or "crusted" when viewed on dark canvases in modern dark-mode interfaces.
- **Immediate Solution (Automatic Perceptual Color Adaptation)**:
  - Implement a perceptual color adjustment algorithm (similar to browser dark-mode engines like Dark Reader) in OKLab/CIELAB color space.
  - Dynamically invert/compress luminance and tone down chroma so that:
    - Saturated reds like `#FF0000` shift to softer, contrast-safe dark-mode hues (e.g. `#ff6b6b`).
    - Dark text and borders automatically scale lightness against dark backgrounds to satisfy WCAG contrast ($\ge 4.5:1$).
- **Language & DSL Architecture Roadmap**:
  1. **`theme { ... }` block**: Declarative styling block for graph-wide and element styles (fonts, font sizes, palette tokens, stroke colors, dark/light variants).
  2. **`layout { ... }` block**: Engine-agnostic geometry tuning (padding, rank/node separation, edge weight/thickness, margins).
  3. **`include "..."` directive**: Modular preset loading for CLI and Web (e.g., `include "theme.diag"`, `include "layouts/compact.diag"`):
     - **CLI**: Resolves files relative to the script itself via `AstBuilder::with_base_dir()`.
     - **Web**: Standalone in-browser Theme / Logical Files editor tab storing logical files in localStorage, dynamically passed into WASM via `wasm_parse_and_generate_with_files`.
     - Diagrams remain clean and focused on logical graph connectivity without style boilerplate.

### 1.11 Core Language Design Principles: Graph Essence First, In-Place Augmentation & Position-Forward State
- **Fluency, Expressiveness & Terseness**: Diagrammer allows defining the core essence of a diagram in-place with minimal ceremonial syntax.
- **Global Existence & In-Place Augmentation**:
  - Referencing a vertex anywhere (e.g. `a > b`) immediately creates it globally.
  - In-place augmentation (e.g. `a;My Label`) enriches attributes without having to restate edges or forward-declare nodes.
  - Multiple references to the same edge (e.g. `a > "xxx" b` followed by `a > "yyy" b`) additively increments the edge text rather than duplicating edges.
- **Position-Forward Cascading Defaults (Flowing State)**:
  - Declarations like `edge color #ff0000`, `vertex color #...`, and `shape circle` apply strictly from their declaration position onward.
  - Previous declarations remain unaffected, while subsequent declarations inherit the active flowing defaults.
  - Explicit per-node attributes (e.g. `rect d` amidst `shape ellipse`) always override the ambient default baseline.

### 1.12 Rich Arrowhead Lines and Multi-Entrance / Multi-Exit Subgraph Auto-Linking
- **Rich Arrow Syntax**: Multi-character edge declarations (`-->`, `..>`, `==>`, `|->`, `|-->`, `|-|`, `|--|`, `<-->`, `<<-->>`) supported directly in the Pest grammar and AST builder without requiring artificial spacing or escaping.
- **Multi-Entrance / Multi-Exit Subgraph Chains**:
  - When nesting subgraphs in event chains (e.g., `start > (a > b, c > d) > end` or `(a > b \n c > d) > "merged" z`):
    - Entrances (`start -> a`, `start -> c`) are automatically linked from the preceding element.
    - Exits (`b -> end`, `d -> end` or `b -> z`, `d -> z`) are automatically linked to the succeeding element, preserving labels, colors, and line types.
    - Internal chain terminals are accurately tracked via `GraphGroup.chain_terminals`, ensuring cyclic chains (e.g. `(A > B > C > B > A)`) cleanly resolve their true terminal without corrupting sequence diagrams or golden generators.

### 1.13 First-Party Native Sequence Layout Engine: Activations, Anchored Notes, Dividers & Interaction Frames
- **Pure Vector Output**: Zero external JavaScript or Java dependencies; 100% Rust engine generating modern dark/light SVG sequence diagrams directly in WASM and CLI.
- **Lifeline Activations**: Automatically computes active intervals on lifelines when messages arrive at participants, rendering crisp `.ds-activation` bars.
- **Anchored Notes & Dividers**:
  - `label :: note` syntax splits into an interaction label on the message line and an anchored `.ds-note-box` callout next to the target lifeline.
  - Arrowless dotted self-edges (`A.A ; "delay"`) render centered time delay divider lines (`.ds-divider-line`).
  - Arrowless dashed self-edges (`A-A ; "phase"`) render full-width section headers (`.ds-divider-rect`).
- **Interaction Frames**:
  - Groups (`{ loop_retry; "loop Retry 3 times" ... }` or `{ alt_success; "alt ..." ... }`) render dashed container boxes (`.ds-frame-box`) with tagged corner labels (`.ds-frame-tag-text`).
- **Fixture**: Showcased in `tests/test_inputs/native_sequence.txt`.

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
| **M7: In-Browser Mermaid Client** | Embed `mermaid.min.js` in `web/` to execute `mermaid_sequence` client-side. | **Done** | Eliminates Node `mmdc` CLI requirement; runs 100% in browser. |
| **M8: Advanced Sequence Engine Features** | Activations (`[`/`]`), notes (`note right of A`), and container frames (`loop`/`alt`). | **Done** | Completely supersedes MSCGen and SeqDiag feature sets. |
| **M9: First-Party Hierarchical DAG Engine** | Implement Sugiyama layered layout in pure Rust (`layout/layered.rs`). | **Done** | Zero-dependency hierarchical DAG & UML layout engine compiling to CLI and WebAssembly. |
| **M10: Grammar & DSL Extensions** | Control flow blocks (`alt`, `loop`, `while`), rich arrowheads, subgraph linking. | **In Progress** | Rich arrowheads & subgraph linking landed; control flow next. |
| **M11: Rust Crate Splitting** | Split `diagrammer-core` into modular workspace crates (`parser`, `ast`, `generators`, `layout`). | **Planned** | Standalone library usage and crisp crate boundaries. |
| **M12: Pure Rust Headless Browser Tests** | Implement 100% Rust browser test suite via Chrome DevTools Protocol (`headless_chrome`), eliminating Node.js test harness. | **Done** | Native Cargo browser integration tests (`make browsertests`) executing in under 5 seconds with zero Node/Puppeteer dependencies. |
| **M13: Icon & Type Asset Modernization** | Re-render all repository PNG icon and type assets from modern vector SVGs using `rsvg-convert`. | **In Progress** | Eliminates legacy 2023 pixelated clip-art from Graphviz and web visualizations. |
| **M14: Native Layout Node Shapes & Styles** | Implement full shape catalog (`circle`, `diamond`, `database`, `actor`, etc.), stroke styles (`bold`, `dashed`, `dotted`), and image/icon embedding in native Rust layout engines. | **Planned** | Native engines render full node shape, style, and icon semantics matching `tests/test_inputs/nodes.txt`. |
