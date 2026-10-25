# TESTING.md

## Purpose
This document describes the test workflows for the `diagrammer` project.

## Test commands
- Run Jest unit/browser tests:
  - `npm test`
- Run full project test workflow:
  - `make test`
- Run only the test harness inside `tests/`:
  - `make -C tests testrunner`
- Run Jest tests inside `tests/`:
  - `make -C tests jesttests`
- Run the regression test runner directly:
  - `node js/runtests.js [visualizer:testNamePattern]`

## How tests are organized
- `tests/` contains:
  - `generators/`
  - `model/`
  - `parser/`
  - `web/`
  - `test_inputs/` — diagrammer source examples used by regression tests
  - `testrun/` — runtime-generated outputs for current and previous runs
- `tests/Makefile` builds TypeScript test files and runs browser/web tests.

## Test types
- Unit tests with Jest and `jest-puppeteer`
- Regression tests via `js/runtests.js`
  - compares generated text outputs with stored reference text
  - compares generated graph images with stored reference PNGs
- Browser/web interaction tests through `web/miniserver.js`

## Required artifacts
- `ext/plantuml.jar` is required to run the full set of tests successfully.
- `scripts/setup.sh SELFTEST` bootstraps a controlled test environment.

## Important files
- `package.json` — contains dependencies for Jest and Puppeteer
- `jest.config.js` — test runner configuration and preset
- `tests/Makefile` — test build/test orchestration
- `js/runtests.js` — regression test runner logic
- `web/miniserver.js` — local web server used by web tests

## Useful direct commands
- Run one visualizer regression test:
  - `node js/runtests.js dot:state`
- Run all tests with web support:
  - `make test`
- If a regression changed intentionally, remove the old reference file from `tests/testrun/previous` and rerun.

## Notes
- `make test` builds the whole project before running tests.
- `npm test` runs Jest directly, but web/browser tests will fail with `ERR_CONNECTION_REFUSED` unless `web/miniserver.js` is running. Use `make -C tests jesttests` to automatically start and stop miniserver on port 8999 for Jest runs.
- Web tests depend on `web/miniserver.js` being executable and available.
