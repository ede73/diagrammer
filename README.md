# Introduction
I'm a visual learner and I've always liked visual representation instead of reading boring endless blahblah from a book. Or just documenting my own projects.

There are plethora of awesome visualization tools available for any of your needs:
- Sequence diagrams
- Graphs circular, directed, undirected
- Network / activity diagrams
- Dendograms, Genograms, Family trees, UMLs

And so so many tools to choose from:
- [mscgen](https://www.mcternan.me.uk/mscgen/)
- [plantuml](https://plantuml.com/) (that probably includes most comprehensive selection of tools)
- [graphviz](https://graphviz.org/)
- [blockdiag](http://blockdiag.com/en/index.html) also actdiag, seqdiag, nwdiag
- [GoJS](https://gojs.net/latest/samples/parseTree.html) and it's parse trees and other goodies
- [d3.js](https://d3js.org/) and it's awesome visualization

Alas all suffer from the same dilemma, make one graph/diagram, and it **can't be re-used** anywhere :) Not without a lot of editing.

And to add the visualization to your document, it's on track to be outdated. And You don't want to update it, because it is **hard to maintain**, you have to re-run the visualization again, export the image to the doc ans so forth.

Also **privacy**, many online visualization tools are available, but would you use that to visualize your secrets? You've no control over how the remote site might use information on your graph.

And not limited there, but who ever designed those graph representations in the first place didn't think of simplicity. Some are really awkward to write and learn.
(Of course in the end, this project is no exception :) )

All the graphs have something in common, they describe simple relations between edges and vertices.
```
a > b > c < d
```

Also lot of other interesting things popped up and was available 2013 :)
LLVM! Anything to anything transpiler (well kinda). Node.js, javascript on server side. JISON! Lexer/Grammar for JS!

That's so cool! I could have graphviz run in browser! And I could use the SAME rendering engine from command line.

AND I could finally design a proper lexer/parser for the language to be. This could just as well be integrated into the wiki.

# Diagrammer and the language

Main components:
- 100% Rust core in `crates/diagrammer-core`: Pest PEG grammar (`src/diagrammer.pest`), AST builder, and all 13 diagram generators
- WebAssembly package in `build/wasm` enabling fast, zero-server client-side execution in the browser
- Interactive Ace editor and zero-build web frontend in `web/`
- Native CLI binary `./diagrammer` for direct generation, image rendering, and embedded dev server
- Comprehensive test coverage: Rust unit tests, AST parity tests across 53 fixtures, generator parity across all 12 formats, and Jest/Puppeteer browser visual regression suites

# Web Interface

I just run this locally (in my Mac or in my Windows on WSL2/Ubuntu)

Example TCP state diagram in the editor

<img width=60% alt="image" src="https://github.com/user-attachments/assets/288fd63c-561e-4ca4-a37d-98bb30c076c3" />

And output

<img width=30% src="https://user-images.githubusercontent.com/1845554/216884941-9cb3c597-c6d7-42f4-9564-3c69cd936370.png">

You can select different visualizers from the drop down (without changing your diagram)

<img width="200" alt="image" src="https://github.com/user-attachments/assets/32f27910-7545-4574-ba49-3c94ee121770" />

Plenty of examples (also used in tests)
<img width="200" alt="image" src="https://github.com/user-attachments/assets/9d4b4a22-db25-4e63-85a0-8c43a6f55413" />

You can use brower's localstorage to save the diagrams (and load them). You can also export/import then to the 'backend' if needed (requires webserver, embedded in `./diagrammer serve`)
<img width="200" alt="image" src="https://github.com/user-attachments/assets/8fb3d0f2-d0d8-4f29-958e-1d9402d1f2be" />

And if you don't remember how exactly in diagrammer language something was done, you can just click the shapes, arrows, types and it'll output that in the editor

<img width="60%" alt="image" src="https://github.com/user-attachments/assets/61af4bcd-0cd7-4904-99c7-e26910e084b5" />

# The language

I wanted the diagrammer be super easy to use and get going, but with ability for expressivity and visual help (colors, texts, notes).

## Vertices and edges(links)

In diagrammer you write the graph as
```
a>b>c<d<e<(f,g,h)
```

That gives you a graph:
<img width=200 src="https://user-images.githubusercontent.com/1845554/216885697-fbd13681-b728-41da-bfa9-9ee6be5a0f69.png">

### Vertex text
You can change text of the code by declaring it somewhere as
```
a;This is a vertex
```

It doesn't matter where the statement is. There's no error resolution, last declaration stands.

### Vertex shape
Shape declaration is added LHS of the vertex
```
box a
diamond b
```
Same rules as with text, last used declaration stands.

You can also use special syntax:
```
shape box
```
Which will make all the rest of the shapes be boxes. Statement can appead many times, always shaping the next introduced vertices as such.

### Vertex colors
Well everyone needs a bit of color, so do graphs

```
a#ff0000
```
Make a red vertex

### Color variables
And changing all the colors is tedious, so we have variable. Of course.

```
$(greencolor:#00ff00)
greenvertex$(greencolor)
```

### Marking the beginning
```
START vertexname
```
May apply to some visualizers, some don't care/support start vertices

### Vertex equality
Since most visualizers are dynamic, there's little to guide them.
You can mark vertices to be equal to one other.
```
equal vertexa, vertexb
```
GraphViz usually tries to obey.

### Grouping
There's two syntaxes (old and new :) )
```
group color #7722ee
group NAME1;Label the group1
//Vertices
  group InnerGroup1#00ff00;Inner group1
  xy1
  group end
group end
```
or
```
{ NAME2#ff0000;Label the group2
//Vertices
  {InnerGroup2#5555ff;Inner group2
  xy2
  }
}
```

Gives (on graphviz/dot)

<img width=200 src="https://user-images.githubusercontent.com/1845554/216887257-3e134de7-1434-4392-abb3-f98d43afca20.png">

### Images
SOME visualizers(graphviz/dotty) allow using own icons.
```
a/barcode.png,b/basestation.png,c/battery.png > d/camera.png,e/cpu.png,f/documents.png
...
```

<img width=200 src="https://user-images.githubusercontent.com/1845554/216887662-1aa6fd1c-e7f8-4a70-9fe0-b3abdf0c13b8.png">

### Edge pointing to a group
Edge can point to a vertex or two a group. Depending on visualizer group pointing edges may work or not :)

### Edge singularity (aka. invisible vertex)
```
r>singularity y>splita,splitb
```

<img width=200 src="https://user-images.githubusercontent.com/1845554/216887887-fa72462d-e6fa-4f41-97bb-d464e7815eb8.png">

### Edge compass
Some visualizer allow hinting where to connect the edge if possivle

```
a#ff0000:se.>b:s,c:se,d:w,e:ne,f:s,g:nw,h:e,i:sw
```

<img width=200 src="https://user-images.githubusercontent.com/1845554/216888027-4f633927-9129-489c-af69-b95ef2a5883c.png">

### Edge types
Just list of:
- > arrow
- -> dashed arrow
- .> dotted arror
- <> two way arrow
- <-> two way dashed arrow
- <.> two way dotted arrow
- - dashed (no arrow head)
- . dotted (no arrow head)
- </ broken arrow
- /> broken arrow

Some types may not be available on all visualization

### Edge texts
```
a>b;Instead of renaming vertices (since they are connected) this make edge text
c>"signal::and a big\nlined\nnote\nie.multiline edge text"d
e>f;signal::and a big\nlined\nnote\nie.multiline edge text
```

### Edge colors
```
a-$(b:#0000ff)a;jotain kay tassanain
b-$(colorvariable)b;jotain kay tassanain
```

### Conditionals
To speed mindmapping capabilities, diagrammer language has a if then/else if/else construction

```
starting
if something would happend then
  a1>b1
elseif something probably would not happen then
 a2>b2
elseif or if i see a flying bird then
 a3>b3
else
  a4>b4
endif
```

It'll make 5 vertex groups:
1) Beginning of the conditional block, the **if** part ie. *something would happen*, vertices a1,b1 (or edges if the vertices were introduced earlier)
2) Elseif section **something probably would not happen**, vertices a2,b2 (or edges if the vertices were introduced earlier)
3) **or if i see a flying bird* part and it's vertices
4) Else part and it's vertices
5) End of the conditional block, no vertices

