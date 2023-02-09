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
- Language grammar / lexical rules in grammar/
- Highlighting interactive editor in ace/
- Diagrammer language makes an abstract syntax tree representation, that generators the make for the visualizer to draw out
- tests/ lot of tests to ensure the changes in grammar don't introduce bugs

# Web Interface

I just run this locally (in my Mac or in my Windows on WSL2/Ubuntu)

Example TCP state diagram in the editor

<img width=60% src="https://user-images.githubusercontent.com/1845554/216884833-b2f23d32-7f8b-48cc-b1dd-c6b6d7679c6f.png">

And output

<img width=30% src="https://user-images.githubusercontent.com/1845554/216884941-9cb3c597-c6d7-42f4-9564-3c69cd936370.png">

You can select different visualizers from the drop down (without changing your diagram)

<img width=200 src="https://user-images.githubusercontent.com/1845554/216885102-38ef5450-ecf0-4583-945e-f1b7954eb674.png">

Plenty of examples (also used in tests)

<img width=200 src="https://user-images.githubusercontent.com/1845554/216885127-25ba26bb-194d-4c92-b610-e33999ea005c.png">

You can use brower's localstorage to save the diagrams (and load them). You can also export/import then to the 'backend' if needed (requires apache/php)

<img width=200 src="https://user-images.githubusercontent.com/1845554/216885227-edf5800a-0585-4df1-b8c9-f022f459d670.png">

And if you don't remember how exactly in diagrammer language something was done, you can just click the shapes, arrows, types and it'll output that in the editor

<img width=200 src="https://user-images.githubusercontent.com/1845554/216885357-8a1ba706-05ad-41a9-abf9-95745a2f884c.png">

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
alink;Edge | { edgetype | left | right}
agroup;Group | { name | OBJECTS[] | ROOTVERTICES[] | edgelabel | "defaults"}
asubgraph;SubGraph | { name | OBJECTS[] | ROOTVERTICES[] | edgelabel | entrance | exit | "defaults"}

avertex>"inherit"graphobject
alink>"inherit"graphobject
agroup>"inherit"graphobject
asubgraph>"inherit"graphobject

graphroot;GraphRoot | {OBJECTS[] | ROOTVERTICES[] | generator | visualizer | (current)shape | direction | start | equal | "defaults"}

graphobject->"many:1"graphroot
```

<img width=30% src="https://user-images.githubusercontent.com/1845554/217098499-26c7b5ce-8f97-4b5e-b2a3-175cb35697d8.png">

## GraphRoot
Represents the diagram/graph and necessary properties excluding Edges (stored separately)

Holds all the objects and rootvertices. The diagram may have more than one root vertex, not all visualizers support these though!

It also holds the chosen generator (e.g. graphviz) / visualizer (e.g. circo).

It has list of vertices marked equal - if any.

Which direction the graph is to be drawn - if specified.

What's the current default shape - only used during parsing the diagrammer languge while generating vertices.

AST/Model note. Edges are not stored in GraphRoot, but separately! Why? It's easier to handle them in the generators and vertices and edges are output separately to separate sections anyway.

GraphRoot:
- OBJECTS[GraphVertex(a), SubGraph(GraphVertex(b), GraphVertex(c), GraphVertex(d), Group(GraphVertex(f), GraphVertex(g)))]
- ROOTVERTICES[GraphVertex, SubGraph] # this graph has two root vertices
- generator digraph
- visualizer circo
- shape ..
- start ..
- equals ..
- defaults ..


## GraphObject
Represents all the objects in the diagram.

## Edge (link)
Represents edge between two objects(vertices or groups) and all related visualization properties associated with the edge.

Own properties are edgetype, left- and righthand sides (+GraphObject properties)

Edges are stored separately and available for the generator in yy.EDGES

## GraphVertex

Own properties are name, shape, image - if specified, style - if specified (+GraphObject properties)

## Group

Own properties are name, edgelabel, defaults and list of OBJECTS and ROOTVERTICES.

## SubGraph
Only used to represented "sub graphs" ie. like in :
```
a>(b,c,d>(f,g))
```

Ie. a graph where output vertex is connected to all the inner vertices.

That constructs

GraphRoot:
- OBJECTS[GraphVertex(a), SubGraph(GraphVertex(b), GraphVertex(c), GraphVertex(d), SubGraph(GraphVertex(f), GraphVertex(g)))]
- ROOTVERTICES[same as objects]
- generator
- visualizer
- shape
- start
- equals
- defaults

Own properties are name, edgelabel, defaults and list of OBJECTS and ROOTVERTICES, entrance and exit.

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
- ace - The ACE editor, and diagrammer highlight rules
- arrows - Diagrammer arrow styles (icons for UI)
- build - Jison grammar parser + other derivatives..built
- css - Stylesheets
- export - make export makes minimal distribution here
- ext - External dependencies, CanViz/PlantUml
- generators - Converting diagrammer AST to **any graph visualizer language** you can come up with
- grammar - Lex + Grammar of diagrammer
- icons - Some copyleft icons for UI
- index.html - Web UI main
- js - The diagrammer parser (also transpiled mscgen, graphviz)
  - mscgen / graphviz visualize the graphs in the Web UI in realtime without any backend support, but not required. I was hoping to build backendless visualization, all in browser. And that's what it does, but had I wanted to go all the way..PlantUML, python3 nwdiag/actdiag..etc. uh. 
- manual_test_diagrams - some diagrammer tests during development, not tied to tests
- model - Diagrammer parser converts diagrammer language to this AST model comprising of vertex, edge, shapes, subgraph (, graphobject, graphroot, tree, support)
- scripts - Some utility scripts for building, testing, exporting
- setup - setup related
- tests - All the test files, diagrammer language inputs, reference renderings, transpiled outputs. 
  - Test generates all the test files using all the (related) visualizations, and then does output text + output graph comparison. Super useful if you need to change the grammar, ensures the ever used to work, still does :)
- types - web UI icons for adding vertex shapes
- web - PHP Web Backend, provides access to backend renderers like PlantUml, mscgen (the C version), Python3 *diags, etc. Also provides import/export. Not needed for comman line use

# Installation
Totally at your own risk!
I've run this on Linux/Mac, but most recedntly on windows via its awesomely magnificient linux sub WSL2, which also integrates beautifully with Visual Studio Code! Just enter the linux subsystem, pull the repo, type "code ." and You've VSStudio available.

Run scripts/setup.sh (or check it and run by hand). It installs required modules, apache2, php. Latter two are NOT required if you don't need the Web UI.

For me, apache2 config went all the way nicely, userdirectories where available, just had to enable PHP in userdirs, by commenting out few lines in php configs.


```
cd ~/diagrammer
ln -s diagrammer ~/public_html/ # or ~/Sites on mac
make all
# You need plantuml.jar in ext/ to run all the tests successfully
# make test
```

Then go to http://localhost/~USERNAMEHERE/diagrammer

And you should be ready to go.

There's also scripts/export.sh that makes a minimal 'distribution' you can copy someplace and use the t.sh to render the graphs.

# External project references:
- https://github.com/ajaxorg/ace-builds
  - Source of js/viz.js, you'll see the web page drawing graphviz graphs in "real time"
  - Not necessary to use diagrammer 
- https://github.com/ajaxorg/ace-builds
  - Highlighting editor - if you use the web interface
  - Not necessary for command line use 
  - Base ACE editor included in ace/src-noconflict folder
- https://github.com/zaach/jison
  - Parser maker for Javascript  

