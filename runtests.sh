#./makeLexerAndParser.sh >/dev/null
rm -f .error
error=0
checkError(){
  if [ -f .error ]; then
    exit 10
  fi
}
setError(){
  touch .error
  checkError
}
test(){
 checkError
 echo "Run test $1 using $x"
 ./t.sh skipparsermake silent $1 $x >/dev/null
 rc=$?
 [[ $rc -ne 0 ]] && setError $rc
 png=${1%.*}_${x}.png
 if [ -f "$png" ]; then
   if [ ! -f "ref/$x/$png" ]; then
    cp $png ref/$x/$png    
   fi
   diff $png ref/$x/$png
   [ $? -ne 0 ] && echo "ERROR: at $1, image $png ref/$x/$png differ" >&2 && open -Fn $png ref/$x/$png && setError 11
 else
   echo "ERROR: Could not produce output $1 as $png is non existent" >&2
   ls -l $png
   setError 12
 fi
}

i=0
#parallelism for 8 cores
runtest(){
 checkError
 (( i++ ))
 echo Running test $i
 test $* &
 if (( $i % 8 == 0 )) ; then wait;fi
 checkError
}
tests=${1:-dot actdiag blockdiag}
for test in $tests; do
echo TEst suite $test >&2
x=$test
runtest state.txt
runtest state2.txt
runtest state3.txt
runtest state4.txt
[[ "$test" != "actdiag" ]] && [[ "$test" != "blockdiag" ]] && runtest state5.txt
runtest state6.txt
runtest state7.txt
runtest state8.txt
runtest state9.txt
runtest state10.txt
runtest state11.txt
runtest state12.txt
runtest state_cluster_edge.txt
runtest state_dual_node.txt
runtest state_innergroups.txt
runtest state_recursive_linking.txt
runtest state_images.txt
runtest fulltest.txt
runtest state_tcp.txt
runtest state_y_edge.txt
runtest state_conditionals.txt
done

x=nwdiag
runtest state13.txt
runtest state14.txt
runtest state15.txt
runtest state16.txt

tests=${1:-mscgen seqdiag plantuml_sequence}
for test in $tests; do
  x=$test
  runtest state_sequence.txt
  runtest state_sequence2.txt
  runtest state_conditionals.txt
done
