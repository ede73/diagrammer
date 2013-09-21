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






================== FLOW CHART ======================
input a,b,c

if;is a>b
 if;is a>c
  output;print a
 else
  output;print c
 fi
else
 if;is b>c
  persist;save b
 else
  output;print b
 fi
fi

end


How about this?
- Commands: input, output, save, load, end, event, decision, chance
- decision & chance make a new context (and a named node)
- chance ties to a NAMED decision
- all commands bind to current context
- group? Automatically POPS to start context at the end
- need for break?

input;a,b,c

group a
decision a;is a>b
  chance a;yes
    decision b;is a>c
      chance b;yes
        output;print a
      chance b;no
	event dd;print c
  chance a;no
    decision c;is b>c
      chance c;yes
        save;save b
      chance c;no
        load;load xxx

group end

group 2
  d;xxx yyy
  
group end
