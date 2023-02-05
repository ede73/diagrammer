#!/bin/sh
#TODO:ALLOW SVG
MYPATH=$(dirname "$0")
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

input=${1:-state2.txt}
generator=${2:-dot}

#EXPORTREMOVE
echo "testing lexing"
#EXPORTREMOVE
node --max-old-space-size=4096 testStateLexer.js "$input"

#EXPORTREMOVE
#node parser.js $input $func | tee a.gv
#EXPORTREMOVE
# |sed '/digraph/,$!d'

IMAGEFILE=${input%.*}_${generator}.${FORMAT}
rm -f "$IMAGEFILE"
OUT=${input%.*}_${generator}.out
rm -f "$OUT"

extras=$verbose
#EXPORTREMOVE
echo "test parser $extras $OUT"

case "$generator" in
  dexgraph|nwdiag|actdiag|blockdiag|plantuml_sequence|mscgen)
    node --max-old-space-size=4096  "$MYPATH/parse.js" "$extras" "$input" "$generator" >"$OUT"
    [ $text -ne 0 ] && cat "$OUT"
  ;;
  neato|twopi|circo|fdp|sfdp)
   node --max-old-space-size=4096  "$MYPATH/parse.js" "$extras" "$input" digraph >"$OUT"
   [ $text -ne 0 ] && cat "$OUT"
  ;;
  ast|dendrogram|sankey)
    node --max-old-space-size=4096 "$MYPATH/parse.js" "$extras" "$input" "$generator"
    exit 0
  ;;
  *)
    node --max-old-space-size=4096 "$MYPATH/parse.js" "$extras" "$input" digraph >"$OUT"
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

echo "Generate sequence $generator"

case "$generator" in
  plantuml_sequence)
    java -Xmx2048m -jar "$PLANTUML_JAR" "$OUT" >"$IMAGEFILE"&& [ $silent = 0 ] && open "$IMAGEFILE"
  ;;
  nwdiag|actdiag|blockdiag)
    "$generator" < "$OUT" -a -T"${FORMAT}" -o "$IMAGEFILE" - && [ $silent = 0 ] && open "$IMAGEFILE"
  ;;
  mscgen)
    "$generator" < "$OUT" -T"${FORMAT}" -o "$IMAGEFILE" - && [ $silent = 0 ] && open "$IMAGEFILE"
  ;;
  neato|twopi|circo|fdp|sfdp)
    "$generator" < "$OUT" -T"${FORMAT}" -o "$IMAGEFILE" && [ $silent = 0 ] && open "$IMAGEFILE"
  ;;
  *)
    dot < "$OUT" -T"${FORMAT}" -o "$IMAGEFILE"  && [ $silent = 0 ] && open "$IMAGEFILE"
  ;;
esac

#When running tests, these are important
[ $tests -eq 0 ] && {
  # rm $OUT;
  [ "$FORMAT" = "png" ] && {
    #Compress
    if which  pngquant >/dev/null ; then
      pngquant --ext .png --force --speed 1 --quality 0-10 "$IMAGEFILE"
    fi
  }
  echo "$IMAGEFILE"
}

exit 0
