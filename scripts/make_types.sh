#!/bin/sh
# shellcheck disable=SC2012
ls types | sed -e 's/.png//g' -e 's/^x//g' | awk '{print "<li tooltip=\""$1"\" onclick=\"addLine(\""$1" nodeName\");\"><img height=\"30\" src=\"types/x"$1".png\"/></li>";}'
exit 0
#while read line
#do
#echo $line
#node=${line##* }
#type=${line%% *}
#cat <<EOF |dot -Tpng -o types/$type.png
#digraph {
#  compound=true;
#  rankdir=TD;
#  $node[style="$type"]
#}
#EOF
#done <types.txt

while read -r line; do
  node="${line%[*}"
  echo "types/$node.png"
  cat <<EOF | dot -Tpng -o "types/$node.png"
digraph {
  compound=true;
  rankdir=TD;
  $line
}
EOF
done <types2.txt
