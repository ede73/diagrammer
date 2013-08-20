
while read line    
do
node=${line%-*}
echo arrows/$node.png
cat <<EOF |dot -Tpng -o arrows/$node.png
digraph {
  compound=true;
  rankdir=TD;
  $line
}
EOF
done <arrows2.txt

ls arrows|sed -e 's/.png//g' -e 's/^x//g'|awk '{print "<li tooltip=\""$1"\" onclick=\"addLine(\""$1" nodeName\");\"><img height=\"30\" src=\"types/x"$1".png\"/></li>";}'
