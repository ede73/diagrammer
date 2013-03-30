#!/bin/sh
input=${1:-state2.txt}

jison-lex state.lex
cat >> state.js <<EOF
exports.state=state;
EOF

echo "testing lexing"
node testStateLexer.js

cat state.lex > state.all
cat >>state.all <<EOF
/lex
EOF
cat state.grammar >>state.all

#jison state.grammar state.lex -o parser.js
echo "Make parser"
jison state.all -o parser.js

[[ "$?" -ne 0 ]] && exit 10

echo "test parser"
node parser.js $input | tee a.gv
# |sed '/digraph/,$!d'

dot -Tpng a.gv >a.png
[[ -s a.png ]] && open a.png

circo -Tpng a.gv >c.png
#[[ -s c.png ]] && open c.png

twopi -Tpng a.gv >t.png
#[[ -s t.png ]] && open t.png

neato -Tpng a.gv >n.png
#[[ -s n.png ]] && open n.png

