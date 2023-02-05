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

FILES="state.lex grammar/state.grammar \
$MODELS \
$GENERATORS"

# we want globbing
# shellcheck disable=SC2086
touch $FILES
# shellcheck disable=SC2086
# IIRC mac had -f
stat -c"%N %m%b%z%v" $FILES >"$old"
while true; do
  # shellcheck disable=SC2086
  stat -c"%N %m%b%z%v" $FILES >"$new"
  rb=0
  for c in $(cat "$new" "$old" | sort | uniq -u | cut -d" " -f1); do
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
