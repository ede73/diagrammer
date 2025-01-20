include ../Makefile.commands

all: export

export:
	@$(SHELL) -c "cd ..; ./scripts/export.sh"
	@echo 'Add alias depict="~/{EXPORT_DIR_HERE}/t.js silent " to your profile/bashrc etc.\nYou need (depending) visualizers graphviz,mscgen,plantuml_jar.jar,nwdiag,blockdiag,actdiag.\nplantuml requires java\nblockdiag etc. in http://blockdiag.com/en/blockdiag/introduction.html\nPlantuml from http://plantuml.sourceforge.net/\n' >../export/README.txt

clean:
