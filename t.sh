#!/bin/sh
./makeLexerAndParser.sh

input=${1:-state2.txt}

echo "testing lexing"
node testStateLexer.js $input

echo "test parser"
node parser.js $input | tee a.gv
# |sed '/digraph/,$!d'

png=${input%.*}.png
dot -Tpng a.gv >$png
[[ -s a.png ]] && open $png

#circo -Tpng a.gv >c.png
##[[ -s c.png ]] && open c.png

#twopi -Tpng a.gv >t.png
##[[ -s t.png ]] && open t.png

#neato -Tpng a.gv >n.png
##[[ -s n.png ]] && open n.png

