#!/bin/sh
#./makeLexerAndParser.sh >/dev/null
if ! which node >/dev/null; then
  PATH=$PATH:/usr/local/bin
fi

. ./scripts/display_image.sh

#parallelism for 8 cores
PARALLEL=${2:-12}
VERBOSE=1

rm -f .error

assertNoError() {
  if [ -f .error ]; then
    echo ERROR
    exit 10
  fi
}

setErrorAndExit() {
  ERROR_CODE="$1"
  ERROR_TEXT="$2"
  touch .error
  echo "ERROR $ERROR_CODE in $ERROR_TEXT"
  assertNoError
}

runATest() {
  TEST_FILENAME="$1"
  assertNoError
  [ $VERBOSE -ne 0 ] && echo "    test($*) using $TEST_BINARY"
  no_visual=''
  [ $WEB_VISUALIZER -ne 0 ] && no_visual="dont_run_visualizer"

  ./scripts/t.sh skipparsermake silent tests $no_visual "tests/test_inputs/$TEST_FILENAME" "$TEST_BINARY" >/dev/null
  RC=$?
  [ $RC -ne 0 ] && setErrorAndExit "$RC" "$TEST_FILENAME"

  out="${TEST_FILENAME%.*}_${TEST_BINARY}.out"
  GENERATED_CODE="tests/test_outputs/$out"
  GENERATED_CODE_REFERENCE="tests/reference_images/$TEST_BINARY/$out"
  if [ ! -f "$GENERATED_CODE" ]; then
    echo "    ERROR: at $TEST_FILENAME, generator failed, missing $GENERATED_CODE" >&2
    setErrorAndExit 20 "$TEST_FILENAME"
    return
  fi

  # Web Visualizers cannot be (currently) run in CLI
  # So only thing we could do is test the final output
  [ $WEB_VISUALIZER -eq 0 ] && {
    png="${TEST_FILENAME%.*}_${TEST_BINARY}.png"
    GENERATED_IMAGE="tests/test_outputs/$png"
    GENERATED_IMAGE_REFERENCE="tests/reference_images/$TEST_BINARY/$png"
    if [ -f "$GENERATED_IMAGE" ]; then
      [ ! -f "$GENERATED_IMAGE_REFERENCE" ] && cp "$GENERATED_IMAGE" "$GENERATED_IMAGE_REFERENCE"
      [ ! -f "$GENERATED_CODE" ] && cp "$GENERATED_CODE" "$GENERATED_CODE_REFERENCE"
      # Allow 1% variance
      THRESHOLD=1
      # Since jest-imagematcher brings pixelmatch, let's use it!
      GRAPH_DIFF=$(mktemp)
      if ! node_modules/pixelmatch/bin/pixelmatch "$GENERATED_IMAGE" "$GENERATED_IMAGE_REFERENCE" "$GRAPH_DIFF" $THRESHOLD >/dev/null; then
        echo "    ERROR: at $TEST_FILENAME, image $GENERATED_IMAGE $GENERATED_IMAGE_REFERENCE differ" >&2
        #display_image "$GENERATED_IMAGE" "$GENERATED_IMAGE_REFERENCE" "$GRAPH_DIFF"
        display_image "$GRAPH_DIFF"
        diff -u "$GENERATED_CODE" "$GENERATED_CODE_REFERENCE"
        setErrorAndExit 21 "$TEST_FILENAME"
      fi
      rm -f "$GRAPH_DIFF"
    else
      echo "ERROR: Failed visualizing $TEST_BINARY dit not produce output $GENERATED_IMAGE" >&2
      ls -l "$GENERATED_IMAGE"
      setErrorAndExit 22 "$TEST_FILENAME"
    fi
  }

  # Verify that the generated output matches what it used to
  if ! diff -q "$GENERATED_CODE" "$GENERATED_CODE_REFERENCE" >/dev/null; then
    ERROR=ERROR
    [ $WEB_VISUALIZER -eq 0 ] && {
      # if we ended up here, and not having a web visualizer, we've already compared output images
      # And they DO match, so this probably is a formatting change
      ERROR="Warning(output images match, so just formatting?)"
    }
    echo -n "\n$ERROR: at $TEST_FILENAME, $GENERATED_CODE $GENERATED_CODE_REFERENCE differ for $TEST_BINARY" >&2
    [ $WEB_VISUALIZER -eq 0 ] && {
      echo -n "\n\tcp $GENERATED_CODE $GENERATED_CODE_REFERENCE # as quick fix?\n" >&2
    }
    diff -u "$GENERATED_CODE_REFERENCE" "$GENERATED_CODE"
    echo "\t# You can run this test also with:"
    echo "\tnode js/diagrammer.js tests/test_inputs/$TEST_FILENAME $TEST_BINARY"
    setErrorAndExit 23 "$TEST_FILENAME"
  fi
}

