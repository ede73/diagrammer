%lex
D	[0-9]
C	[A-Za-z_]
COLOR	"#"[A-Fa-f0-9]{6}
COMMENT ^"//"[^\n]*

%%

\s+		{ /* skip WS */}
{COMMENT}	{return 'COMMENT';}
"group"		{return 'GROUP';}
"start"		{return 'START';}
">"		{return 'EVENT';}
{COLOR}		{return 'COLOR';}
{C}+{D}*	{return 'STATE';}
{D}+		{return 'NUMBER';}
":".*		{return 'LABEL';}
<<EOF>>		{return 'EOF';}

