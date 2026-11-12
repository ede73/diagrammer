#!/bin/bash
# scripts/setup.sh: Setup helper for Diagrammer development environment
# Helps install core build prerequisites and optional CLI diagramming engines.

set -e

[ -f Cargo.toml ] && [ -d web ] && [ -d crates ] || {
  echo "Error: Run this script from the diagrammer project root directory."
  exit 10
}

YES_TO_ALL=${1:-}

confirm() {
  affirmative="$1"
  shift
  [ "$YES_TO_ALL" = "YES_TO_ALL" ] && {
    $affirmative
    return 0
  }
  read -r -p "$* [y/N] " response 2>/dev/tty
  case "$response" in
  [yY][eE][sS] | [yY])
    $affirmative
    return 0
    ;;
  *)
    return 1
    ;;
  esac
}

error() {
  echo >&2 "ERROR: $*"
}

warning() {
  echo >&2 "WARNING: $*"
}

OSTYPE=$(uname | tr '[:upper:]' '[:lower:]')

install_pkg() {
  case $OSTYPE in
  darwin*)
    brew install "$@"
    ;;
  linux*)
    sudo apt -qq -y install "$@"
    ;;
  *)
    warning "Unknown OS ($OSTYPE). Please install: $* manually."
    ;;
  esac
}

check_core_prereqs() {
  echo "=== Checking Core Prerequisites ==="
  local missing=0

  if command -v cargo >/dev/null 2>&1; then
    echo "  [OK] Rust / Cargo: $(cargo --version)"
  else
    echo "  [MISSING] Rust / Cargo (install via https://rustup.rs)"
    missing=1
  fi

  if command -v wasm-pack >/dev/null 2>&1; then
    echo "  [OK] wasm-pack: $(wasm-pack --version 2>/dev/null || echo 'installed')"
  else
    echo "  [MISSING] wasm-pack (install via 'cargo install wasm-pack')"
    missing=1
  fi

  if command -v make >/dev/null 2>&1; then
    echo "  [OK] make: $(make --version | head -n 1)"
  else
    echo "  [MISSING] make (build essential)"
    missing=1
  fi

  if [ $missing -ne 0 ]; then
    warning "Please install the missing core prerequisites above to build Diagrammer."
  else
    echo "All core prerequisites are installed!"
  fi
  echo ""
}

install_graphviz() {
  install_pkg graphviz
}

install_mscgen() {
  install_pkg mscgen
}

install_plantuml() {
  case $OSTYPE in
  darwin*)
    brew install plantuml default-jre
    ;;
  linux*)
    sudo apt -qq -y install plantuml default-jre-headless
    PLANT_JAR=$(dpkg -L plantuml | grep '\.jar$' | head -n 1 || true)
    if [ -n "$PLANT_JAR" ]; then
      mkdir -p ext
      cp "$PLANT_JAR" ext/
    fi
    ;;
  esac
}

install_python_diags() {
  echo "Installing Python diagram generators via pip (nwdiag, blockdiag, actdiag, seqdiag)..."
  pip install --user nwdiag blockdiag actdiag seqdiag || \
  pip3 install --user nwdiag blockdiag actdiag seqdiag || \
  warning "Could not run pip. Please install nwdiag, blockdiag, actdiag, seqdiag manually."
}

install_test_deps() {
  echo "Installing isolated test dependencies (Puppeteer, Jest) in tests/..."
  (cd tests && npm install)
}

# Main banner
cat <<EOF
===========================================================
               Diagrammer Environment Setup
===========================================================
Diagrammer core is built in 100% Rust and compiles to:
  - Native binary (./diagrammer)
  - WebAssembly (build/wasm) for zero-build browser UI

All 13 diagram formats can be parsed and generated natively.
Some formats (e.g. Graphviz, PlantUML, mscgen, BlockDiag)
can also utilize host CLI binaries when available.
===========================================================

EOF

check_core_prereqs

echo "=== Optional External Visualizer Engines ==="
confirm install_graphviz "[Optional] Install Graphviz (dot, neato, fdp, sfdp, twopi, osage)?" || true
confirm install_mscgen "[Optional] Install mscgen (Message Sequence Charts)?" || true
confirm install_plantuml "[Optional] Install PlantUML + Java runtime?" || true
confirm install_python_diags "[Optional] Install Python diagram CLI tools (blockdiag, seqdiag, actdiag, nwdiag)?" || true

echo ""
echo "=== Optional Browser Regression Testing Dependencies ==="
confirm install_test_deps "[Optional] Install Jest/Puppeteer browser test dependencies in tests/?" || true

echo ""
echo "=== Setup Complete ==="
echo "To build everything:"
echo "  make all"
echo ""
echo "To start the embedded web server:"
echo "  ./diagrammer serve 8000"
echo ""
echo "To run tests:"
echo "  cargo test --manifest-path crates/diagrammer-core/Cargo.toml"
echo "  make -C tests jesttests"
echo ""
