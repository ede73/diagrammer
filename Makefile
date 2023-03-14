#Build the fucker!
#Automatic variables: http://www.chemie.fu-berlin.de/chemnet/use/info/make/make_10.html#SEC94
#Loosely based on makeLexerAndParser.js
#Also you get MATCHES=a/b/c.file:c/b/d.file
#And DIRNAMES=a/:c/
# $@ = name of the target being generated
# $^ list of dependencies on the target
# $< first dependency on the list

CORES =

GRAMMAR_FILES = grammar/diagrammer.lex grammar/lexmarker.txt grammar/diagrammer.grammar

GENERATOR_TSS=$(shell find generators -maxdepth 1 -iname "*.ts")
GENERATOR_JSS:=$(GENERATOR_TSS:.ts=.js)
MODEL_TSS=$(shell find model -maxdepth 1 -iname "*.ts")
MODEL_JSS:=$(MODEL_TSS:.ts=.js)
WEB_TSS=$(shell find web -maxdepth 1 -iname "*.ts")
WEB_JSS:=$(WEB_TSS:.ts=.js)
WEB_VISUALIZATION_TSS=$(shell find web/visualizations -maxdepth 1 -iname "*.ts")
WEB_VISUALIZATION_JSS:=$(WEB_VISUALIZATION_TSS:.ts=.js)
GENERATORS_TEST_TSS=$(shell find tests/generators -maxdepth 1 -iname "*.ts")
GENERATORS_TEST_JSS:=$(GENERATORS_TEST_TSS:.ts=.js)
MODEL_TEST_TSS=$(shell find tests/model -maxdepth 1 -iname "*.ts")
MODEL_TEST_JSS:=$(MODEL_TEST_TSS:.ts=.js)
PARSER_TEST_TSS=$(shell find tests/parser -maxdepth 1 -iname "*.ts")
PARSER_TEST_JSS:=$(PARSER_TEST_FILES:.ts=.js)
WEB_TEST_TSS=$(shell find tests/web -maxdepth 1 -iname "*.ts")
WEB_TEST_JSS:=$(WEB_TEST_TSS:.ts=.js)
JS_TSS=$(shell find js -maxdepth 1 -iname "*.ts" -and -not -name "go.d.ts")
JS_JSS:=$(JS_TSS:.ts=.js)
SCRIPTS_TSS=$(shell find scripts -maxdepth 1 -iname "*.ts")
SCRIPTS_JSS:=$(SCRIPTS_TSS:.ts=.js)

TRANSPILER=tsc
TRANSPILEOPTIONS=--module es6 --esModuleInterop --target es2017 --allowJs --removeComments --strict --checkJs --skipLibCheck
TRANSPILE=$(TRANSPILER) $(TRANSPILEOPTIONS)
S=| grep -v -E "(Cannot write file)" || true
ESLINT=eslint -f stylish --fix
LOCK_FILE=.lock
BUILD_STARTED_FILE=.build_started

.PHONY: clean node_modules model

all:
	@touch $(LOCK_FILE)
	@touch $(BUILD_STARTED_FILE)
	@$(MAKE) -j$(CORES) _all
_all: active_project_deps jest_test_deps parser
	@echo Built all
	@rm -f $(LOCK_FILE)

DELETE_ON_ERROR: $(LOCK_FILE)

active_project_deps: model generators web web_visualizations js index.html
generators/%.js : generators/%.ts
generators: $(GENERATOR_JSS) model
model/%.js : model/%.ts
model: $(MODEL_JSS)
web/%.js : web/%.ts
web: $(WEB_JSS) model parser index.html
web/visualizations/%.js : web/visualizations/%.ts generators
web_visualizations: $(WEB_VISUALIZATION_JSS)
scripts/%.js : scripts/%.ts
scripts: $(SCRIPTS_JSS)
	chmod u+x $^
js/%.js : js/%.ts
js: $(JS_JSS)
	chmod u+x js/lex.js js/visualize.js js/generate.js
