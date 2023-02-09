#!/bin/sh
echo Make lexer
jison-lex grammar/diagrammer.lex -o build/lexer.js >/dev/null
cat >>build/lexer.js <<EOF
exports.lexer=lexer;
EOF

cat grammar/diagrammer.lex >build/diagrammer.all
# shellcheck disable=SC2129
echo /lex >>build/diagrammer.all
cat grammar/diagrammer.grammar >>build/diagrammer.all
cat model/*.js >>build/diagrammer.all
cat generators/*.js >>build/diagrammer.all

echo make diagrammer_parser
if ! jison build/diagrammer.all -o diagrammer_parser.js; then
    echo Generation error
    exit 10
fi
