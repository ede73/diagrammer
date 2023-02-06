# Introduction
I'm a visual learner and I've always liked visual representation instead of reading boring endless blahblah from a book.

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

Make one graph/diagram, and it **can't be re-used** anywhere :) Not without a lot of editing.
Add a visualization to your document, and it's on track to be outdated. But You don't want to update it, because it is **hard to maintain**.
Also **privacy**, many visualization tools are available, but would you use that to visualize your secrets? You've no control over how the remote site might use information on your graph.

And not limited there, but who ever designed those graph representations in the first place didn't think of simplicity. Some are really awkward to write and learn.
(Of course in the end, this project is no exception :) )

All the graphs have something in common, they describe simple relations between edges and nodes.

a > b > c < d

Also lot of other interesting things popped up and was available 2013 :)
LLVM! Anything to anything transpiler (well kinda). Node, javascript on server side. JISON! Lexer/Grammar for JS!

That's so cool! I could have graphviz run in browser! And I could use the SAME rendering engine from command line.

AND I could finally design a proper lexer/parser for the language to be.

# Diagrammer

Main components:
- Language grammar / lexical rules in grammar/
- Highlighting interactive editor in ace/
- Diagrammer language makes an abstract syntax tree representation, that generators the make for the visualizer to draw out
- tests/ lot of tests to ensure the changes in grammar don't introduce bugs

## External project references:
- https://github.com/ajaxorg/ace-builds
  - Source of js/viz.js, you'll see the web page drawing graphviz graphs in "real time"
  - Not necessary to use diagrammer 
- https://github.com/ajaxorg/ace-builds
  - Highlighting editor - if you use the web interface
  - Not necessary for command line use 
  - Base ACE editor included in ace/src-noconflict folder
- https://github.com/zaach/jison
  - Parser maker for Javascript  

