#!/bin/sh
OUT="export"

for m in js/diagrammer.js build/diagrammer_parser.js build/lexer.js; do
  uglifyjs $m -o $OUT/$(basename $m) -c -m
  sed -i -e 's,build/lexer.js,lexer.js,g' -e 's,build/diagrammer_parser.js,diagrammer_parser.js,g' $OUT/$(basename $m) 
done

cp scripts/display_image.sh "$OUT"

#mkdir -p $OUT/generators
#for m in generators/*js; do
#  uglifyjs $m -o $OUT/$m
#done

sed '/EXPORTREMOVE/{n;d;}' scripts/t.sh >$OUT/t.sh
sed -i -e 's,scripts/display_image,display_image,g' $OUT/t.sh
cp LICENSE.txt $OUT
