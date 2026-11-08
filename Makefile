# Build the diagrammer project (Full Rust Core + Web / CLI)

CORES =

INFIX=
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
	INFIX =
endif
ifeq ($(UNAME_S),Darwin)
	INFIX = ''
endif

LOCK_FILE=.lock
BUILD_STARTED_FILE=.build_started

pest_parser_bin:
	@if [ -f "$$HOME/.cargo/env" ]; then . "$$HOME/.cargo/env"; fi; \
	cargo build --release -p diagrammer-core --bin diagrammer_pest_parse

wasm_pkg:
	npx -y wasm-pack build crates/diagrammer-core --target web --out-dir ../../build/wasm --no-typescript

.PHONY: clean node_modules sub_tests wasm_pkg pest_parser_bin parser

all: _all
	@touch $(LOCK_FILE)
	@touch $(BUILD_STARTED_FILE)
	@$(MAKE) -j$(CORES) _all

sub_tests:
	$(MAKE) -C tests

_all: pest_parser_bin wasm_pkg parser active_project_deps jest_test_deps
	@echo Built all
	@rm -f $(LOCK_FILE)

DELETE_ON_ERROR: $(LOCK_FILE)

active_project_deps: index.html

index.html : index_template.html tests/test_inputs/*.txt web/visualizations/*.js
	@awk '/{REPLACE_WITH_TEST_EXAMPLES}/{ while ("ls tests/test_inputs/*.txt | sort |sed 's,^tests/test_inputs/,,g'" | getline var) printf("<option value=\"test_inputs/%s\">%s</option>\n",var,var);next} /{REPLACE_WITH_WEB_VISUALIZATION_MODULES}/{ while ("ls web/visualizations/visualize*.js | sort" | getline var) printf("<script type=\"module\" src=\"%s\"></script>\n",var);next}{print $0}' $< >$@


node_modules: package.json
	npm install

plantuml_jar:
	@if [ ! -f ext/plantuml.jar ]; then \
	  echo "ERROR: Need plantuml JAR to run tests, put it ext/plantuml_jar, e.g.";\
	  exit 10; \
	fi

parser: pest_parser_bin wasm_pkg

tests: parser plantuml_jar index.html
	make -C tests

clean:
	@rm -f .error
	@rm -rf build
	@find scripts -name "*.map" -or -name "*.js" -delete
	@make -C tests clean

# relay to tests
startminiserver:
	make -C tests $@
checkminiserver:
	make -C tests $@
jest_test_deps:
	make -C tests $@
test: all
	make -C tests

watch:
	scripts/watch_and_make.sh &

stopwatch:
	pkill -f watch_and_make