PlantUML + GraphViz visualizer support conditionals (visually)

### Loops
Diagrammer also supports structured loop constructs:
```
while condition
  task_a > task_b
endwhile

do
  step_1 > step_2
until loop_condition_met
```

### Directives and container defaults
- `LANDSCAPE` or `PORTRAIT`: sets canvas layout direction.
- `VISUALIZER <name>`: embeds preferred visualizer target directly in the diagram.
- `START <vertex>`: explicitly declares the initial/start vertex.
- Container color defaults: `VERTEX_COLOR`, `VERTEXTEXT_COLOR`, `EDGE_COLOR`, `EDGETEXT_COLOR`, `GROUP_COLOR`.

### Record shapes
Not all renderers support record types (GraphViz does)
```
SHAPE RECORD
a1;<f0> foo | x | <f1> bar
b1;a | { <f0> foo | x | <f1> bar } | b
a2;<f0> foo | x | <f1> bar
b2;a | { <f0> foo | x | <f1> bar } | b
a1>b1
a2:f0>b2:f1
```

Note! a2:f0 isn't actually a diagrammer language construct!
In AST it appears as a vertex named "a2:f0" (and for b2:f1 same thing).
It'll be passed as a2:f0 vertex to the renderer, which then may do something with it. In GraphViz case, renderer outputs
```
digraph{
  ...
  a2:f0->b2:f1
  ...
}
```

