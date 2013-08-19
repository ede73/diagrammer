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

while read line    
do
node=${line%[*}
echo $line
echo $node
cat <<EOF |dot -Tpng -o types/$node.png
digraph {
  compound=true;
  rankdir=TD;
  $line
}
EOF
done <types.txt
