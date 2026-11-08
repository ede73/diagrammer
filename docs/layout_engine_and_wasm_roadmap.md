# Diagrammer Architectural Roadmap: Native Rust Layout Engines & WebAssembly Visualizers

## Executive Vision
Diagrammer is powered by a concise, expressive graph language that unifies diverse visualization paradigms under a single AST model (`crates/diagrammer-core`).

Historically, Diagrammer relied on a patchwork of external generators and visualizers:
- **Graphviz** (via Viz.js WebAssembly in browser, or native `dot` CLI)
- **MSCGen** (via `mscgen_js` in browser, or C CLI)
- **D3.js & GoJS** (client-side JS libraries)
- **Blockdiag suite** (`actdiag`, `blockdiag`, `nwdiag`, `seqdiag` - Python CLI)
- **PlantUML** (Java JAR CLI)
- **Mermaid** (Node `mmdc` CLI)

### Strategic Objective
Transform Diagrammer into a **self-contained, zero-external-dependency diagramming platform**:
1. **In-Browser WebAssembly Everywhere**: Run all visualizations client-side without requiring native CLI toolchains or backend execution.
2. **First-Party Native Rust Layout Engines**: Develop Diagrammer's own layout engines inside `crates/diagrammer-core/src/layout/` that compile to both native CLI binaries and WebAssembly, rendering beautiful SVG vector graphics directly with modern aesthetics (theme adaptability, gradients, drop shadows, responsive viewboxes).
3. **Language Evolution**: Extend the Diagrammer grammar to natively support sequence timelines, notes, activations, state machines, and hierarchical clusters beyond the limitations of legacy tools.

---

## 1. Visualizer Landscape & WebAssembly Strategy

| Visualizer Family | Engines / Variants | Current Runtime | WebAssembly / In-Browser Feasibility | Recommended Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Graphviz** | `dot`, `neato`, `fdp`, `osage`, `twopi` | **In-Browser (WASM)** via Viz.js | Full WASM support achieved | Keep Viz.js WASM for legacy parity; replace with Diagrammer DAG engine. |
| **Graphviz SFDP** | `sfdp` | **Backend CLI only** | Medium (requires compiling Graphviz with SFDP multilevel dependencies to WASM) | Implement native Rust spring-electrical force layout. |
| **MSCGen** | `mscgen` | **In-Browser (JS)** via `mscgen_js` | Full JS support achieved | Functional, but syntax and features are severely limited. Supersede with native Rust sequence engine. |
| **D3.js** | `reingoldtilford`, `dendrogram`, `circlepacked`, `sankey` | **In-Browser (JS)** | 100% Client-side JS | Retain in browser UI; add SVG export from core. |
| **GoJS** | `layerbands`, `parsetree`, `umlclass` | **In-Browser (JS)** | 100% Client-side JS (commercial license constraints) | Re-implement parse trees and UML class diagrams using first-party Rust SVG generators. |
| **Mermaid** | `mermaid_sequence` | **Backend CLI (`mmdc`)** | **100% feasible in-browser** via `mermaid.js` | **Immediate Win**: Embed `mermaid.min.js` in the web UI. Call `mermaid.render()` client-side, eliminating the Node `mmdc` CLI dependency entirely. |
| **Blockdiag Suite** | `actdiag`, `blockdiag`, `nwdiag`, `seqdiag` | **Backend CLI (Python)** | Heavy (Pyodide is ~15MB+ WASM download with high startup latency) | Do not emulate Python in WASM. Replace directly with first-party Rust layout engines. |
| **PlantUML** | `plantuml_sequence` | **Backend CLI (Java)** | Infeasible (CheerpJ/TeaVM JVM in browser is multi-megabyte and slow) | Diagrammer DSL is already cleaner than PlantUML. Replace with native Rust sequence engine. |

---

## 2. Diagrammer Native Layout Engines (`crates/diagrammer-core/src/layout/`)

By building layout engines directly into `crates/diagrammer-core`, we achieve:
- **Instant compilation to WebAssembly** via `wasm-pack` with zero browser overhead.
- **Zero-dependency native CLI execution**: `./diagrammer sequence input.txt -o out.svg` produces production-ready vector graphics without installing Graphviz, Java, Python, or Node.
- **Unified modern aesthetic**: Clean SVG markup with semantic classes, dark/light theme awareness, rounded corners, subtle drop shadows, and responsive scaling.

