OUT=export
mkdir -p $OUT/generators

for m in testStateLexer.js parse.js parser.js state.js; do
  uglifyjs $m -o $OUT/$m
done
for m in generators/*js; do
  uglifyjs $m -o $OUT/$m
done

sed '/EXPORTREMOVE/{n;d;}' t.sh >$OUT/t.sh
cp COPYRIGHT.txt $OUT