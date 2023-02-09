#!/bin/sh
echo Make lexer
jison-lex grammar/diagrammer.lex -o build/state.js >/dev/null
cat >>build/state.js <<EOF
exports.state=state;
EOF

cat grammar/diagrammer.lex >build/state.all
# shellcheck disable=SC2129
echo /lex >>build/state.all
cat grammar/diagrammer.grammar >>build/state.all
cat model/*.js >>build/state.all
cat generators/*.js >>build/state.all

echo make parser
if ! jison build/state.all -o parser.js; then
    echo Generation error
    exit 10
fi