i=0
launchTestInBackground() {
  assertNoError
  i=$((i + 1))
  [ $VERBOSE -ne 0 ] && echo "  launchTestInBackground($*) #$i with TEST_BINARY=$TEST_BINARY"
  runATest "$*" &
  [ $((i % PARALLEL)) = 0 ] && wait
  assertNoError
  [ $VERBOSE -ne 0 ] && echo "      runATest #$i ok"
}

WEB_VISUALIZER=0
tests="${1:-dot actdiag blockdiag}"
for TEST_BINARY in $tests; do
  echo "Test suite $TEST_BINARY" >&2
  launchTestInBackground ast.txt
  [ "$TEST_BINARY" != "actdiag" ] && [ "$TEST_BINARY" != "blockdiag" ] && {
    launchTestInBackground state_nodelinktests.txt
    launchTestInBackground url.txt
    launchTestInBackground state.txt
    launchTestInBackground node_and_edge_coloring.txt
    launchTestInBackground state_machine_with_start_node.txt
    launchTestInBackground two_linked_clusters.txt
    launchTestInBackground node_and_edge_coloring2.txt
    launchTestInBackground two_linked_clusters_with_invisible_node.txt
    launchTestInBackground multiple_lhs_lists.txt
    launchTestInBackground lhs_rhs_lists.txt
    launchTestInBackground two_filled_linked_vertices.txt
    launchTestInBackground landscape.txt
    launchTestInBackground state_cluster_edge.txt
    launchTestInBackground state_dual_node.txt
    launchTestInBackground state_innergroups.txt
    launchTestInBackground state_recursive_linking.txt
    launchTestInBackground state_images.txt
    launchTestInBackground fulltest.txt
    launchTestInBackground state_y_edge.txt
    launchTestInBackground state_conditionals.txt
    launchTestInBackground nodes.txt
    launchTestInBackground events.txt
    launchTestInBackground compass.txt
  }
  [ "$TEST_BINARY" != "actdiag" ] && [ "$TEST_BINARY" != "blockdiag" ] && launchTestInBackground record_style.txt
  [ "$TEST_BINARY" != "blockdiag" ] && launchTestInBackground state_tcp.txt
  launchTestInBackground state_group.txt
  launchTestInBackground group_group_link.txt
done

TEST_BINARY=nwdiag
launchTestInBackground nwdiag_multiple_ips.txt
launchTestInBackground nwdiag3.txt
launchTestInBackground nwdiag5.txt
launchTestInBackground nwdiag2.txt
launchTestInBackground nwdiag.txt

tests=${1:-mscgen seqdiag plantuml_sequence}
for TEST_BINARY in $tests; do
  launchTestInBackground state_sequence.txt
  launchTestInBackground state_sequence2.txt
  launchTestInBackground state_conditionals.txt
  launchTestInBackground events.txt
done

TEST_BINARY=plantuml_sequence
launchTestInBackground plantuml_context.txt
launchTestInBackground plantuml_context2.txt

# Web visualizers, so test only generator
WEB_VISUALIZER=1
for web_generators_only in $(grep -l 'WEB VISUALIZER ONLY' generators/*.js | tr . / | cut -d/ -f2); do
  TEST_BINARY=$web_generators_only
  launchTestInBackground ${web_generators_only}.txt
  [ "$TEST_BINARY" = "umlclass" ] && launchTestInBackground umlclass2.txt
done

TEST_BINARY=ast
launchTestInBackground ast.txt

TEST_BINARY=ast_record
launchTestInBackground ast.txt

TEST_BINARY=sankey
launchTestInBackground sankey.txt
launchTestInBackground sankey2.txt
exit 0
