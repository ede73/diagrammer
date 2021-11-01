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
state.grammar:			}else if ("parsetree" == generator){
state.grammar:				parsetree(yy);
web/index.js:    } else if (visualizer == "parsetree") {
web/index.js:        parsetreevis(JSON.parse(result.value));
web/index.js:function parsetreevis(jsonData) {
web/index.js:    // remove parsetree ID
web/index.js:    // add parsetree ID
