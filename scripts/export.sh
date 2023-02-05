#!/bin/sh
OUT="export"
mkdir -p $OUT/generators

for m in js/parse.js parser.js build/state.js; do
  uglifyjs $m -o $OUT/$m -c -m
done
#for m in generators/*js; do
#  uglifyjs $m -o $OUT/$m
#done

sed '/EXPORTREMOVE/{n;d;}' scripts/t.sh >$OUT/t.sh
cp COPYRIGHT.txt $OUT
