#./makeLexerAndParser.sh >/dev/null
#parallelism for 8 cores
which node>/dev/null
if [ $? -ne 0 ]; then
 PATH=$PATH:/usr/local/bin
fi

PARALLEL=${2:-8}
verbose=0

rm -f .error
error=0
checkError(){
  if [ -f .error ]; then
    echo ERROR
    exit 10
  fi
}
setError(){
  touch .error
  echo "ERROR $1 in $2"
  checkError
}
test(){
 checkError
 [[ $verbose -ne 0 ]] && echo "Run test $1 using $x"
 ./t.sh skipparsermake silent tests tests/$1 $x >/dev/null
 rc=$?
 [[ $rc -ne 0 ]] && setError $rc $1
 png=${1%.*}_${x}.png
 out=${1%.*}_${x}.out
 if [ -f "tests/$png" ]; then
   [ ! -f "ref/$x/$png" ] && cp tests/$png ref/$x/$png
   [ ! -f "ref/$x/$out" ] && cp tests/$out ref/$x/$out
   diff tests/$png ref/$x/$png
   [ $? -ne 0 ] && {
	echo "ERROR: at $1, image tests/$png ref/$x/$png differ" >&2 
        diff -u tests/$out ref/$x/$out
	open -Fn tests/$png ref/$x/$png
	setError 11 $1
    }
 else
   echo "ERROR: Could not produce output tests/$png" >&2
   ls -l tests/$png
   setError 12 $1
 fi
}

i=0
runtest(){
 checkError
 (( i++ ))
 [[ $verbose -ne 0 ]] && echo  Running test $i
 test $* &
 if (( $i % $PARALLEL == 0 )) ; then wait;fi
 checkError
 [[ $verbose -ne 0 ]] && echo test $i ok
}

#EDE:New act dag is fucked..instead of Lane1 it prints out random number as lane title, groups work though
tests=${1:-dot } #actdiag } #blockdiag}
for test in $tests; do
echo Test suite $test >&2
x=$test
runtest ast.txt
[[ "$test" != "actdiag" ]] && runtest url.txt
[[ "$test" != "actdiag" ]] && runtest state.txt
[[ "$test" != "actdiag" ]] && runtest state2.txt
[[ "$test" != "actdiag" ]] && runtest state3.txt
[[ "$test" != "actdiag" ]] && runtest state4.txt
[[ "$test" != "actdiag" ]] && [[ "$test" != "blockdiag" ]] && runtest state5.txt
[[ "$test" != "actdiag" ]] && runtest state6.txt
[[ "$test" != "actdiag" ]] && runtest state7.txt
[[ "$test" != "actdiag" ]] && runtest state8.txt
[[ "$test" != "actdiag" ]] && runtest state9.txt
[[ "$test" != "actdiag" ]] && runtest state10.txt
[[ "$test" != "actdiag" ]] && runtest state11.txt
[[ "$test" != "actdiag" ]] && runtest state12.txt
[[ "$test" != "actdiag" ]] && runtest state_cluster_edge.txt
[[ "$test" != "actdiag" ]] && runtest state_dual_node.txt
[[ "$test" != "actdiag" ]] && runtest state_innergroups.txt
[[ "$test" != "actdiag" ]] && runtest state_recursive_linking.txt
[[ "$test" != "actdiag" ]] && runtest state_images.txt
[[ "$test" != "actdiag" ]] && runtest fulltest.txt
[[ "$test" != "blockdiag" ]] && runtest state_tcp.txt
[[ "$test" != "actdiag" ]] && runtest state_y_edge.txt
[[ "$test" != "actdiag" ]] && runtest state_conditionals.txt
runtest state_group.txt
[[ "$test" != "actdiag" ]] && runtest nodes.txt
[[ "$test" != "actdiag" ]] && runtest events.txt
[[ "$test" != "actdiag" ]] && runtest compass.txt
runtest group_group_link.txt
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
  runtest events.txt
done

x=plantuml_sequence
runtest plantuml_context.txt
runtest plantuml_context2.txt

exit 0
