#!/bin/sh
#./makeLexerAndParser.sh >/dev/null
if ! which node >/dev/null; then
  PATH=$PATH:/usr/local/bin
fi

. ./scripts/display_image.sh

#parallelism for 8 cores
PARALLEL=${2:-12}
verbose=1

rm -f .error

checkError() {
  if [ -f .error ]; then
    echo ERROR
    exit 10
  fi
}

setError() {
  touch .error
  echo "ERROR $1 in $2"
  checkError
}

test() {
  checkError
  [ $verbose -ne 0 ] && echo "    test($*) using $testbin"
  no_visual=''
  [ $webvisualizer -ne 0 ] && no_visual="dont_run_visualizer"
  ./scripts/t.sh skipparsermake silent tests $no_visual "tests/test_inputs/$1" "$testbin" >/dev/null
  rc=$?
  [ $rc -ne 0 ] && setError "$rc" "$1"
  out="${1%.*}_${testbin}.out"
  textoutput="tests/test_outputs/$out"
  textreference="tests/reference_images/$testbin/$out"
  if [ ! -f "$textoutput" ]; then
      echo "    ERROR: at $1, generator failed, missing $textoutput" >&2
      setError 11 "$1"
      return
  fi
  [ $webvisualizer -ne 0 ] && {
    # Web Visualizers cannot be (currently) ran in CLI
    # So only thing we could do is test the final output
    if ! diff "$textoutput" "$textreference"; then
      echo "    ERROR: at $1, $textoutput $textreference differ" >&2
      diff -u "$textoutput" "$textreference"
      setError 11 "$1"
    fi
    return
  }
  png="${1%.*}_${testbin}.png"
  renderoutput="tests/test_outputs/$png"
  renderreference="tests/reference_images/$testbin/$png"
  if [ -f "$renderoutput" ]; then
    [ ! -f "$renderreference" ] && cp "$renderoutput" "$renderreference"
    [ ! -f "$textoutput" ] && cp "tests/test_outputs/$out" "$textreference"
    if ! diff "$renderoutput" "$renderreference"; then
      echo "    ERROR: at $1, image $renderoutput $renderreference differ" >&2
      diff -u "$textoutput" "$textreference"
      display_image "$renderoutput" "$renderreference"
      setError 11 "$1"
    fi
  else
    echo "ERROR: Could not produce output $renderoutput" >&2
    ls -l "$renderoutput"
    setError 12 "$1"
  fi
}

i=0
runtest() {
  checkError
  i=$((i + 1))
  [ $verbose -ne 0 ] && echo "  runtest($*) #$i with testbin=$testbin"
  test "$*" &
  [ $((i % PARALLEL)) = 0 ] && wait
  checkError
  [ $verbose -ne 0 ] && echo "      test #$i ok"
}

webvisualizer=0
#EDE:New act dag is fucked..instead of Lane1 it prints out random number as lane title, groups work though
tests="${1:-dot }" #actdiag } #blockdiag}
for test in $tests; do
  echo "Test suite $test" >&2
  testbin=$test
  runtest ast.txt
  [ "$test" != "actdiag" ] && runtest state_nodelinktests.txt
  [ "$test" != "actdiag" ] && runtest url.txt
  [ "$test" != "actdiag" ] && runtest state.txt
  [ "$test" != "actdiag" ] && runtest state2.txt
  [ "$test" != "actdiag" ] && runtest state3.txt
  [ "$test" != "actdiag" ] && runtest state4.txt
  [ "$test" != "actdiag" ] && [ "$test" != "blockdiag" ] && runtest state5.txt
  [ "$test" != "actdiag" ] && runtest state6.txt
  [ "$test" != "actdiag" ] && runtest state7.txt
  [ "$test" != "actdiag" ] && runtest state8.txt
  [ "$test" != "actdiag" ] && runtest state9.txt
  [ "$test" != "actdiag" ] && runtest state10.txt
  [ "$test" != "actdiag" ] && runtest state11.txt
  [ "$test" != "actdiag" ] && runtest state12.txt
  [ "$test" != "actdiag" ] && runtest state_cluster_edge.txt
  [ "$test" != "actdiag" ] && runtest state_dual_node.txt
  [ "$test" != "actdiag" ] && runtest state_innergroups.txt
  [ "$test" != "actdiag" ] && runtest state_recursive_linking.txt
  [ "$test" != "actdiag" ] && runtest state_images.txt
  [ "$test" != "actdiag" ] && runtest fulltest.txt
  [ "$test" != "blockdiag" ] && runtest state_tcp.txt
  [ "$test" != "actdiag" ] && runtest state_y_edge.txt
  [ "$test" != "actdiag" ] && runtest state_conditionals.txt
  runtest state_group.txt
  [ "$test" != "actdiag" ] && runtest nodes.txt
  [ "$test" != "actdiag" ] && runtest events.txt
  [ "$test" != "actdiag" ] && runtest compass.txt
  runtest group_group_link.txt
done

testbin=nwdiag
runtest state13.txt
runtest state14.txt
runtest state15.txt
runtest state16.txt

tests=${1:-mscgen seqdiag plantuml_sequence}
for test in $tests; do
  testbin=$test
  runtest state_sequence.txt
  runtest state_sequence2.txt
  runtest state_conditionals.txt
  runtest events.txt
done

testbin=plantuml_sequence
runtest plantuml_context.txt
runtest plantuml_context2.txt

# Web visualizers, so test only generator
webvisualizer=1
for web_generators_only in $(grep -l 'WEB VISUALIZER ONLY' generators/*.js|tr . /|cut -d/ -f2); do
  testbin=$web_generators_only
  runtest ${web_generators_only}.txt
done
exit 0
