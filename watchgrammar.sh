#!/bin/sh
old=.$$.old
new=.$$.new
GENERATORS=""
for f in generators/*js; do
  GENERATORS=$GENERATORS" "$f
done
MODELS=""
for f in model/*js; do
  MODELS=$MODELS" "$f
done

FILE="state.lex state.grammar \
$MODELS \
$GENERATORS"

touch "$FILE"
stat -f"%N %m%b%z%v" "$FILE" >"$old"
while true; do
  stat -f"%N %m%b%z%v" "$FILE" >"$new"
  rb=0
  for c in $(cat $new $old | sort | uniq -u | cut -d" " -f1); do
    echo "$c changed...fire runner"
    rb=1
  done
  [ $rb -eq 1 ] && {
    ./makeLexerAndParser.sh
    rc=$?
    if [ $rc -gt 1 ]; then
      echo "LEXER CREATION ERROR: $rc"
    else
      ./runtests.sh
    fi
  }
  cp "$new" "$old"
  rm -f "$new"
  sleep 2
done