```
crates/diagrammer-core/
├── src/
│   ├── ast.rs
│   ├── builder.rs
│   ├── diagrammer.pest
│   ├── lib.rs
│   ├── layout/
│   │   ├── mod.rs                // Layout traits and shared geometry (Point, Rect, BoundingBox)
│   │   ├── svg.rs                // Vector SVG emitter (shapes, paths, markers, text, styles)
│   │   ├── sequence.rs           // First-party Sequence Diagram layout engine
│   │   ├── layered.rs            // Sugiyama hierarchical DAG layout engine
│   │   └── force.rs              // Physics spring-electrical layout engine
│   └── generators/
│       ├── mod.rs
│       └── native_sequence.rs    // Generator adapter for sequence layout
```

### Engine 1: First-Party Sequence Layout Engine (`layout/sequence.rs`)
Overcomes MSCGen and SeqDiag limitations:
1. **Lifeline Placement**: Automatically measures participant label bounding boxes and distributes lifelines with configurable padding.
2. **Timeline Sizing**: Dynamic vertical stepping based on message types, multi-line labels, and self-referential loopbacks.
3. **Activation Spans**: Tracks activation boxes (`[`, `]`) on lifelines with nested call depths.
4. **Rich Message Arrows**:
   - Synchronous call (`->`, solid with filled arrowhead)
   - Asynchronous signal (`-->`, solid with open arrowhead)
   - Return / Reply (`<--`, dashed with open arrowhead)
   - Bidirectional / Broadcast (`<->`)
5. **Notes & Group Frames**:
   - Notes anchored to lifelines (`note right of A`, `note over A, B`).
   - Group blocks (`alt`, `opt`, `loop`, `par`) with styled background containers.
6. **SVG Styling**:
   - Theme-adaptive colors (supports CSS variables `--text-primary`, `--bg-surface`, `--accent`).
   - Crisp SVG arrowhead `<marker>` definitions.
   - Rounded participant badges with subtle gradients.

### Engine 2: Hierarchical Layered DAG Engine (`layout/layered.rs`)
Replaces Graphviz `dot` with a pure Rust Sugiyama layout:
1. **Cycle Removal**: Greedy feedback arc set algorithm to ensure a directed acyclic graph.
2. **Rank Assignment**: Longest path or network simplex layering to assign nodes to discrete vertical/horizontal layers.
3. **Crossing Minimization**: Two-layer barycenter and median heuristics with iterative sweeps to minimize edge intersections.
4. **Coordinate Assignment**: Brandes-Köpf linear-time coordinate assignment producing balanced, symmetric layouts.
5. **Edge Splines**: Cubic Bézier curve routing avoiding node collisions.

---

## 3. Diagrammer Grammar Evolution Proposals

To support rich diagrams natively without depending on external syntax oddities:

### 1. Participant Declarations & Stereotypes
```diagrammer
participant "API Gateway" as api [color=#3b82f6, shape=actor]
participant "Auth Service" as auth [color=#10b981]
database "User Store" as db [color=#f59e0b, shape=cylinder]
```

### 2. Lifeline Activation & Notes
```diagrammer
api -> auth: "POST /login" {
    auth -> db: "SELECT user"
    db --> auth: "user record"
    note right of auth: "Validate bcrypt password"
    auth --> api: "200 OK + JWT"
}
```

### 3. Alternative & Parallel Framing
```diagrammer
frame "Authentication Check" [type=alt] {
    case "Valid Credentials" {
        api -> client: "200 Success"
    }
    case "Invalid" {
        api -> client: "401 Unauthorized"
    }
}
```

---

## 4. Phased Implementation Roadmap

- [x] **Phase 1: Web UI Metadata & Runtime Categorization** (PR #56)
  - Rich metadata (`family`, `engine`, `runtime`) for all visualizers.
  - Interactive status badges (⚡ Browser WASM/JS vs 🖥️ CLI Backend).
- [ ] **Phase 2: In-Browser Mermaid Client Integration**
  - Add client-side `mermaid.js` integration in `web/` to execute Mermaid sequence diagrams without the `mmdc` CLI.
- [ ] **Phase 3: First-Party Native Rust Sequence Engine Prototype**
  - Implement `crates/diagrammer-core/src/layout/sequence.rs` and SVG vector generation.
  - Register as `native_sequence` in core generators and WebAssembly.
  - Provide both CLI direct SVG output and browser visualizer.
- [ ] **Phase 4: First-Party Hierarchical DAG Layout Engine**
  - Implement Sugiyama-style rank and coordinate assignment in Rust.
  - Deliver zero-dependency Graphviz alternative.
