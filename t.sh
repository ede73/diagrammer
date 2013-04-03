#!/bin/sh
./makeLexerAndParser.sh

input=${1:-state2.txt}
generator=${2:-dot}

echo "testing lexing"
node testStateLexer.js $input

echo "test parser"
#node parser.js $input $func | tee a.gv
# |sed '/digraph/,$!d'

png=${input%.*}.png

case "$generator" in
  actdiag)
    node parse.js "$input" $generator |$generator -a -Tpng -o $png - && open "$png" &
  ;;
  blockdiag)
    node parse.js "$input" $generator |$generator -a -Tpng -o $png - && open "$png" &
  ;;
  neato)
    node parse.js "$input" digraph |$generator -Tpng -o $png && open "$png" &
  ;;
  twopi)
    node parse.js "$input" digraph |$generator -Tpng -o $png && open "$png" &
  ;;
  circo)
    node parse.js "$input" digraph |$generator -Tpng -o $png && open "$png" &
  ;;
  fdp)
    node parse.js "$input" digraph |$generator -Tpng -o $png && open "$png" &
  ;;
  sfdp)
    node parse.js "$input" digraph |$generator -Tpng -o $png && open "$png" &
  ;;
  *)
    node parse.js "$input" digraph |dot -Tpng -o $png  && open "$png" &
  ;;
esac

#circo -Tpng a.gv >c.png
##[[ -s c.png ]] && open c.png

#twopi -Tpng a.gv >t.png
##[[ -s t.png ]] && open t.png

#neato -Tpng a.gv >n.png
##[[ -s n.png ]] && open n.png

