#!/bin/sh
OSTYPE=$(uname -a | tr '[:upper:]' '[:lower:]')
display_image() {
  case $OSTYPE in
  darwin*)
    VIEWER=open
    VIEWER_FLAGS=-Fn
    ;;
  linux*-wsl*)
    VIEWER=wslview
    VIEWER_FLAGS=
    ;;
  *)
    echo "Unknown architecture/os type $OSTYPE"
    exit 10
  esac

  for image in $*; do
    "$VIEWER" $VIEWER_FLAGS "$image"
  done
}
