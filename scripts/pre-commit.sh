#!/bin/sh
GIT_DIR=$(git rev-parse --show-toplevel)

[ -f "$GIT_DIR/web/result.png" ] && {
  echo "TODO: Test driver may load previous render result web/result.png and main screen test could fail"
  echo "rm web/result.png"
}

make test
