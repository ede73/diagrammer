#!/bin/sh
OUT="export"

cat <<EOF
EXPORT IS CURRENTLY BROKEN

I wanted to enable modularity in the diagrammer. Alas node.js uses CommonJS and browser uses ECMA(ES). 
They are not at all compatible. Alas browser system cannot be changed, but LUCKILY Node.JS supports both styles.

So using plain old javascript imports now.

This makes export broken. Export previously produced ONE javascript file to parse everything.

And now it's broken, though command line works nice from the source folder, so who cares.

exit 10
for m in js/diagrammer.js build/diagrammer_parser.js build/diagrammer_lexer.js; do
  uglifyjs $m -o $OUT/$(basename $m) -c -m
  sed -i -e 's,build/diagrammer_lexer.js,diagrammer_lexer.js,g' -e 's,build/diagrammer_parser.js,diagrammer_parser.js,g' $OUT/$(basename $m) 
done

cp scripts/display_image.sh "$OUT"

#mkdir -p $OUT/generators
#for m in generators/*js; do
#  uglifyjs $m -o $OUT/$m
#done

sed '/EXPORTREMOVE/{n;d;}' scripts/t.js >$OUT/t.js
sed -i -e 's,scripts/display_image,display_image,g' $OUT/t.js
cp LICENSE.txt $OUT
