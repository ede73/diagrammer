#!/bin/sh
./makeLexerAndParser.sh

silent=0
if [ "$1" = "silent" ]; then
 shift
 silent=1
fi

input=${1:-state2.txt}
generator=${2:-dot}

echo "testing lexing"
node testStateLexer.js $input

echo "test parser"
#node parser.js $input $func | tee a.gv
# |sed '/digraph/,$!d'

png=${input%.*}_${generator}.png

case "$generator" in
  actdiag)
    node parse.js "$input" $generator |$generator -a -Tpng -o $png - && [[ $silent = 0 ]] && open "$png" &
  ;;
  blockdiag)
    node parse.js "$input" $generator |$generator -a -Tpng -o $png - && [[ $silent = 0 ]] && open "$png" &
  ;;
  neato)
    node parse.js "$input" digraph |$generator -Tpng -o $png && [[ $silent = 0 ]] && open "$png" &
  ;;
  twopi)
    node parse.js "$input" digraph |$generator -Tpng -o $png && [[ $silent = 0 ]] && open "$png" &
  ;;
  circo)
    node parse.js "$input" digraph |$generator -Tpng -o $png && [[ $silent = 0 ]] && open "$png" &
  ;;
  fdp)
    node parse.js "$input" digraph |$generator -Tpng -o $png && [[ $silent = 0 ]] && open "$png" &
  ;;
  sfdp)
    node parse.js "$input" digraph |$generator -Tpng -o $png && [[ $silent = 0 ]] && open "$png" &
  ;;
  *)
    node parse.js "$input" digraph |dot -Tpng -o $png  && [[ $silent = 0 ]] && open "$png" &
  ;;
esac

#circo -Tpng a.gv >c.png
##[[ -s c.png ]] && [[ $silent = 0 ]] && open c.png

#twopi -Tpng a.gv >t.png
##[[ -s t.png ]] && [[ $silent = 0 ]] && open t.png

#neato -Tpng a.gv >n.png
##[[ -s n.png ]] && [[ $silent = 0 ]] && open n.png

