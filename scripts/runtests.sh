#!/bin/sh
#./makeLexerAndParser.sh >/dev/null
if ! which node >/dev/null; then
  PATH=$PATH:/usr/local/bin
fi

. ./scripts/display_image.sh

#parallelism for 8 cores
PARALLEL=${2:-12}
VERBOSE=0

rm -f .error

assertNoError() {
  if [ -f .error ]; then
    set -e
    exit 100
  fi
}

setErrorAndExit() {
  ERROR_CODE="$1"
  ERROR_TEXT="$2"
  GENERATOR="$3"
  RES="$4"
  touch .error
  echo "ERROR $ERROR_CODE in $ERROR_TEXT $GENERATOR $RES" | tee .error
  assertNoError
}

runATest() {
  useGenerator=$1
  shift
  webOnlyVisualizer=$1
  shift
  TEST_FILENAME="$1"
  assertNoError
  [ $VERBOSE -ne 0 ] && echo "    test($*) using $useGenerator"
  no_visual=''
  [ $webOnlyVisualizer -ne 0 ] && no_visual="dont_run_visualizer"

  mkdir -p tests/test_outputs
  res=$(./scripts/t.sh skipparsermake silent tests $no_visual "tests/test_inputs/$TEST_FILENAME" "$useGenerator")
  RC=$?
  [ $RC -ne 0 ] && setErrorAndExit "$RC" "$TEST_FILENAME" "$useGenerator" "$res"

  out="${TEST_FILENAME%.*}_${useGenerator}.out"
  GENERATED_CODE="tests/test_outputs/$out"
  GENERATED_CODE_REFERENCE="tests/reference_images/$useGenerator/$out"
  if [ ! -f "$GENERATED_CODE" ]; then
    echo "    ERROR: at $TEST_FILENAME, generator failed, missing $GENERATED_CODE" >&2
    setErrorAndExit 20 "$TEST_FILENAME"
    return
  fi

  # Web Visualizers cannot be (currently) run in CLI
  # So only thing we could do is test the final output
  [ $webOnlyVisualizer -eq 0 ] && {
    png="${TEST_FILENAME%.*}_${useGenerator}.png"
    GENERATED_IMAGE="tests/test_outputs/$png"
    GENERATED_IMAGE_REFERENCE="tests/reference_images/$useGenerator/$png"
    if [ -f "$GENERATED_IMAGE" ]; then
      [ ! -f "$GENERATED_IMAGE_REFERENCE" ] && cp "$GENERATED_IMAGE" "$GENERATED_IMAGE_REFERENCE"
      [ ! -f "$GENERATED_CODE_REFERENCE" ] && cp "$GENERATED_CODE" "$GENERATED_CODE_REFERENCE"
      # Allow 1% variance
      THRESHOLD=1
      # Since jest-imagematcher brings pixelmatch, let's use it!
      GRAPH_DIFF=$(mktemp --suffix "$png")
      if ! node_modules/pixelmatch/bin/pixelmatch "$GENERATED_IMAGE" "$GENERATED_IMAGE_REFERENCE" "$GRAPH_DIFF" "$THRESHOLD" >/dev/null; then
        echo "    ERROR: at $TEST_FILENAME, image $GENERATED_IMAGE $GENERATED_IMAGE_REFERENCE differ" >&2
        #display_image "$GENERATED_IMAGE" "$GENERATED_IMAGE_REFERENCE" "$GRAPH_DIFF"
        if [ -s "$GRAPH_DIFF" ]; then
          display_image $GRAPH_DIFF
        else
          echo "   Weird, pixelmatch failed, but did not produce diff to $GRAPH_DIFF"
        fi
        diff -u "$GENERATED_CODE_REFERENCE" "$GENERATED_CODE"
        setErrorAndExit 21 "$TEST_FILENAME"
      fi
      rm -f "$GRAPH_DIFF"
    else
      echo "ERROR: Failed visualizing $useGenerator did not produce output $GENERATED_IMAGE" >&2
      ls -l "$GENERATED_IMAGE"
      setErrorAndExit 22 "$TEST_FILENAME"
    fi
  }

  # Verify that the generated output matches what it used to
  [ ! -f "$GENERATED_CODE_REFERENCE" ] && cp "$GENERATED_CODE" "$GENERATED_CODE_REFERENCE"
  if ! diff -q "$GENERATED_CODE" "$GENERATED_CODE_REFERENCE" >/dev/null; then
    ERROR="Mismatch between $GENERATED_CODE $GENERATED_CODE_REFERENCE"
    [ $webOnlyVisualizer -eq 0 ] && {
      # if we ended up here, and not having a web visualizer, we've already compared output images
      # And they DO match, so this probably is a formatting change
      ERROR="Warning(output images match, so just formatting?)"
    }
    echo -n "\n$ERROR: at $TEST_FILENAME, $GENERATED_CODE $GENERATED_CODE_REFERENCE differ for $useGenerator" >&2
    [ $webOnlyVisualizer -eq 0 ] && {
      echo -n "\n\tcp $GENERATED_CODE $GENERATED_CODE_REFERENCE # as quick fix?\n" >&2
    }
    diff -u "$GENERATED_CODE_REFERENCE" "$GENERATED_CODE"
    echo "\t# You can run this test also with:"
    echo "\tnode js/diagrammer.js tests/test_inputs/$TEST_FILENAME $useGenerator; diff -q \"$GENERATED_CODE\" \"$GENERATED_CODE_REFERENCE\""
    setErrorAndExit 23 "$TEST_FILENAME"
  fi
  assertNoError
}

