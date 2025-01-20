#Build the fucker!
#Automatic variables: http://www.chemie.fu-berlin.de/chemnet/use/info/make/make_10.html#SEC94
#Loosely based on makeLexerAndParser.js
#Also you get MATCHES=a/b/c.file:c/b/d.file
#And DIRNAMES=a/:c/
# $@ = name of the target being generated
# $^ list of dependencies on the target
# $< first dependency on the list

CORES =

INFIX=
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
	INFIX =
endif
ifeq ($(UNAME_S),Darwin)
	INFIX = ''
endif

export PATH := $(CURDIR)/node_modules/.bin:$(PATH)
include Makefile.commands
LOCK_FILE=.lock
BUILD_STARTED_FILE=.build_started

.PHONY: clean node_modules model sub_grammar sub_grammar_just_lexer sub_tests

all: _all
	@touch $(LOCK_FILE)
	@touch $(BUILD_STARTED_FILE)
	@$(MAKE) -j$(CORES) _all

sub_grammar:
	$(MAKE) -C grammar

sub_tests:
	$(MAKE) -C tests

_all: sub_grammar active_project_deps jest_test_deps parser faketypes
	@echo Built all
	@rm -f $(LOCK_FILE)

DELETE_ON_ERROR: $(LOCK_FILE)

active_project_deps: js_scripts model generators web web_visualizations index.html
generators: model
	make -j $(CORES) -C $@
model:
	make -j $(CORES) -C $@
web: model parser index.html
	make -j $(CORES) -C $@
js_scripts:
	make -j $(CORES) -C js
web_visualizations: generators
	make -j $(CORES) -C web/visualizations

index.html : index_template.html generators tests/test_inputs/*.txt web_visualizations
	@awk '/{REPLACE_WITH_TEST_EXAMPLES}/{ while ("ls tests/test_inputs/*.txt | sort |sed 's,^tests/test_inputs/,,g'" | getline var) printf("<option value=\"test_inputs/%s\">%s</option>\n",var,var);next} /{REPLACE_WITH_WEB_VISUALIZATION_MODULES}/{ while ("ls web/visualizations/*.ts | sort" | getline var) {tsjs=var;gsub("[.]ts",".js",tsjs);printf("<script type=\"module\" src=\"%s\"></script>\n",tsjs);}next}{print $0}' $< >$@

fixall:
	# VSCode doesnt always run the linter (and fix issues) on save (or otherwise) even when specified
	# This here just to ensure even on mistake we DO get the shit in line
	# On modern multiCPU, parallelized eslints run tad faster
	$(ESLINT) model & \
	$(ESLINT) generators & \
	$(ESLINT) web & \
	$(ESLINT) tests & \
	wait
	make -C tests testrunner

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

build/diagrammer_parser.js: build/diagrammer.all sub_grammar Makefile generators model js_scripts
	@mkdir -p build
	@if [ "${DEBUG}" != "" ]; then \
	jison -t $< -o $@ >/dev/null; \
	else \
	jison $< -o $@ >/dev/null; \
	fi
	@sed -i ${INFIX} '1 s/^/\n/' $@
	@for generator in generators/*.js; do \
	  genfunc="$$(grep 'export class' $$generator | cut -d' ' -f3)"; \
	  sed -i ${INFIX} "1 s@^@import {$$genfunc} from '../$$generator';\n@" $@ \
	;done
	@#sed -i "1 i\import * as model from '../model/model.js';" $@
	@sed -i ${INFIX}  "1 s@^@import {_enterNewGraphInner, _exitCurrentGraphInner, _getList, _getEdge, _getVertexOrGroup, _getGroupConditionalOrMakeNew, _getGroupOrMakeNew, _processVariable, _getGroupLoopOrMakeNew} from '../model/model.js';\n@" $@
	@sed -i ${INFIX}  "1 s@^@import {traverseTree, findVertex, TreeVertex} from '../model/tree.js';\n@" $@
	@sed -i ${INFIX}  "1 s@^@import {ShapeKeys} from '../model/shapes.js';\n@" $@
	@sed -i ${INFIX}  "1 s@^@import {debug} from '../model/debug.js';\n@" $@
	@sed -i ${INFIX}  "1 s@^@import {iterateEdges, outputFormattedText, getAttributeAndFormat, output, getAttribute, setAttr } from '../model/support.js';\n@" $@
	@sed -i ${INFIX}  "1 s@^@import {GraphInner} from '../model/graphinner.js';\n@" $@
	@sed -i ${INFIX}  "1 s@^@import {GraphEdge} from '../model/graphedge.js';\n@" $@
	@sed -i ${INFIX}  "1 s@^@import {GraphConnectable} from '../model/graphconnectable.js';\n@" $@
	@sed -i ${INFIX}  "1 s@^@import {GraphContainer} from '../model/graphcontainer.js';\n@" $@
	@sed -i ${INFIX}  "1 s@^@import {GraphCanvas} from '../model/graphcanvas.js';\n@" $@
	@sed -i ${INFIX}  "1 s@^@import {hasGenerator, visualizations, makeGenerator} from '../js/config.js';\n@" $@
	@sed -i ${INFIX}  "1 s@^@import {GraphGroup} from '../model/graphgroup.js';\n@" $@
	@sed -i ${INFIX}  "1 s@^@import {GraphVertex} from '../model/graphvertex.js';\n@" $@
	@sed -i ${INFIX}  "1 s@^@import {GraphReference} from '../model/graphreference.js';\n@" $@
	@sed -i ${INFIX}  "1 s@^@import {GraphObject} from '../model/graphobject.js';\n@" $@
	@sed -i ${INFIX} '1 s/^/\n/' $@
	@#@mv $@ a;uglifyjs a -c -m -o $@;rm a|grep -v WARN
	@echo '{"type":"module"}' > build/package.json
	@sed -i ${INFIX}  's/^var diagrammer_parser/export var diagrammerParser/g' $@
	@sed -i ${INFIX}  's/diagrammer_parser/diagrammerParser/g' $@
	@sed -i ${INFIX}  's/exports.diagrammerLexer=diagrammerLexer;//g' build/diagrammer_lexer.js
	@sed -i ${INFIX}  's/^var diagrammer_lexer/export var diagrammerLexer/g' build/diagrammer_lexer.js
	@echo 'export const parse = function () { return diagrammerParser.parse.apply(diagrammerParser, arguments) }' >> $@

# nicer to carry around than build target
parser: build/diagrammer_parser.js

export: parser js/diagrammer.js js/generate.js scripts/export.sh scripts/display_image.sh
	make -C export

tests: js model generators parser faketypes plantuml_jar web/editorInteractions.js index.html
	make -C tests

clean:
	@rm -f .error
	@rm -fR build
	@find scripts    -name "*.map" -or -name "*.js" -delete
	@make -C export clean
	@make -C generators clean
	@make -C grammar clean
	@make -C js clean
	@make -C model clean
	@make -C tests clean
	@make -C web clean
	@make -C web/visualizations clean


# relay to tests
startminiserver:
	make -C tests $@
checkminiserver:
	make -C tests $@
jest_test_deps:
	make -C tests $@
test: all
	@chmod u+x ./js/runtests.js
	make -C tests

watch:
	scripts/watch_and_make.sh &

stopwatch:
	pkill -f watch_and_make
	pkill -f "inotifywai.*generators"
