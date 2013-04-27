%lex
/* https://github.com/zaach/jison/wiki/Deviations-From-Flex-Bison 
Remember:
non-grouping brackets (?:PATTERN),
positive lookahead (?=PATTERN) and
negative lookahead (?!PATTERN).
Jison adds negative lookahead using /!
"foo" vs ("foo")
*/
%{
/*could have a codeblock here*/
%}

D	[0-9]
C	[A-Za-z_:]
COLOR	"#"[A-Fa-f0-9]{6}
COMMENT ^"//"[^\n]*
NAME	[A-Za-z][A-Za-z_:0-9]*
LABEL	";"[^\n]+(\n)
LISTSEP ","
IMAGE	"/"[A-Za-z0-9]+".png"
SHAPES "actor"|"beginpoint"|"box"|"circle"|"cloud"|"condition"|"database"|"default"|"diamond"|"dots"|"doublecircle"|"ellipse"|"endpoint"|"input"|"loopin"|"loopout"|"mail"|"minidiamond"|"minisquare"|"note"|"record"|"roundedbox"|"square"|"terminator"|"loop"|"loopend"|"loopstart"|"rect"|"rectangle"
STYLES "dotted"|"dashed"|"solid"|"bold"|"rounded"|"diagonals"|"invis"|"singularity"
/*wedged,striped..filled...*/

/*
Could make out?
-> normal
-< inv
-. dot
-.< invdot
-o odot
-| tee

Currently supports only single arrow head and dotted or dashed.
Two special cases for equence diagrams are ellipsis a.a., and event/broadcast a-a

Why so? I want to keep the syntax as "common" as possible, so theoretically a sequence diagram can ge presented with graphviz or vice versa.
Special arrow is /> and </ that denotes a broken signal...
*/
%options flex case-insensitive
%%
/*{COLORLABEL}	return 'COLORLABEL';*/
'"'[^"]+'"'	return 'INLINE_STRING';
"$("[^)]+")"	return 'VARIABLE';
{LABEL}		return 'LABEL';
{SHAPES}	return 'SHAPES';
{STYLES}	return 'STYLES';
\s+		 /* skip WS */
"("|")" /*skip for now*/
{COMMENT}	return 'COMMENT';
{LISTSEP}	return 'LISTSEP';
"link color" return 'LINK_COLOR';
"link textcolor"|"link text color" return 'LINKTEXT_COLOR';
"node color" return 'NODE_COLOR';
"node textcolor"|"node text color" return 'NODETEXT_COLOR';
"group color" return 'GROUP_COLOR';
{COLOR}		return 'COLOR';
^("landscape"|"horizontal"|"lr") return 'LANDSCAPE';
^("portrait"|"vertical"|"td")	return 'PORTRAIT';
"equal"		return 'EQUAL';
"shape"		return 'SHAPE';
"group end"|"}"	return 'GROUP_END';
"group"|"{"		return 'GROUP';
"start"		return 'START';
/* hint about visualizer*/
"generator"	return 'GENERATOR';
"visualizer"	return 'VISUALIZER';
"</"|"/>"|"<.>"|"<->"|"<>"|"<-"|"<."|"<"|"->"|".>"|">"|"-"|"."	return 'EVENT';
{IMAGE}		return 'IMAGE';
{NAME}		return 'NAME';
{D}+		return 'NUMBER';
<<EOF>>		return 'EOF';


