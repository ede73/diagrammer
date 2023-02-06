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
```
a > b > c < d
```

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

# Web Interface

I just run this locally (in my Mac or in my Windows on WSL2/Ubuntu)

Example TCP state diagram in the editor
![image](https://user-images.githubusercontent.com/1845554/216884833-b2f23d32-7f8b-48cc-b1dd-c6b6d7679c6f.png)

And output
![image](https://user-images.githubusercontent.com/1845554/216884941-9cb3c597-c6d7-42f4-9564-3c69cd936370.png)

You can select different visualizers from the drop down (without changing your diagram)
![image](https://user-images.githubusercontent.com/1845554/216885102-38ef5450-ecf0-4583-945e-f1b7954eb674.png)

Plenty of examples (also used in tests)
![image](https://user-images.githubusercontent.com/1845554/216885127-25ba26bb-194d-4c92-b610-e33999ea005c.png)

You can use brower's localstorage to save the diagrams (and load them). You can also export/import then to the 'backend' if needed (requires apache/php)
![image](https://user-images.githubusercontent.com/1845554/216885227-edf5800a-0585-4df1-b8c9-f022f459d670.png)

And if you don't remember how exactly in diagrammer language something was done, you can just click the shapes, arrows, types and it'll output that in the editor
![image](https://user-images.githubusercontent.com/1845554/216885357-8a1ba706-05ad-41a9-abf9-95745a2f884c.png)

# The language

I wanted the diagrammer be super easy to use and get going, but with ability for expressivity and visual help (colors, texts, notes).

## Nodes and edges(links)

In diagrammer you write the graph as
```
a>b>c<d<e<(f,g,h)
```

That gived you graph:
![image](https://user-images.githubusercontent.com/1845554/216885697-fbd13681-b728-41da-bfa9-9ee6be5a0f69.png)

### Node text
You can change text of the code by declaring it somewhere as
```
a;This is a node
```

It doesn't matter where the statement is. There's no error resolution, last declaration stands.

### Node shape
Shape declaration is added LHS of the node
```
box a
diamond b
```
Same rules as with text, last used declaration stands.

You can also use special syntax:
```
shape box
```
Which will make all the rest of the shapes be boxes. Statement can appead many times, always shaping the next introduced nodes as such.

### Node colors
Well everyone needs a bit of color, so do graphs

```
a#ff0000
```
Make a red node

### Color variables
And changing all the colors is tedious, so we have variable. Of course.

```
$(greencolor:#00ff00)
greennode$(greencolor)
```

### Marking the beginning
```
START nodename
```
May apply to some visualizers, some don't care/support start nodes

### Node equality
Since most visualizers are dynamic, there's little to guide them.
You can mark nodes to be equal to one other.
```
equal nodea, nodeb
```
GraphViz usually tries to obey.

### Grouping
There's two syntaxes (old and new :) )
```
group color #7722ee
group NAME1;Label the group1
//Nodes
  group InnerGroup1#00ff00;Inner group1
  xy1
  group end
group end
```
or
```
{ NAME2#ff0000;Label the group2
//Nodes
  {InnerGroup2#5555ff;Inner group2
  xy2
  }
}```

Gives (on graphviz/dot)
![image](https://user-images.githubusercontent.com/1845554/216887257-3e134de7-1434-4392-abb3-f98d43afca20.png)

### Images
SOME visualizers(graphviz/dotty) allow using own icons.
```
a/barcode.png,b/basestation.png,c/battery.png > d/camera.png,e/cpu.png,f/documents.png
...
```
![image](https://user-images.githubusercontent.com/1845554/216887662-1aa6fd1c-e7f8-4a70-9fe0-b3abdf0c13b8.png)

### Edge pointing to a group
Edge can point to a node or two a group. Depending on visualizer group pointing edges may work or not :)

### Edge singularity (aka. invisible node)
```
r>singularity y>splita,splitb
```
![image](https://user-images.githubusercontent.com/1845554/216887887-fa72462d-e6fa-4f41-97bb-d464e7815eb8.png)

### Edge compass
Some visualizer allow hinting where to connect the edge if possivle

```
a#ff0000:se.>b:s,c:se,d:w,e:ne,f:s,g:nw,h:e,i:sw
```
![image](https://user-images.githubusercontent.com/1845554/216888027-4f633927-9129-489c-af69-b95ef2a5883c.png)

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
a>b;Instead of renaming nodes (since they are connected) this make edge text
c>"signal::and a big\nlined\nnote\nie.multiline edge text"d
e>f;signal::and a big\nlined\nnote\nie.multiline edge text
```

### Edge colors
```
a-$(b:#0000ff)a;jotain kay tassanain
b-$(colorvariable)b;jotain kay tassanain
```

# Project files

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

