make all -Bnd|grep -v tests/test_inputs|./make2graph |dot -Tpng -ograph.png

Something is totally broken in tsc, started generating shitloads of errors from totally unrelated modules!

I can delete node_modules and still get a clean compile, so I'm not even depending on these shits:
https://github.com/microsoft/TypeScript/issues/40426
tsc -p tsconfig.json|grep node_modules|cut -d: -f1|cut -d'(' -f1|sort|uniq
../node_modules/@types/babel__core/index.d.ts
../node_modules/@types/babel__generator/index.d.ts
../node_modules/@types/babel__template/index.d.ts
../node_modules/@types/babel__traverse/index.d.ts
../node_modules/@types/jest/index.d.ts
../node_modules/puppeteer/lib/types.d.ts



apt-get install make jison graphviz wslu # for debian 
# sudo apt install openjdk-18-jre # if you want plantuml
brew install graphviz --with-pango

http://www.gnu.org/software/make/manual/html_node/Foreach-Function.html#Foreach-Function
http://www.chemie.fu-berlin.de/chemnet/use/info/make/make_10.html#SEC94
Icons from http://openiconlibrary.sourceforge.net/
PlantUML

GOES LIKE THIS(as You see, still A LOT of boiler plate code...)..see below after ====

COuld be... (okay..this IS unreable!)
a>"is running"ab(>"YES"end)>"NO"b>"last download exists"bc>"No"c,end

LINEFED it looks like

a>"is running"
  ab>"No"
    b>"last download exists"
       bc>"No"c
ab>"Yes"end
bc>"Yes"end

which actually is already achieved by ...so is there really a point?
a>ab;is running
  ab>b;No
    b>bc;last download exists
       bc>c;No
ab>end;Yes
bc>end;Yes

=====
shape box
group begin#dddddd 
 a;is running 
 b;check last download
 c;Make a call to testDuplicates()
 shape minidiamond
 ab;x
 bc;x
 shape box
 end
 a>ab;is running
 ab>b;No
 b>bc;last download exists
 bc>c;No
 ab>end;Yes
 bc>end;Yes
group end 

group main 
 m;Main loop
 d;Get download link
 ctd;Call testDuplicates 
 s;Save download link
w;WGET the file
mp;Make program downloaded
shape minidiamond
wmp;
shape box
 m>d>ctd>s>w
w>wmp;failure?
wmp>mp;no
wmp>end;YES
ddl;Delete download link
mp>ddl
tdoa;Test duplicates once again
up;Update page
uf;Update folders
ddl>tdoa>up>uf
group end
c>m 
==========
Almost like...

<plantuml>
partition start {
(*)  --> "is running"
If "is running" then
--> [Yes] (*)
else
--> [No] "check last download"
Endif
If "last download exists" then
--> [Yes] (*)
else
--> [No] "Make a call to testDuplicates()"
}

partition main {
--> "Main loop"
--> "Get download link"
note right
elisasync.py -1 -n -e -d speed
If exit code <>0 exit the program
end note
--> "Call testDuplicates()"

--> "Save downloadlink"
--> "WGET the file"
if "failure" then
--> [No] (*)
else
--> [Yes] "Mark program downloaded"
note right
elisasync.py -pi pid -m size
end note
--> "Delete downloadlink"
endif

--> "testDuplicates() once again"
--> "updatePage.sh"
note right
python elisasync.py -lf -r 3 -n
Format download page for encoded files (hi/lo res)
end note
--> "updateFolders.sh"
note right
elisasync.py -lf -r 3 -n
end note
--> "Main loop"
-->(*)
}

========================
make new generator

