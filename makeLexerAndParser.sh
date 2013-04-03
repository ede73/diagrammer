#!/bin/sh
echo Make lexer
jison-lex state.lex >/dev/null
cat >> state.js <<EOF
exports.state=state;
EOF

cat state.lex > state.all
cat >>state.all <<EOF
/lex
EOF
cat state.grammar >>state.all

echo make parser
jison state.all -o parser.js 

[[ "$?" -ne 0 ]] && exit 10

