export PATH := $(CURDIR)/node_modules/.bin:$(PATH)

.PHONY: clean _test all checkminiserver startminiserver jesttests jest_test_deps node_modules

all: _test

jest_test_deps:

node_modules: package.json
	npm install

checkminiserver:
	@/bin/echo -e "Make sure server is running for web tests\nYou can start it with: ./diagrammer serve"

startminiserver:
	$(SHELL) -c 'cd ..; ./diagrammer serve 8000 &'

jesttests: checkminiserver jest_test_deps node_modules
	# It is possible to hook this to jest.config or even into the tearup/down of the actual test
	# but this is path of least resistance
	@$(SHELL) -c 'cd ..; ./diagrammer serve 8999 &'
	@for i in $$(seq 1 30); do curl -sI http://localhost:8999/ >/dev/null 2>&1 && break || sleep 0.1; done
	@mkdir -p ../tests/testrun
	@MINISERVER_TEST_PORT=8999 npm test
	@-pkill -f "diagrammer serve 8999" || true

_test: jesttests

clean:
	@find ../tests -name "*.map" -delete
	@-pkill -f "diagrammer serve" || true
