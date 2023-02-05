#!/bin/sh
OUT="export"
mkdir -p $OUT/generators

for m in js/parse.js build/parser.js build/state.js; do
  uglifyjs $m -o $OUT/$(basename $m) -c -m
  sed -i -e 's,build/state.js,state.js,g' -e 's,build/parser.js,parser.js,g' $OUT/$(basename $m) 
done

cp scripts/display_image.sh "$OUT"

#for m in generators/*js; do
#  uglifyjs $m -o $OUT/$m
#done

sed '/EXPORTREMOVE/{n;d;}' scripts/t.sh >$OUT/t.sh
sed -i -e 's,scripts/display_image,display_image,g' $OUT/t.sh
cp LICENSE.txt $OUT
