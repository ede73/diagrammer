#Build the fucker!
#Automatic variables: http://www.chemie.fu-berlin.de/chemnet/use/info/make/make_10.html#SEC94
#Loosely based on makeLexerAndParser.js
#Also you get MATCHES=a/b/c.file:c/b/d.file
#And DIRNAMES=a/:c/
# $@ = name of the target being generated
# $^ list of dependencies on the target
# $< first dependency on the list

GRAMMAR_FILES = grammar/diagrammer.lex grammar/lexmarker.txt grammar/diagrammer.grammar
MODEL_CLASSES = model/graphobject.js model/graphvertex.js model/graphgroup.js model/graphcanvas.js model/graphedge.js model/graphinner.js model/graphcontainer.js model/graphconnectable.js
MODEL_REST = model/shapes.js model/tree.js

all: build/diagrammer_lexer.js build/diagrammer.all build/diagrammer_parser.js Makefile index.html $(GRAMMAR_FILES) $(MODEL_CLASSES) $(MODEL_REST)
	@echo Make ALL

index.html : index_template.html Makefile generators/*.js tests/test_inputs/*.txt web/visualizations/*.js
	awk '/{REPLACE_WITH_TEST_EXAMPLES}/{ while ("ls tests/test_inputs/*.txt | sort |sed 's,^tests/test_inputs/,,g'" | getline var) printf("<option value=\"test_inputs/%s\">%s</option>\n",var,var);next} /{REPLACE_WITH_WEB_VISUALIZATION_MODULES}/{ while ("ls web/visualizations/*.js | sort" | getline var) printf("<script type=\"module\" src=\"%s\"></script>\n",var);next}/{REPLACE_WITH_GENERATORS}/{ while ("grep \"ADD TO INDEX.HTML AS:\" generators/*.js|sort|cut -d: -f3-|sort" | getline var) printf("%s\n",var,var);next}{print $0}' $< >$@

build/diagrammer_lexer.js: grammar/diagrammer.lex
	@mkdir -p build
	@echo Make build/diagrammer_lexer.js from LEX
	@node_modules/.bin/jison-lex $< -o $@
	@echo "exports.diagrammerLexer=diagrammerLexer;" >> $@
	#@mv $@ a;uglifyjs a -c -m -o $@;rm a|grep -v WARN

build/diagrammer.all: $(GRAMMAR_FILES)
	@mkdir -p build
	@echo Compile build/diagrammer.all
	@cat $^ >$@

build/diagrammer_parser.js: build/diagrammer.all Makefile generators/* model/* js/*
	@mkdir -p build
	@echo make parser
	@node_modules/.bin/jison $< -o $@
	sed -i "1 i\\\\" $@
	for generator in generators/*.js; do \
	  genfunc="$$(basename $$generator | cut -d. -f1)"; \
	  sed -i "1 i\import {$$genfunc} from '../$$generator';" $@ \
	;done
	#sed -i "1 i\import * as model from '../model/model.js';" $@
	sed -i "1 i\import {enterSubGraph, exitSubGraph, getList, getEdge, getCurrentContainer, getVertex, getGroup, exitContainer, enterContainer, processVariable, getGraphCanvas} from '../model/model.js';" $@
	sed -i "1 i\import {traverseTree, findVertex, TreeVertex} from '../model/tree.js';" $@
	sed -i "1 i\import {Shapes} from '../model/shapes.js';" $@
	sed -i "1 i\import {iterateEdges, outputFormattedText, getAttributeAndFormat, output, getAttribute, setAttr, debug} from '../model/support.js';" $@
	sed -i "1 i\import {GraphInner} from '../model/graphinner.js';" $@
	sed -i "1 i\import {GraphEdge} from '../model/graphedge.js';" $@
	sed -i "1 i\import {GraphConnectable} from '../model/graphconnectable.js';" $@
	sed -i "1 i\import {GraphContainer} from '../model/graphcontainer.js';" $@
	sed -i "1 i\import {generators, visualizations, GraphCanvas} from '../model/graphcanvas.js';" $@
	sed -i "1 i\import {GraphGroup} from '../model/graphgroup.js';" $@
	sed -i "1 i\import {GraphVertex} from '../model/graphvertex.js';" $@
	sed -i "1 i\import {GraphObject} from '../model/graphobject.js';" $@
	sed -i "1 i\\\\" $@
	sed -i "1 i\var collectNextVertex;" $@
	#sed -i "1 i\var visualizations;" $@
	#sed -i "1 i\var generators=new Map();" $@
	#@mv $@ a;uglifyjs a -c -m -o $@;rm a|grep -v WARN
	echo '{"type":"module"}' > build/package.json
	sed -i 's/^var diagrammer_parser/export var diagrammerParser/g' $@
	sed -i 's/exports.diagrammerLexer=diagrammerLexer;//g' build/diagrammer_lexer.js
	sed -i 's/^var diagrammer_lexer/export var diagrammerLexer/g' build/diagrammer_lexer.js
	sed -i "1 i\var collectNextVertex;" build/diagrammer_lexer.js

.PHONY: export
export: build/diagrammer_lexer.js build/diagrammer_parser.js js/diagrammer.js
	@./scripts/export.sh
	@echo 'Add alias depict="~/{EXPORT_DIR_HERE}/t.sh silent " to your profile/bashrc etc.\nYou need (depending) visualizers graphviz,mscgen,plantuml.jar,nwdiag,blockdiag,actdiag.\nplantuml requires java\nblockdiag etc. in http://blockdiag.com/en/blockdiag/introduction.html\nPlantuml from http://plantuml.sourceforge.net/\n' >export/README.txt

.PHONY: test
test: all
	@mkdir -p tests/test_outputs
	npm test
	./scripts/runtests.sh

clean:
	rm -f build/*
