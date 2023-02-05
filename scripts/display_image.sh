#!/bin/sh
display_image() {
  # TODO: posix sh missing OSTYPE
  wslview "$1"
  wslview "$2"
  # mac..
  # open -Fn "tests/$png" "ref/$x/$png"
}