index.html : index_template.html generators tests/test_inputs/*.txt web_visualizations
	@awk '/{REPLACE_WITH_TEST_EXAMPLES}/{ while ("ls tests/test_inputs/*.txt | sort |sed 's,^tests/test_inputs/,,g'" | getline var) printf("<option value=\"test_inputs/%s\">%s</option>\n",var,var);next} /{REPLACE_WITH_WEB_VISUALIZATION_MODULES}/{ while ("ls web/visualizations/*.ts | sort" | getline var) {tsjs=var;gsub("[.]ts",".js",tsjs);printf("<script type=\"module\" src=\"%s\"></script>\n",tsjs);}next}/{REPLACE_WITH_GENERATORS}/{ while ("grep \"ADD TO INDEX.HTML AS:\" generators/*.ts|sort|cut -d: -f3-|sort" | getline var) printf("%s\n",var,var);next}{print $0}' $< >$@

jest_test_deps: parsertests webtests modeltests generatortests
tests/parser/%.js: tests/parser/$.ts
parsertests: $(PARSER_TEST_JSS) model parser faketypes
tests/web/%.js: tests/parser/$.ts
webtests: $(WEB_TEST_JSS) web/editorInteractions.js index.html
tests/model/%.js: tests/parser/$.ts
modeltests: $(MODEL_TEST_JSS) model
tests/generators/%.js: tests/parser/$.ts
generatortests: $(GENERATORS_TEST_JSS) generators

fixall:
	# VSCode doesnt always run the linter (and fix issues) on save (or otherwise) even when specified
	# This here just to ensure even on mistake we DO get the shit in line
	# On modern multiCPU, parallelized eslints run tad faster
	$(ESLINT) model & \
	$(ESLINT) generators & \
	$(ESLINT) web & \
	$(ESLINT) tests & \
	wait
	make testrunner

build/types/diagrammer_parser_types.js: js/diagrammer_parser_types.ts
	@mkdir -p build/types
	@cp js/diagrammer_parser_types.ts build/types
	@echo '{"type":"module"}' > build/types/package.json
	@(cd build/types; rm -f diagrammer_parser_types.js;$(TRANSPILE) diagrammer_parser_types.ts $(S))
faketypes: build/types/diagrammer_parser_types.js

 %.js: %.ts
	@$(TRANSPILE) $< $(S)

node_modules: package.json
	npm install

plantuml_jar:
	@if [ ! -f ext/plantuml.jar ]; then \
	  echo "ERROR: Need plantuml JAR to run tests, put it ext/plantuml_jar, e.g.";\
	  exit 10; \
	fi

# Not actively used, but you can build and test just the lexer while developing
build/diagrammer_lexer.js: grammar/diagrammer.lex
	@echo "  Build Lexer"
	@mkdir -p build
	node_modules/.bin/jison-lex $< -o $@ >/dev/null
	@echo "exports.diagrammerLexer=diagrammerLexer;" >> $@
	@#@mv $@ a;uglifyjs a -c -m -o $@;rm a|grep -v WARN
# nicer to carry around than build target
just_lexer: build/diagrammer_lexer.js

# Jison considers lexer/parser separate, we combine to one file
build/diagrammer.all: $(GRAMMAR_FILES)
	@mkdir -p build
	@echo Compile build/diagrammer.all
	@cat $^ >$@
# nicer to carry around than build target
lexer_and_grammar: build/diagrammer.all
	echo 'Build lexer and grammar'

build/diagrammer_parser.js: build/diagrammer.all just_lexer Makefile generators model js/*.js
	@mkdir -p build
	@if [ "${DEBUG}" != "" ]; then \
	node_modules/.bin/jison -t $< -o $@ >/dev/null; \
	else \
	node_modules/.bin/jison $< -o $@ >/dev/null; \
	fi
	@sed -i "1 i\\\\" $@
	@for generator in generators/*.js; do \
	  genfunc="$$(basename $$generator | cut -d. -f1)"; \
	  sed -i "1 i\import {$$genfunc} from '../$$generator';" $@ \
	;done
	@#sed -i "1 i\import * as model from '../model/model.js';" $@
	@sed -i "1 i\import {_enterNewGraphInner, _exitCurrentGraphInner, _getList, _getEdge, _getVertexOrGroup, _getGroupConditionalOrMakeNew, _getGroupOrMakeNew, _processVariable, _getGroupLoopOrMakeNew} from '../model/model.js';" $@
	@sed -i "1 i\import {traverseTree, findVertex, TreeVertex} from '../model/tree.js';" $@
	@sed -i "1 i\import {ShapeKeys} from '../model/shapes.js';" $@
	@sed -i "1 i\import {debug} from '../model/debug.js';" $@
	@sed -i "1 i\import {iterateEdges, outputFormattedText, getAttributeAndFormat, output, getAttribute, setAttr } from '../model/support.js';" $@
	@sed -i "1 i\import {GraphInner} from '../model/graphinner.js';" $@
	@sed -i "1 i\import {GraphEdge} from '../model/graphedge.js';" $@
	@sed -i "1 i\import {GraphConnectable} from '../model/graphconnectable.js';" $@
	@sed -i "1 i\import {GraphContainer} from '../model/graphcontainer.js';" $@
	@sed -i "1 i\import {generators, visualizations, GraphCanvas} from '../model/graphcanvas.js';" $@
	@sed -i "1 i\import {GraphGroup} from '../model/graphgroup.js';" $@
	@sed -i "1 i\import {GraphVertex} from '../model/graphvertex.js';" $@
	@sed -i "1 i\import {GraphReference} from '../model/graphreference.js';" $@
	@sed -i "1 i\import {GraphObject} from '../model/graphobject.js';" $@
	@sed -i "1 i\\\\" $@
	@#@mv $@ a;uglifyjs a -c -m -o $@;rm a|grep -v WARN
	@echo '{"type":"module"}' > build/package.json
	@sed -i 's/^var diagrammer_parser/export var diagrammerParser/g' $@
	@sed -i 's/exports.diagrammerLexer=diagrammerLexer;//g' build/diagrammer_lexer.js
	@sed -i 's/^var diagrammer_lexer/export var diagrammerLexer/g' build/diagrammer_lexer.js
# nicer to carry around than build target
parser: build/diagrammer_parser.js

export: parser js/diagrammer.js js/generate.js scripts/export.sh scripts/display_image.sh
	@./scripts/export.sh
	@echo 'Add alias depict="~/{EXPORT_DIR_HERE}/t.js silent " to your profile/bashrc etc.\nYou need (depending) visualizers graphviz,mscgen,plantuml_jar.jar,nwdiag,blockdiag,actdiag.\nplantuml requires java\nblockdiag etc. in http://blockdiag.com/en/blockdiag/introduction.html\nPlantuml from http://plantuml.sourceforge.net/\n' >export/README.txt

testrunner: ./scripts/runtests.js ./scripts/t.js model generators parser plantuml_jar
	@chmod u+x ./web/miniserver.js
	@./web/miniserver.js 8777 &
	@./scripts/runtests.js webport 8777
	@-pkill -f "miniserver.js 8777" || true

checkminiserver:
	@/bin/echo -e "Make sure miniserver is running for web tests\nYou can start it with: node web/miniserver.js"

startminiserver:
	@chmod u+x ./web/miniserver.js
	node web/miniserver.js&

jesttests: checkminiserver jest_test_deps
	# It is possible to hook this to jest.config or even into the tearup/down of the actual test
	# but this is path of least resistance
	@chmod u+x ./web/miniserver.js
	@./web/miniserver.js 8999 &
	@mkdir -p tests/testrun
	@MINISERVER_TEST_PORT=8999 npm test
	@-pkill -f "miniserver.js 8999" || true

_test: testrunner jesttests

test:
	@$(MAKE) -j2 _test

tests: test

clean:
	@find build -type f -delete
	rm -f .error
	rm -f build/types/*
	find js -name "*.map" -delete
	find generators -name "*.map" -or -name "*.js" -delete
	find model -name "*.map" -or -name "*.js" -delete
	find web -name "*.map" -or -name "*.js" -delete
	find tests -name "*.map" -or -name "*.js" -delete

watch:
	scripts/watch_and_make.sh &

stopwatch:
	pkill -f watch_and_make
	pkill -f "inotifywai.*generators"
