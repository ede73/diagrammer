test(){
 ./t.sh silent $1 $x
 png=${1%.*}_${x}.png
 if [ -f "$png" ]; then
   diff $png ref/$x/$png
   [ $? -ne 0 ] && echo "ERROR: at $1, image $png ref/$x/$png differ" >&2 && open -Fn $png ref/$x/$png && exit 1
 else
   echo "ERROR: Could not produce output $1 as $png is non existent" >&2
   ls -l $png
 fi
}
tests=${1:-dot actdiag blockdiag}

for test in $tests; do
echo TEst suite $test >&2
x=$test
test state.txt
test state2.txt
test state3.txt
test state4.txt
test state5.txt
test state6.txt
test state7.txt
test state8.txt
test state9.txt
test state10.txt
test state11.txt
test state12.txt
test state_cluster_edge.txt
test state_dual_node.txt
test state_innergroups.txt
done

x=nwdiag
test state13.txt
test state14.txt
test state15.txt
test state16.txt

x=mscgen
test state_sequence.txt

