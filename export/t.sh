#!/bin/sh
#TODO:ALLOW SVG
MYPATH=$(dirname "$0")/../
# Will be used in export
# shellcheck disable=SC2148,SC2034
EXTPATH=$(pwd)
#EXPORTREMOVE
  #EXPORTREMOVE
  #EXPORTREMOVE
  #EXPORTREMOVE
  make all
#EXPORTREMOVE

PLANTUML_JAR=ext/plantuml.jar
[ -f "$PLANTUML_JAR" ] && {
  echo "# Warning, you may need ext/plantuml.jar, check ext/README.txt"
}

[ $# -eq 0 ] && {
  echo "USAGE: [skipparsermake] [silent] [tests] [verbose] [text] [svg] [INPUT] [GENERATOR|dot]"
  exit 0
}

silent=0
[ "$1" = "silent" ] && {
  shift
  silent=1
}

tests=0
[ "$1" = "tests" ] && {
  shift
  tests=1
}

verbose=""
[ "$1" = "verbose" ] && {
  shift
  verbose=" verbose "
}

text=0
[ "$1" = "text" ] && {
  shift
  text=1
}

dont_run_visualizer=0
[ "$1" = "dont_run_visualizer" ] && {
  shift
  dont_run_visualizer=1
}

FORMAT=png
[ "$1" = "svg" ] && {
  shift
  FORMAT=svg
}

input=${1:-tests/test_inputs/events.txt}
generator=${2:-dot}
echo $generator

#EXPORTREMOVE
#EXPORTREMOVE

#EXPORTREMOVE
#EXPORTREMOVE
INPUT_PATH=${input%.*}
OUTPUT_PATH=$(echo "$INPUT_PATH" | sed 's/_inputs/_outputs/')
IMAGEFILE=${OUTPUT_PATH}_${generator}.${FORMAT}
rm -f "$IMAGEFILE"
OUT=${OUTPUT_PATH}_${generator}.out
rm -f "$OUT"

#EXPORTREMOVE

getgenerator() {
  case "$1" in
  neato | twopi | circo | fdp | sfdp | dot | osage)
    echo digraph
    ;;
  *)
    echo "$1"
    ;;
  esac
}

echo Using generator $(getgenerator $generator)
node --max-old-space-size=4096 "$MYPATH/js/generate.js" "$input" "$(getgenerator $generator)" "$verbose" >"$OUT"
[ $text -ne 0 ] && cat "$OUT"

rc=$?
# shellcheck disable=SC2181
[ $? -ne 0 ] && {
  echo "Fatal parsing error $rc"
  exit $rc
}
[ $text -ne 0 ] && exit 0

[ $(stat --format=%s "$OUT") -eq 0 ] && {
  echo "Something went wrong, generator produced EMPTY file $OUT"
  exit 10
}

[ $dont_run_visualizer -eq 1 ] && exit 0

echo "Visualize $generator generated output"

. ./display_image.sh

nwdiag() {
  nwdiag3 $*
}

seqdiag() {
  seqdiag3 $*
}

actdiag() {
  actdiag3 $*
}

blockdiag() {
  blockdiag3 $*
}

case "$generator" in
plantuml_sequence)
  java -Xmx2048m -jar "$PLANTUML_JAR" "$OUT" >"$IMAGEFILE" && [ $silent = 0 ] && display_image "$IMAGEFILE"
  ;;
nwdiag | actdiag | blockdiag | seqdiag)
  "$generator" <"$OUT" -a -T"${FORMAT}" -o "$IMAGEFILE" - && [ $silent = 0 ] && display_image "$IMAGEFILE"
  ;;
mscgen | neato | twopi | circo | fdp | sfdp | dot)
  "$generator" <"$OUT" -T"${FORMAT}" -o "$IMAGEFILE" && [ $silent = 0 ] && display_image "$IMAGEFILE"
  ;;
*)
  dot <"$OUT" -T"${FORMAT}" -o "$IMAGEFILE" && [ $silent = 0 ] && display_image "$IMAGEFILE"
  ;;
esac

#When running tests, these are important
[ $tests -eq 0 ] && {
  # rm $OUT;
  [ "$FORMAT" = "png" ] && {
    #Compress
    if which pngquant >/dev/null; then
      pngquant --ext .png --force --speed 1 --quality 0-10 "$IMAGEFILE"
    fi
  }
  echo "$IMAGEFILE"
}

exit 0
