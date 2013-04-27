old=.$$.old
new=.$$.new
FILE="state.lex state.grammar \
model/support.js model/model.js \
generators/seqdiag.js generators/mscgen.js generators/blockdiag.js generators/actdiag.js generators/digraph.js generators/nwdiag.js generators/plantuml_sequence.js generators/ast.js"

touch $FILE
stat -f"%N %m%b%z%v" $FILE>$old
while [ 1 ]; do
  stat -f"%N %m%b%z%v" $FILE>$new
  rb=0
  for c in `cat $new $old|sort|uniq -u|cut -d" " -f1`;do	
   rb=1
  done
  [[ $rb -eq 1 ]] &&  ./makeLexerAndParser.sh ; sleep 1
  cp $new $old
  rm -f $new
  sleep 1
done
