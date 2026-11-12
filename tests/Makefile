.PHONY: clean _test all checkminiserver startminiserver rust_browser_tests browsertests

all: _test

rust_browser_tests:
	@$(SHELL) -c 'cd ..; ./diagrammer serve 8999 &'
	@for i in $$(seq 1 30); do curl -sI http://localhost:8999/ >/dev/null 2>&1 && break || sleep 0.1; done
	@MINISERVER_TEST_PORT=8999 cargo test --manifest-path ../crates/diagrammer-core/Cargo.toml --test browser_tests -- --nocapture
	@-pkill -f "diagrammer serve 8999" || true

browsertests: rust_browser_tests

checkminiserver:
	@/bin/echo -e "Make sure server is running for web tests\nYou can start it with: ./diagrammer serve"

startminiserver:
	$(SHELL) -c 'cd ..; ./diagrammer serve 8000 &'

_test: browsertests

clean:
	@-pkill -f "diagrammer serve" || true
