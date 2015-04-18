#TODO:ALLOW SVG
MYPATH=$(dirname $0)
EXTPATH=$(pwd)
#EXPORTREMOVE
if [ "${1:-skipparsermake}" == "skipparsermake" ]; then
#EXPORTREMOVE
  shift
#EXPORTREMOVE
  else
#EXPORTREMOVE
  ./makeLexerAndParser.sh >/dev/null
#EXPORTREMOVE
fi

if [ $# -eq 0 ];then
  echo "USAGE: [skipparsermake] [silent] [tests] [verbose] [text] [svg] [INPUT] [GENERATOR|dot]"
  exit 0
fi

silent=0
if [ "$1" = "silent" ]; then
 shift
 silent=1
fi

tests=0
if [ "$1" = "tests" ]; then
 shift
 tests=1
fi

verbose=""
if [ "$1" = "verbose" ]; then
 shift
 verbose=" verbose "
fi

text=0
if [ "$1" = "text" ]; then
 shift
 text=1
fi


FORMAT=png
if [ "$1" == "svg" ]; then
 shift
 FORMAT=svg
fi

input=${1:-state2.txt}
generator=${2:-dot}

#EXPORTREMOVE
echo "testing lexing"
#EXPORTREMOVE
node testStateLexer.js $input

#EXPORTREMOVE
#node parser.js $input $func | tee a.gv
#EXPORTREMOVE
# |sed '/digraph/,$!d'

IMAGEFILE=${input%.*}_${generator}.${FORMAT}
rm -f $IMAGEFILE
OUT=${input%.*}_${generator}.out
rm -f $OUT

extras=$verbose
#EXPORTREMOVE
echo "test parser "$extras" "$OUT

case "$generator" in
  dexgraph|nwdiag|actdiag|blockdiag|plantuml_sequence|mscgen)
    node $MYPATH/parse.js $extras "$input" $generator >$OUT
    [[ $text -ne 0 ]] && cat $OUT
  ;;
  neato|twopi|circo|fdp|sfdp)
   node $MYPATH/parse.js $extras "$input" digraph >$OUT
   [[ $text -ne 0 ]] && cat $OUT
  ;;
  ast|dendrogram)
    node $MYPATH/parse.js $extras "$input" $generator
    exit 0
  ;;
  *)
    node $MYPATH/parse.js $extras "$input" digraph >$OUT
    [[ $text -ne 0 ]] && cat $OUT
  ;;
esac
rc=$?
[[ $? -ne 0 ]] && {
  echo Fatal parsing error $rc
  exit $rc
}
[[ $text -ne 0 ]] && exit 0

echo "Generate sequence $generator"

case "$generator" in
  plantuml_sequence)
    java -Xmx2048m -jar ext/plantuml.jar $OUT >"$IMAGEFILE"&& [[ $silent = 0 ]] && open "$IMAGEFILE"
  ;;
  nwdiag|actdiag|blockdiag)
    cat $OUT |$generator -a -T${FORMAT} -o $IMAGEFILE - && [[ $silent = 0 ]] && open "$IMAGEFILE" 
  ;;
  mscgen)
    cat $OUT |$generator -T${FORMAT} -o $IMAGEFILE - && [[ $silent = 0 ]] && open "$IMAGEFILE" 
  ;;
  neato|twopi|circo|fdp|sfdp)
    cat $OUT |$generator -T${FORMAT} -o $IMAGEFILE && [[ $silent = 0 ]] && open "$IMAGEFILE" 
  ;;
  *)
    cat $OUT |dot -T${FORMAT} -o $IMAGEFILE  && [[ $silent = 0 ]] && open "$IMAGEFILE" 
  ;;
esac

#When running tests, these are important
[[ $tests -eq 0 ]] && {
  rm $OUT;
  [[ $FORMAT -eq "png" ]] && {
    #Compress
    which  pngquant >/dev/null
    if [ $? -eq 0 ]; then
      pngquant --ext .png --force --speed 1 --quality 0-10 $IMAGEFILE
    fi
  }
  echo $IMAGEFILE
}

exit 0
