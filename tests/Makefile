export PATH := $(CURDIR)/../node_modules/.bin:$(PATH)

.PHONY: clean _test all checkminiserver startminiserver jesttests jest_test_deps

all: _test

jest_test_deps:

checkminiserver:
	@/bin/echo -e "Make sure server is running for web tests\nYou can start it with: ./diagrammer serve"

startminiserver:
	$(SHELL) -c 'cd ..; ./diagrammer serve 8000 &'

jesttests: checkminiserver jest_test_deps
	# It is possible to hook this to jest.config or even into the tearup/down of the actual test
	# but this is path of least resistance
	@$(SHELL) -c 'cd ..; ./diagrammer serve 8999 &'
	@mkdir -p ../tests/testrun
	@MINISERVER_TEST_PORT=8999 npm test
	@-pkill -f "diagrammer serve 8999" || true

_test: jesttests

clean:
	@find ../tests -name "*.map" -delete
	@-pkill -f "diagrammer serve" || true
