#!/bin/sh
#TODO:ALLOW SVG
MYPATH=$(dirname "$0")/../
# Will be used in export
# shellcheck disable=SC2148,SC2034
EXTPATH=$(pwd)
#EXPORTREMOVE
if [ "${1:-skipparsermake}" = "skipparsermake" ]; then
  #EXPORTREMOVE
  shift
  #EXPORTREMOVE
else
  #EXPORTREMOVE
  ./makeLexerAndParser.sh >/dev/null
#EXPORTREMOVE
fi

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

FORMAT=png
[ "$1" = "svg" ] && {
  shift
  FORMAT=svg
}

input=${1:-tests/test_inputs/state2.txt}
generator=${2:-dot}

#EXPORTREMOVE
echo "testing lexing"
#EXPORTREMOVE
node --max-old-space-size=4096 testStateLexer.js "$input"

#EXPORTREMOVE
#node parser.js $input $func | tee a.gv
#EXPORTREMOVE
# |sed '/digraph/,$!d'
INPUT_PATH=${input%.*}
OUTPUT_PATH=$(echo "$INPUT_PATH" | sed 's/_inputs/_outputs/')
IMAGEFILE=${OUTPUT_PATH}_${generator}.${FORMAT}
rm -f "$IMAGEFILE"
OUT=${OUTPUT_PATH}_${generator}.out
rm -f "$OUT"

#EXPORTREMOVE
echo "test parser $verbose $OUT"

case "$generator" in
nwdiag | actdiag | blockdiag | plantuml_sequence | mscgen)
  node --max-old-space-size=4096 "$MYPATH/parse.js" "$input" "$generator" "$verbose" >"$OUT"
  [ $text -ne 0 ] && cat "$OUT"
  ;;
neato | twopi | circo | fdp | sfdp)
  node --max-old-space-size=4096 "$MYPATH/parse.js" "$input" digraph "$verbose" >"$OUT"
  [ $text -ne 0 ] && cat "$OUT"
  ;;
ast | dendrogram | sankey)
  node --max-old-space-size=4096 "$MYPATH/parse.js" "$input" "$generator" "$verbose"
  exit 0
  ;;
*)
  node --max-old-space-size=4096 "$MYPATH/parse.js" $verbose "$input" digraph "$verbose" >"$OUT"
  [ $text -ne 0 ] && cat "$OUT"
  ;;
esac

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

echo "Generate sequence $generator"

. ./scripts/display_image.sh

nwdiag() {
  nwdiag3 $*
}

case "$generator" in
plantuml_sequence)
  java -Xmx2048m -jar "$PLANTUML_JAR" "$OUT" >"$IMAGEFILE" && [ $silent = 0 ] && display_image "$IMAGEFILE"
  ;;
nwdiag | actdiag | blockdiag)
  "$generator" <"$OUT" -a -T"${FORMAT}" -o "$IMAGEFILE" - && [ $silent = 0 ] && display_image "$IMAGEFILE"
  ;;
mscgen)
  "$generator" <"$OUT" -T"${FORMAT}" -o "$IMAGEFILE" - && [ $silent = 0 ] && display_image "$IMAGEFILE"
  ;;
neato | twopi | circo | fdp | sfdp)
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
