%lex
/* https://github.com/zaach/jison/wiki/Deviations-From-Flex-Bison */
D	[0-9]
C	[A-Za-z_:]
COLOR	"#"[A-Fa-f0-9]{6}
COMMENT ^"//"[^\n]*
NAME	[A-Za-z][A-Za-z_:0-9]*
LABEL	";"[^\n]+(\n)
%%

{LABEL}		{return 'LABEL';}
\s+		{ /* skip WS */}
{COMMENT}	{return 'COMMENT';}
{COLOR}		{return 'COLOR';}
"HORIZONTAL"|"LR" {return 'LEFT_RIGHT';}
"VERTICAL"|"TD"	{return 'TOP_DOWN';}
"shape"		{return 'SHAPE';}
"group end"	{return 'GROUP_END';}
"group"		{return 'GROUP';}
"start"		{return 'START';}
">"		{return 'EVENT';}
{NAME}		{return 'NAME';}
{D}+		{return 'NUMBER';}
<<EOF>>		{return 'EOF';}
