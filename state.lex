%lex
D	[0-9]
C	[A-Za-z_:]
COLOR	"#"[A-Fa-f0-9]{6}
COMMENT ^"//"[^\n]*
NAME	[A-Za-z][A-Za-z_:0-9]*
LABEL	";".*
%%

\s+		{ /* skip WS */}
{COMMENT}	{return 'COMMENT';}
"HORIZONTAL"|"LR" {return 'LEFT_RIGHT';}
"VERTICAL"|"TD"	{return 'TOP_DOWN';}
"shape"		{return 'SHAPE';}
"group end"	{return 'GROUP_END';}
"group"		{return 'GROUP';}
"start"		{return 'START';}
">"		{return 'EVENT';}
{COLOR}		{return 'COLOR';}
{NAME}		{return 'STATE';}
{D}+		{return 'NUMBER';}
{LABEL}		{return 'LABEL';}
<<EOF>>		{return 'EOF';}

