./makeLexerAndParser.sh >/dev/null
test(){
 echo "Run test $1 using $x"
 ./t.sh skipparsermake silent $1 $x >/dev/null
 png=${1%.*}_${x}.png
 if [ -f "$png" ]; then
   if [ ! -f "ref/$x/$png" ]; then
    cp $png ref/$x/$png    
   fi
   diff $png ref/$x/$png
   [ $? -ne 0 ] && echo "ERROR: at $1, image $png ref/$x/$png differ" >&2 && open -Fn $png ref/$x/$png && exit 1
 else
   echo "ERROR: Could not produce output $1 as $png is non existent" >&2
   ls -l $png
   exit 10
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
[[ "$test" != "actdiag" ]] && [[ "$test" != "blockdiag" ]] && test state5.txt
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
test state_recursive_linking.txt
test state_images.txt
test fulltest.txt
test state_tcp.txt
test state_y_edge.txt
test state_conditionals.txt
done

x=nwdiag
test state13.txt
test state14.txt
test state15.txt
test state16.txt

tests=${1:-mscgen seqdiag plantuml_sequence}
for test in $tests; do
x=$test
  test state_sequence.txt
  test state_sequence2.txt
  test state_conditionals.txt
done

