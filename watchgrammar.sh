old=.$$.old
new=.$$.new
FILE="state.lex state.grammar"

touch $FILE
stat -f"%N %m%b%z%v" $FILE>$old
while [ 1 ]; do
  stat -f"%N %m%b%z%v" $FILE>$new
  rb=0
  for c in `cat $new $old|sort|uniq -u|cut -d" " -f1`;do	
   rb=1
  done
  [[ $rb -eq 1 ]] &&  ./makeLexerAndParser.sh
  cp $new $old
  rm -f $new
  sleep 1
done