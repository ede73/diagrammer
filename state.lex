%lex
D	[0-9]
C	[A-Za-z_]

%%

\s+		{ /* skip WS */}
"group"		{return 'GROUP';}
"start"		{return 'START';}
">"		{return 'EVENT';}
{C}+{D}*	{return 'STATE';}
{D}+		{return 'NUMBER';}
":".*		{return 'LABEL';}
<<EOF>>		{return 'EOF';}

%left '>'
