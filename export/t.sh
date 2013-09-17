#!/bin/sh
#EXPORTREMOVE
#EXPORTREMOVE
#EXPORTREMOVE
#EXPORTREMOVE
#EXPORTREMOVE

silent=0
if [ "$1" = "silent" ]; then
 shift
 silent=1
fi

input=${1:-state2.txt}
generator=${2:-dot}

#EXPORTREMOVE
#EXPORTREMOVE

#EXPORTREMOVE
#EXPORTREMOVE
#EXPORTREMOVE

png=${input%.*}_${generator}.png
rm -f $png
OUT=${input%.*}_${generator}.out
rm -f $OUT

case "$generator" in
  nwdiag|actdiag|blockdiag|plantuml_sequence)
    node parse.js "$input" $generator >$OUT
  ;;
  mscgen)
    node parse.js "$input" $generator >$OUT
  ;;
  neato)
    node parse.js "$input" digraph >$OUT
  ;;
  twopi)
    node parse.js "$input" digraph >$OUT
  ;;
  circo)
    node parse.js "$input" digraph >$OUT
  ;;
  fdp)
    node parse.js "$input" digraph >$OUT
  ;;
  sfdp)
    node parse.js "$input" digraph >$OUT
  ;;
  *)
    node parse.js "$input" digraph >$OUT
  ;;
esac
rc=$?
[[ $? -ne 0 ]] && {
  echo Fatal parsing error $rc
  exit $rc
}

case "$generator" in
  plantuml_sequence)
    java -jar ext/plantuml.jar $OUT >"$png"&& [[ $silent = 0 ]] && open "$png"
  ;;
  nwdiag|actdiag|blockdiag)
    cat $OUT |$generator -a -Tpng -o $png - && [[ $silent = 0 ]] && open "$png" 
  ;;
  mscgen)
    cat $OUT |$generator -Tpng -o $png - && [[ $silent = 0 ]] && open "$png" 
  ;;
  neato)
    cat $OUT |$generator -Tpng -o $png && [[ $silent = 0 ]] && open "$png" 
  ;;
  twopi)
    cat $OUT |$generator -Tpng -o $png && [[ $silent = 0 ]] && open "$png" 
  ;;
  circo)
    cat $OUT |$generator -Tpng -o $png && [[ $silent = 0 ]] && open "$png" 
  ;;
  fdp)
    cat $OUT |$generator -Tpng -o $png && [[ $silent = 0 ]] && open "$png" 
  ;;
  sfdp)
    cat $OUT |$generator -Tpng -o $png && [[ $silent = 0 ]] && open "$png" 
  ;;
  *)
    cat $OUT |dot -Tpng -o $png  && [[ $silent = 0 ]] && open "$png" 
  ;;
esac
#circo -Tpng a.gv >c.png
##[[ -s c.png ]] && [[ $silent = 0 ]] && open c.png

#twopi -Tpng a.gv >t.png
##[[ -s t.png ]] && [[ $silent = 0 ]] && open t.png

#neato -Tpng a.gv >n.png
##[[ -s n.png ]] && [[ $silent = 0 ]] && open n.png

rm $OUT
echo $png
exit 0
