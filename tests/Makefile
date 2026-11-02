CORES =

WEB_TEST_TSS=$(shell find ./web -maxdepth 1 -iname "*.ts")
WEB_TEST_JSS:=$(WEB_TEST_TSS:.ts=.js)

export PATH := $(CURDIR)/../node_modules/.bin:$(PATH)
TRANSPILER=tsc
TRANSPILEOPTIONS=--module es6 --esModuleInterop --target es2017 --allowJs --removeComments --strict --checkJs --skipLibCheck
TRANSPILE=$(TRANSPILER) $(TRANSPILEOPTIONS)
ESLINT=eslint -f stylish --fix
S=| grep -v -E "(Cannot write file)" || true

.PHONY: clean _test

all: _test

jest_test_deps: webtests CE.js
web/%.js: web/%.ts
webtests: $(WEB_TEST_JSS)
CE.js: CE.ts

 %.js: %.ts
	@$(TRANSPILE) $< $(S)

testrunner:
	@-pkill -f "miniserver.js 8777" || true
	@chmod u+x ../web/miniserver.js
	@$(SHELL) -c 'cd .. ; ./web/miniserver.js 8777&'
	@$(SHELL) -c 'cd .. ; ./js/runtests.js webport 8777'
	@-pkill -f "miniserver.js 8777" || true

checkminiserver:
	@/bin/echo -e "Make sure miniserver is running for web tests\nYou can start it with: node web/miniserver.js"

startminiserver:
	@chmod u+x ../web/miniserver.js
	$(SHELL) -c 'cd ..; node ./web/miniserver.js&'

jesttests: checkminiserver jest_test_deps
	# It is possible to hook this to jest.config or even into the tearup/down of the actual test
	# but this is path of least resistance
	@chmod u+x ../web/miniserver.js
	@$(SHELL) -c 'cd ..;./web/miniserver.js 8999 &'
	@mkdir -p ../tests/testrun
	@MINISERVER_TEST_PORT=8999 npm test
	@-pkill -f "miniserver.js 8999" || true

_test: testrunner jesttests

clean:
	@find ../tests -name "*.map" -or -name "*.js" -delete
	@-pkill -f "miniserver.js 8777" || true
	@-pkill -f "miniserver.js 8999" || true
