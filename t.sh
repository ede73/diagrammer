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
echo "test parser"
#EXPORTREMOVE
#node parser.js $input $func | tee a.gv
#EXPORTREMOVE
# |sed '/digraph/,$!d'

IMAGEFILE=${input%.*}_${generator}.${FORMAT}
rm -f $IMAGEFILE
OUT=${input%.*}_${generator}.out
rm -f $OUT

extras=$verbose

case "$generator" in
  nwdiag|actdiag|blockdiag|plantuml_sequence)
    node $MYPATH/parse.js $extras "$input" $generator >$OUT
  ;;
  mscgen)
    node $MYPATH/parse.js $extras "$input" $generator >$OUT
  ;;
  neato)
    node $MYPATH/parse.js $extras "$input" digraph >$OUT
  ;;
  twopi)
    node $MYPATH/parse.js $extras "$input" digraph >$OUT
  ;;
  circo)
    node $MYPATH/parse.js $extras "$input" digraph >$OUT
  ;;
  fdp)
    node $MYPATH/parse.js $extras "$input" digraph >$OUT
  ;;
  sfdp)
    node $MYPATH/parse.js $extras "$input" digraph >$OUT
  ;;
  ast)
    node $MYPATH/parse.js $extras "$input" ast
    exit 0
  ;;
  *)
    node $MYPATH/parse.js $extras "$input" digraph >$OUT
  ;;
esac
rc=$?
[[ $? -ne 0 ]] && {
  echo Fatal parsing error $rc
  exit $rc
}

case "$generator" in
  plantuml_sequence)
    java -jar ext/plantuml.jar $OUT >"$IMAGEFILE"&& [[ $silent = 0 ]] && open "$IMAGEFILE"
  ;;
  nwdiag|actdiag|blockdiag)
    cat $OUT |$generator -a -T${FORMAT} -o $IMAGEFILE - && [[ $silent = 0 ]] && open "$IMAGEFILE" 
  ;;
  mscgen)
	echo 1
    cat $OUT |$generator -T${FORMAT} -o $IMAGEFILE - && [[ $silent = 0 ]] && open "$IMAGEFILE" 
  ;;
  neato)
    cat $OUT |$generator -T${FORMAT} -o $IMAGEFILE && [[ $silent = 0 ]] && open "$IMAGEFILE" 
  ;;
  twopi)
    cat $OUT |$generator -T${FORMAT} -o $IMAGEFILE && [[ $silent = 0 ]] && open "$IMAGEFILE" 
  ;;
  circo)
    cat $OUT |$generator -T${FORMAT} -o $IMAGEFILE && [[ $silent = 0 ]] && open "$IMAGEFILE" 
  ;;
  fdp)
    cat $OUT |$generator -T${FORMAT} -o $IMAGEFILE && [[ $silent = 0 ]] && open "$IMAGEFILE" 
  ;;
  sfdp)
    cat $OUT |$generator -T${FORMAT} -o $IMAGEFILE && [[ $silent = 0 ]] && open "$IMAGEFILE" 
  ;;
  *)
    cat $OUT |dot -T${FORMAT} -o $IMAGEFILE  && [[ $silent = 0 ]] && open "$IMAGEFILE" 
  ;;
esac
#circo -T${FORMAT} a.gv >c.${FORMAT}
##[[ -s c.${FORMAT} ]] && [[ $silent = 0 ]] && open c.${FORMAT}

#twopi -T${FORMAT} a.gv >t.${FORMAT}
##[[ -s t.${FORMAT} ]] && [[ $silent = 0 ]] && open t.${FORMAT}

#neato -T${FORMAT} a.gv >n.${FORMAT}
##[[ -s n.${FORMAT} ]] && [[ $silent = 0 ]] && open n.${FORMAT}

#When running tests, these are important
[[ $tests -eq 0 ]] && {
  rm $OUT;
  [[ $FORMAT -eq "png" ]] && {
    #Compress
    which  pngquant >/dev/null
    if [ $? -eq 0 ]; then
      pngquant --ext .png --force --speed 1 --quality 0-10 $png
    fi
  }
  echo $IMAGEFILE
}

exit 0
