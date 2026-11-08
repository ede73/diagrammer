#!/bin/sh
# scripts/watch.sh: Portable watcher for diagrammer development
# Watches Rust core (grammar, AST, generators) and web template,
# running 'make all' on changes.
# Works across macOS, Linux, and BSD without external dependencies (inotifywait/fswatch).

WATCH_PATHS="crates/diagrammer-core/src web/index_template.html"
STAMP=/tmp/.diagrammer_watch_stamp_$$

touch "$STAMP"
trap 'rm -f "$STAMP"; exit' INT TERM EXIT

echo "Watching $WATCH_PATHS for changes (Ctrl+C to stop)..."

while true; do
  CHANGED=$(find $WATCH_PATHS -newer "$STAMP" 2>/dev/null)
  if [ -n "$CHANGED" ]; then
    touch "$STAMP"
    echo "Change detected: $CHANGED"
    make all
  fi
  sleep 1
done