generators/parsetree.js:function parsetree(yy) {
index.html:			<option value="parsetree">ParseTree(GoJS)</option>
grammar/diagrammer.grammar:			}else if ("parsetree" == generator){
grammar/diagrammer.grammar:				parsetree(yy);
web/index.js:    } else if (visualizer == "parsetree") {
web/index.js:        parsetreevis(JSON.parse(result.value));
web/index.js:function parsetreevis(jsonData) {
web/index.js:    // remove parsetree ID
web/index.js:    // add parsetree ID
a>b>(c d>e f>g h)>(s>k)

// So when parser goes thru creating AST for this graph, it proceeds as:
// a => make vertex (add to objects, rootvertices)
// b => make new vertex (add to objects, rootvertices)
// > => make new edge connecting a and b
// # remove b from rootvertices
// ( => enter a new subgraph(1), add b as entrance node
// > => link node b into subgraph(1) - BTW If moving to storing EDGEs in object stream, this ordering is WRONG (grammar parsers processes this way)
//      but end result of this kind of means edge connecting b and now inner subgraph will be IN the subgraph, where in fact it sits outside
// c => make vertex (add to objects, rootvertices)
// ...
// h
// exit subgraph 1 (entrance b)
//   replace  edge from b to subgraph 1 with..
//     b>c
//     b>d
//     b>f
//     b>h
//  subgraph 1 exit node will be h
//  TODO: should have also remove the nodes from rootvertices (can be roots, they've incoming links)
//  TODO: Add this a s property of Edge, when ever it RHS links Vertex, it's parent container will automatically remove edge from vertices
//  Also mark that then 2nd link on the example above looks to be going to 'wrong container'
//
// And once exiting last innergraph
//  Replace 2nd last edge, that links the inner sub 1 to inner sub 2 with
//    Inner sub 1 > s
// So in other words EXACT graph as depicted:
// 
//  a>b>|------------|
//	|c d>e f>g h |
//	|------------|
//      \
//	 s>k
//
// But with modifications presented it becomes:
// |-------------
// |a>b_______  |
// | / |  \   \ |
// | c d>e f>g h|
// |------------|
//  \
//   s>k
// 
// This is how I wanted the language snippet be interpreted
//
// NOW, if I want to convert the language to AST and that BACk to the language (it should be doable :) )
// it may be ambiguous, as the resulting graph could be defined in many ways
//
// Also how the linking of the subgroups should be though? Since it only links  
//
// If last part of the graph would be (s k) ie. no link connecting them, ie. making them root vertices of their own inner graph..or individual sbutrees
// THen
// |------------|
//  \__ 
//   s k
// Group would connect to both, s and k
//
// Anyway, the point of the AST to is represent what the diagrammer language is supposed to represent, NOT to be exact precision storage of
// the lexical elements of the languagen:)
//
//relinkInnerSubgraphEntryAndExit
//	SubGraph(name:1, entrance:Vertex(name:b),
//	rootvertices:Vertex(name:c),Vertex(name:d),Vertex(name:f),Vertex(name:h))
//  Remove edge Edge(type:> as 	L:Vertex(name:b), 
//				R:SubGraph(name:1, entrance:Vertex(name:b),
//				rootvertices:Vertex(name:c),Vertex(name:d),Vertex(name:f),Vertex(name:h)), label=undefined)
//  Add new edge Edge(type:> as L:Vertex(name:b), R:Vertex(name:c),label=undefined)
//  Add new edge Edge(type:> as L:Vertex(name:b), R:Vertex(name:d),label=undefined)
//  Add new edge Edge(type:> as L:Vertex(name:b), R:Vertex(name:f),label=undefined)
//  Add new edge Edge(type:> as L:Vertex(name:b), R:Vertex(name:h),label=undefined)
//
//relinkInnerSubgraphEntryAndExit SubGraph(name:2,entrance:
//	SubGraph(name:1, entrance:Vertex(name:b), exit:Vertex(name:h),
//		rootvertices:
//			Vertex(name:c),
//			Vertex(name:d),
//			Vertex(name:f),
//			Vertex(name:h)),
//	rootvertices:
//		Vertex(name:s))
//  Remove edge Edge(type:> as 	L:SubGraph(name:1, entrance:Vertex(name:b), exit:Vertex(name:h), rootvertices:Vertex(name:c),Vertex(name:d),Vertex(name:f),Vertex(name:h)),
//				R:SubGraph(name:2, entrance:SubGraph(name:1,entrance:Vertex(name:b), exit:Vertex(name:h), rootvertices:Vertex(name:c),Vertex(name:d),Vertex(name:f),Vertex(name:h)),rootvertices:Vertex(name:s)),label=undefined)
//  Add new edge Edge(type:> as L:SubGraph(name:1, entrance:Vertex(name:b), exit:Vertex(name:h), rootvertices:Vertex(name:c),Vertex(name:d),Vertex(name:f),Vertex(name:h)),
//				R:Vertex(name:s), label=undefined)
//msc {
//    a,b,c,d,e,f,g,h,s,k;
//    a=>b[id="1"];
//    b=>c[id="2"];
//    b=>d[id="3"];
//    b=>f[id="4"];
//    b=>h[id="5"];
//    d=>e[id="6"];
//    f=>g[id="7"];
//    1=>s[id="8"];
//    s=>k[id="9"];
//}

