#!/bin/sh

GIT_DIR=$(git rev-parse --git-dir)
PRE_COMMIT=$GIT_DIR/hooks/pre-commit
TEST_RUNNER=${GIT_DIR}/../scripts/pre-commit.sh

[ ! -f "$TEST_RUNNER" ] && {
  echo "Cannot locate $TEST_RUNNER"
  exit 10
}

[ ! -x "$TEST_RUNNER" ] && {
  echo "$TEST_RUNNER has to be executable"
  exit 10
}

[ -f "$PRE_COMMIT" ] && {
  echo "Oh no, you already have a pre-commit script linked, check the situation by hand"
  exit 10
}

echo "Installing hooks..."
ln -sr $TEST_RUNNER $PRE_COMMIT
echo "Done"!
