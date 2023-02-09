#Build the fucker!
#Automatic variables: http://www.chemie.fu-berlin.de/chemnet/use/info/make/make_10.html#SEC94
#Loosely based on makeLexerAndParser.js
#Also you get MATCHES=a/b/c.file:c/b/d.file
#And DIRNAMES=a/:c/
all: build/lexer.js build/diagrammer.all build/diagrammer_parser.js Makefile
	@echo Make ALL
	@echo done

build/lexer.js: grammar/diagrammer.lex
	@mkdir -p build
	@echo Make build/lexer.js from LEX
	@jison-lex $< -o $@
	@echo "exports.lexer=lexer;" >> $@
	#@mv $@ a;uglifyjs a -c -m -o $@;rm a|grep -v WARN

build/diagrammer.all: grammar/diagrammer.lex grammar/lexmarker.txt grammar/diagrammer.grammar model/support.js model/model.js model/graphobject.js model/graphvertex.js model/graphgroup.js model/graphcanvas.js model/graphedge.js model/shapes.js model/graphinner.js model/tree.js generators/*.js
	@mkdir -p build
	@echo Compile build/diagrammer.all
	@cat $^ >$@

build/diagrammer_parser.js: build/diagrammer.all
	@mkdir -p build
	@echo make parser
	@jison $< -o $@
	#@mv $@ a;uglifyjs a -c -m -o $@;rm a|grep -v WARN

.PHONY: export
export: build/lexer.js build/diagrammer_parser.js js/diagrammer.js
	@./scripts/export.sh
	@echo 'Add alias depict="~/{EXPORT_DIR_HERE}/t.sh silent " to your profile/bashrc etc.\nYou need (depending) visualizers graphviz,mscgen,plantuml.jar,nwdiag,blockdiag,actdiag.\nplantuml requires java\nblockdiag etc. in http://blockdiag.com/en/blockdiag/introduction.html\nPlantuml from http://plantuml.sourceforge.net/\n' >export/README.txt

.PHONY: test
test: all
	@mkdir -p tests/test_outputs
	./scripts/runtests.sh
	#Shortcut without need to define every occurance of test files
	@echo matches are "$(MATCHES)" dirnames are "$(DIRNAMES)"

clean:
	rm -f build/*
