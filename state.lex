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
collectNextNode=undefined;
%}

D	[0-9]
C	[A-Za-z_:]
COLOR	"#"[A-Fa-f0-9]{6}
COMMENT ^"//"[^\n]*
COMPASS ":"("nw"|"ne"|"n"|"sw"|"se"|"s"|"e"|"w")
NAME	[A-Za-z][A-Za-z_0-9]*
LABEL	";"[^\n]+(\n)
/*IN GROUP should return last ENDL*/
GLABEL	";"[^\n]+
LISTSEP ","
IMAGE	"/"[A-Za-z0-9]+".png"
SHAPES "actor"|"beginpoint"|"box"|"circle"|"cloud"|"condition"|"database"|"default"|"diamond"|"dots"|"doublecircle"|"ellipse"|"endpoint"|"input"|"loopin"|"loopout"|"mail"|"minidiamond"|"minisquare"|"note"|"record"|"roundedbox"|"square"|"terminator"|"loop"|"loopend"|"loopstart"|"rect"|"rectangle"
STYLES "dotted"|"dashed"|"solid"|"bold"|"rounded"|"diagonals"|"invis"|"singularity"
/*wedged,striped..filled...*/
IF	"if"\s+.*"then"(?=\n)
ELSEIF	"else"\s*"if"\s+.*"then"(?=\n)
ELSE	"else"(?=\n)
ENDIF	"end"\s*"if"(?=\n)

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
%x GROUP
%options flex case-insensitive
%%
/*{COLORLABEL}	return 'COLORLABEL';*/
'"'[^"]+'"'	return 'INLINE_STRING';
<INITIAL,GROUP>"$("[^)]+")"	return 'VARIABLE';
{IF}		return 'IF';
{IF_CLAUSE}	return 'IF_CLAUSE';
{ELSEIF}	return 'ELSEIF';
{ELSE}		return 'ELSE';
{ENDIF}		return 'ENDIF';
<GROUP>{GLABEL}		return 'LABEL';
{LABEL}		return 'LABEL';
{SHAPES}	return 'SHAPES';
{STYLES}	return 'STYLES';
<GROUP>[\n]	this.begin('INITIAL');return 'GROUP_DECLARATION_END';
<GROUP>[ \t]+	/*skip*/
\s+		 /* skip WS */
"("|")" /*skip for now*/
{COMMENT}	return 'COMMENT';
{LISTSEP}	return 'LISTSEP';
"link color" return 'LINK_COLOR';
"link textcolor"|"link text color" return 'LINKTEXT_COLOR';
"node color" return 'NODE_COLOR';
"node textcolor"|"node text color" return 'NODETEXT_COLOR';
"group color" return 'GROUP_COLOR';
<INITIAL,GROUP>{COLOR}		return 'COLOR';
^("landscape"|"horizontal"|"lr") return 'LANDSCAPE';
^("portrait"|"vertical"|"td")	return 'PORTRAIT';
"equal"		return 'EQUAL';
"shape"		return 'SHAPE';
"group end"|"}"	return 'GROUP_END';
"group"|"{"		{ this.begin('GROUP');return 'GROUP';} 
/*"group"|"{"		return 'GROUP';*/
"start"		return 'START';
/* hint about visualizer*/
"generator"	return 'GENERATOR';
"visualizer"	return 'VISUALIZER';
"</"|"/>"|"<.>"|"<->"|"<>"|"<-"|"<."|"<"|"->"|".>"|">"|"-"|"."	return 'EVENT';
{IMAGE}		return 'IMAGE';
{COMPASS}	return 'COMPASS';
{NAME}		{
			//FUCKSAKE! unput is broken, fixed MONTH ago, not seen in npm..fuck fuck
			// https://github.com/zaach/jison/pull/135
			//I CANNOT see it in npm install, and it is NOT seen in jison master branch, but jison-lex..does not show it EITHER
			//but PR merged 3 months ago!WTF..Manually fixed to
//  nano /usr/local/share//npm/lib/node_modules/jison/node_modules/jison-lex/regexp-lexer.js
//  nano /usr/local/share//npm/lib/node_modules/jison-lex/regexp-lexer.js
			var c=this.input();
			if (c==":"){
				var c1=this.input();
				var c2=this.input();
				if (c1+c1=="ne" || c1+c2=="nw" || c1+c2=="se" || c1+c2=="sw"
					|| (c1.match(/[ensw]/) && c2.match(/\s/))){
					this.unput(c2);
					this.unput(c1);
					this.unput(c);
					return 'NAME';
				}
				//read as long as A-Z0-9_
				while(true){
					var cz=this.input();
					if (!cz.match(/[A-Za-z_0-9]/i)) {
						if (!cz.match(/\n/)) this.unput(cz);
						break;
					}
				}
				return 'NAME';
			}else{
				this.unput(c);
				return 'NAME';
			}
		}
<GROUP>{NAME}		return 'GROUPNAME';
{D}+		return 'NUMBER';
<<EOF>>		return 'EOF';


