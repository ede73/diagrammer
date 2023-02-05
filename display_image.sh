#!/bin/sh
display_image() {
  wslview "$1"
  wslview "$2"
  # mac..
  # open -Fn "tests/$png" "ref/$x/$png"
}
