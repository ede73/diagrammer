#!/bin/sh
echo Make lexer
jison-lex state.lex >/dev/null
cat >> state.js <<EOF
exports.state=state;
EOF

cat state.lex > state.all
# shellcheck disable=SC2129
echo /lex  >>state.all
cat state.grammar >>state.all
cat model/*.js >>state.all
cat generators/*.js >>state.all

echo make parser
if ! jison state.all -o parser.js; then
 echo Generation error
 exit 10
fi
