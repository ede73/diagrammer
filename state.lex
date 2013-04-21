%lex
/* https://github.com/zaach/jison/wiki/Deviations-From-Flex-Bison */
D	[0-9]
C	[A-Za-z_:]
COLOR	"#"[A-Fa-f0-9]{6}
COMMENT ^"//"[^\n]*
NAME	[A-Za-z][A-Za-z_:0-9]*
LABEL	";"[^\n]+(\n)
LISTSEP ","
IMAGE	"/"[A-Za-z0-9]+".png"
/*COLORLABEL	";#"[A-Fa-f0-9]{6}[^\n]+(\n)*/
SHAPES "actor\s"|"beginpoint"|"box"|"circle"|"cloud"|"condition"|"database"|"default"|"diamond"|"dots"|"doublecircle"|"ellipse"|"endpoint"|"input"|"loopin"|"loopout"|"mail"|"minidiamond"|"minisquare"|"note"|"record"|"roundedbox"|"square"|"terminator"|"loop"|"loopend"|"loopstart"|"rect"|"rectangle"
STYLES "dotted"|"dashed"|"solid"
/*
Could make out
-> normal
-< inv
-. dot
-.< invdot
-o odot
-| tee
*/
%options flex
%%
/*{COLORLABEL}	return 'COLORLABEL';*/
"$("[^)]+")"	return 'VARIABLE';
{LABEL}		return 'LABEL';
{SHAPES}	return 'SHAPES';
{STYLES}	return 'STYLES';
\s+		 /* skip WS */
"("|")" /*skip for now*/
{COMMENT}	return 'COMMENT';
{LISTSEP}	return 'LISTSEP';
"link color" return 'LINK_COLOR';
"node color" return 'NODE_COLOR';
"group color" return 'GROUP_COLOR';
{COLOR}		return 'COLOR';
^("landscape"|"horizontal"|"lr") return 'LANDSCAPE';
^("portrait"|"vertical"|"td")	return 'PORTRAIT';
"equal"		return 'EQUAL';
"shape"		return 'SHAPE';
"group end"	return 'GROUP_END';
"group"		return 'GROUP';
"start"		return 'START';
/* hint about visualizer*/
"generator"	return 'GENERATOR';
"visualizer"	return 'VISUALIZER';
"<.>"|"<->"|"<>"|"<-"|"<."|"<"|"->"|".>"|">"|"-"|"."	return 'EVENT';
{NAME}		return 'NAME';
{IMAGE}		return 'IMAGE';
{D}+		return 'NUMBER';
<<EOF>>		return 'EOF';