i=0
launchTestInBackground() {
  useGenerator=$1
  shift
  webOnlyVisualizer=$1
  shift
  assertNoError
  i=$((i + 1))
  [ $VERBOSE -ne 0 ] && echo "  launchTestInBackground $useGenerator $webOnlyVisualizer($*) #$i with useGenerator=$useGenerator"
  runATest $useGenerator $webOnlyVisualizer "$*" &
  [ $((i % PARALLEL)) = 0 ] && wait
  assertNoError
  [ $VERBOSE -ne 0 ] && echo "      runATest $useGenerator $webOnlyVisualizer #$i ok"
}

webOnlyVisualizer=0
tests="${1:-dot actdiag blockdiag}"
for useGenerator in $tests; do
  echo "Test suite $useGenerator" >&2
  launchTestInBackground $useGenerator $webOnlyVisualizer ast.txt
  [ "$useGenerator" != "actdiag" ] && [ "$useGenerator" != "blockdiag" ] && {
    launchTestInBackground $useGenerator $webOnlyVisualizer colors.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer arrow_types.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer flow_control.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer state_nodelinktests.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer url.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer state.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer node_and_edge_coloring.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer state_machine_with_start_node.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer two_linked_clusters.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer node_and_edge_coloring2.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer two_linked_clusters_with_invisible_node.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer multiple_lhs_lists.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer lhs_rhs_lists.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer two_filled_linked_vertices.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer landscape.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer state_cluster_edge.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer state_dual_node.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer state_innergroups.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer state_recursive_linking.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer state_images.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer fulltest.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer state_y_edge.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer state_conditionals.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer nodes.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer events.txt
    launchTestInBackground $useGenerator $webOnlyVisualizer compass.txt
  }
  [ "$useGenerator" != "actdiag" ] && [ "$useGenerator" != "blockdiag" ] && launchTestInBackground $useGenerator $webOnlyVisualizer record_style.txt
  [ "$useGenerator" != "blockdiag" ] && launchTestInBackground $useGenerator $webOnlyVisualizer state_tcp.txt
  launchTestInBackground $useGenerator $webOnlyVisualizer state_group.txt
  launchTestInBackground $useGenerator $webOnlyVisualizer group_group_link.txt
done

useGenerator=nwdiag
launchTestInBackground $useGenerator $webOnlyVisualizer nwdiag_multiple_ips.txt
launchTestInBackground $useGenerator $webOnlyVisualizer nwdiag3.txt
launchTestInBackground $useGenerator $webOnlyVisualizer nwdiag5.txt
launchTestInBackground $useGenerator $webOnlyVisualizer nwdiag2.txt
launchTestInBackground $useGenerator $webOnlyVisualizer nwdiag.txt

tests=${1:-mscgen seqdiag plantuml_sequence}
for useGenerator in $tests; do
  launchTestInBackground $useGenerator $webOnlyVisualizer state_sequence.txt
  launchTestInBackground $useGenerator $webOnlyVisualizer state_sequence2.txt
  launchTestInBackground $useGenerator $webOnlyVisualizer state_conditionals.txt
  launchTestInBackground $useGenerator $webOnlyVisualizer events.txt
done

useGenerator=plantuml_sequence
launchTestInBackground $useGenerator $webOnlyVisualizer plantuml_context.txt
launchTestInBackground $useGenerator $webOnlyVisualizer plantuml_context2.txt

# Web visualizers, so test only generator
webOnlyVisualizer=1
for web_generators_only in $(grep -l 'WEB VISUALIZER ONLY' generators/*.js | tr . / | cut -d/ -f2); do
  useGenerator=$web_generators_only
  launchTestInBackground $useGenerator $webOnlyVisualizer ${web_generators_only}.txt
  [ "$useGenerator" = "umlclass" ] && launchTestInBackground $useGenerator $webOnlyVisualizer umlclass2.txt
done

useGenerator=ast
launchTestInBackground $useGenerator $webOnlyVisualizer ast.txt

useGenerator=ast_record
launchTestInBackground $useGenerator $webOnlyVisualizer ast.txt

useGenerator=sankey
launchTestInBackground $useGenerator $webOnlyVisualizer sankey.txt
launchTestInBackground $useGenerator $webOnlyVisualizer sankey2.txt

exit 0