GraphViz knows this links record a2 to b2 from (a2)f0 to (b2)f1 specifically.

# Downsides

Nothing's ever perfect. This tool works as a command line tool and as a web tool, but not perfectly.
I wanted everything to be Javascript and run fluently which ever way.
Alas, some visualization (renderers) may require X/Display to work, wasn't able to get all renderers compiled(transpiled?) to JS with Emscripten/LLVM, and not all renderers (d3.js) work from command line as they require browser.

Browser local storage works nice, but it's local, ie. jump to another machine and you don't have the files anymore. Hence the export/import.
# AST / model

Briefly as:
```
SHAPE RECORD
graphobject;GraphObject | {name | color | textcolor | url | label }
avertex;GraphVertex | { shape | image | style}
alink;GraphEdge | { edgetype | left | right}
agroup;GraphGroup | { name | _OBJECTS[] | _ROOTVERTICES[] | _edgelabel | "defaults"}
asubgraph;GraphInner | { name | _OBJECTS[] | _ROOTVERTICES[] | _edgelabel | _entrance | exit | "defaults"}

avertex>"inherit"graphobject
alink>"inherit"graphobject
agroup>"inherit"graphobject
asubgraph>"inherit"graphobject

graphroot;GraphCanvas | {_OBJECTS[] | _ROOTVERTICES[] | generator | visualizer | (current)shape | direction | start | equal | "defaults"}

graphobject->"many:1"graphroot
```

<img width=30% src="https://user-images.githubusercontent.com/1845554/217098499-26c7b5ce-8f97-4b5e-b2a3-175cb35697d8.png">

## GraphCanvas
Represents the diagram/graph and necessary properties excluding Edges (stored separately)

Holds all the objects and rootvertices. The diagram may have more than one root vertex, not all visualizers support these though!

It also holds the chosen generator (e.g. graphviz) / visualizer (e.g. circo).

It has list of vertices marked equal - if any.

Which direction the graph is to be drawn - if specified.

What's the current default shape - only used during parsing the diagrammer languge while generating vertices.

AST/Model note. Edges are not stored in GraphCanvas, but separately! Why? It's easier to handle them in the generators and vertices and edges are output separately to separate sections anyway.

GraphCanvas:
- _OBJECTS[GraphVertex(a), GraphInner(GraphVertex(b), GraphVertex(c), GraphVertex(d), GraphGroup(GraphVertex(f), GraphVertex(g)))]
- _ROOTVERTICES[GraphVertex, GraphInner] # this graph has two root vertices
- generator digraph
- visualizer circo
- shape ..
- start ..
- equals ..
- defaults ..


## GraphObject
Represents all the objects in the diagram.

