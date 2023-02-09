#Build the fucker!
#Automatic variables: http://www.chemie.fu-berlin.de/chemnet/use/info/make/make_10.html#SEC94
#Loosely based on makeLexerAndParser.js
#Also you get MATCHES=a/b/c.file:c/b/d.file
#And DIRNAMES=a/:c/
# $@ = name of the target being generated
# @^ list of dependencies on the target

GRAMMAR_FILES = grammar/diagrammer.lex grammar/lexmarker.txt grammar/diagrammer.grammar
MODEL_CLASSES = model/graphobject.js model/graphvertex.js model/graphgroup.js model/graphcanvas.js model/graphedge.js model/graphinner.js

all: build/diagrammer_lexer.js build/diagrammer.all build/diagrammer_parser.js Makefile $(GRAMMAR_FILES) $(MODEL_CLASSES)
	@echo Make ALL
	@echo done

build/diagrammer_lexer.js: grammar/diagrammer.lex
	@mkdir -p build
	@echo Make build/diagrammer_lexer.js from LEX
	@jison-lex $< -o $@
	@echo "exports.diagrammer_lexer=diagrammer_lexer;" >> $@
	#@mv $@ a;uglifyjs a -c -m -o $@;rm a|grep -v WARN


build/diagrammer.all: $(GRAMMAR_FILES) model/model.js model/shapes.js model/tree.js generators/*.js
	@mkdir -p build
	@echo Compile build/diagrammer.all
	@cat $^ >$@

build/diagrammer_parser.js: build/diagrammer.all Makefile
	@mkdir -p build
	@echo make parser
	@jison $< -o $@
	sed -i "1 i\\\\" $@
	sed -i "1 i\var collectNextVertex;" $@
	sed -i "1 i\var visualizations;" $@
	sed -i "1 i\var generators;" $@
	sed -i "1 i\\\\" $@
	sed -i "1 i\import * as model from '../model/model.js';" $@
	sed -i "1 i\import {iterateEdges, outputFormattedText, getAttributeAndFormat, output, getAttribute, setAttr, debug} from '../model/support.js';" $@
	sed -i "1 i\import {GraphInner} from '../model/graphinner.js';" $@
	sed -i "1 i\import {GraphEdge} from '../model/graphedge.js';" $@
	sed -i "1 i\import {GraphCanvas} from '../model/graphcanvas.js';" $@
	sed -i "1 i\import {GraphGroup} from '../model/graphgroup.js';" $@
	sed -i "1 i\import {GraphVertex} from '../model/graphvertex.js';" $@
	sed -i "1 i\import {GraphObject} from '../model/graphobject.js';" $@
	#@mv $@ a;uglifyjs a -c -m -o $@;rm a|grep -v WARN
	echo '{"type":"module"}' > build/package.json
	sed -i 's/^var diagrammer_parser/export var diagrammer_parser/g' $@
	sed -i 's/exports.diagrammer_lexer=diagrammer_lexer;//g' build/diagrammer_lexer.js
	sed -i 's/^var diagrammer_lexer/export var diagrammer_lexer/g' build/diagrammer_lexer.js
	sed -i "1 i\var collectNextVertex;" build/diagrammer_lexer.js

.PHONY: export
export: build/diagrammer_lexer.js build/diagrammer_parser.js js/diagrammer.js
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
