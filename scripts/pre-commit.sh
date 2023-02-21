#!/bin/sh
GIT_DIR=$(git rev-parse --show-toplevel)

make test