## GraphEdge (link)
Represents edge between two objects(vertices or groups) and all related visualization properties associated with the edge.

Own properties are edgetype, left- and righthand sides (+GraphObject properties)

Edges are stored separately and available for the generator in yy._EDGES

## GraphVertex

Own properties are name, shape, image - if specified, style - if specified (+GraphObject properties)

## GraphGroup

Own properties are name, _edgelabel, defaults and list of _OBJECTS and _ROOTVERTICES.

## GraphInner
Only used to represented "sub graphs" ie. like in :
```
a>(b,c,d>(f,g))
```

Ie. a graph where output vertex is connected to all the inner vertices.

That constructs

GraphCanvas:
- _OBJECTS[GraphVertex(a), GraphInner(GraphVertex(b), GraphVertex(c), GraphVertex(d), GraphInner(GraphVertex(f), GraphVertex(g)))]
- _ROOTVERTICES[same as objects]
- generator
- visualizer
- shape
- start
- equals
- defaults

Own properties are name, _edgelabel, defaults and list of _OBJECTS and _ROOTVERTICES, _entrance and exit.

# Generators
Two convenience methods available:

```
traverseEdges(yy, edge => {
  // do what ever you like for all the edges
})
```
```
traverseTree(root, (vertex, isLeaf, hasSiblings) => {
  // process the vertex
}, enterSubtree => {
  // called then entering new subtree
}, exitSubtree => {
  // called when exiting a sub tree
}) {
}
```

# Project files/folders
- `build/wasm` — WebAssembly package compiled from the Rust core for client-side browser execution
- `crates/diagrammer-core` — 100% Rust core: Pest PEG grammar, AST builder, all 13 diagram generators, and native CLI binary
- `diagrammer` — Symlink to compiled native Rust CLI binary (`target/release/diagrammer`)
- `ext/` — External tools (PlantUML jar)
- `fonts/` — Vendored DejaVu fonts for diagram rendering
- `manual_test_diagrams/` — Manual diagrammer test scripts
- `scripts/` — Developer utilities (`watch.sh`, `setup.sh`, `display_image.sh`, git hooks)
- `tests/` — Test inputs, reference outputs, isolated npm dependencies, and Puppeteer visual regression suite
- `web/` — Zero-build web frontend:
  - `web/ace/` — ACE editor and diagrammer highlight rules
  - `web/arrows/` — Arrow styles and SVGs
  - `web/css/` — Web styles
  - `web/icons/` — UI node icons
  - `web/types/` — Vertex shape definitions and icons
  - `web/visualizations/` — Client-side visualization drivers (D3, GoJS, Viz.js, mscgen)
  - `web/index_template.html` & `web/index.html` — Web application entry point

# Quick Start & Installation

### 1. Build
Requires Rust 1.70+ and `wasm-pack`:
```bash
make all
```

### 2. Start Web Interface
Run the embedded HTTP server:
```bash
./diagrammer serve 8000
```
Then navigate to `http://localhost:8000/`.

### 3. Command Line Usage
```bash
# Generate visualizer code
./diagrammer dot tests/test_inputs/state.txt

# Render visual image output
./diagrammer dot tests/test_inputs/state.txt -o out.png
echo 'a>b>c' | ./diagrammer dot -o out.png
```

### 4. Running Tests
```bash
# Core Rust unit and golden parity tests
cargo test --manifest-path crates/diagrammer-core/Cargo.toml

# Browser visual snapshot regression tests
make -C tests jesttests
```

## Developer Docs
This repository also includes:
- [`AGENTS.md`](file:///Users/ede/src/diagrammer/AGENTS.md) — Repo entry points, build/run/test commands, and quick navigation guidance
- [`DEVELOPMENT.md`](file:///Users/ede/src/diagrammer/DEVELOPMENT.md) — Development setup, build rules, CLI/web workflows, and recommended flow
- [`TESTING.md`](file:///Users/ede/src/diagrammer/TESTING.md) — Test workflows, runnable commands, and regression runner details
- [`NOTES.md`](file:///Users/ede/src/diagrammer/NOTES.md) — In-depth technical analysis, architecture, visualizer matrix, and developer notes


