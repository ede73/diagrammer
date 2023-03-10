<?php
#<!-- HTTP 1.1 -->
#<meta http-equiv="Cache-Control" content="no-store"/>
#<!-- HTTP 1.0 -->
#<meta http-equiv="Pragma" content="no-cache"/>
#<!-- Prevents caching at the Proxy Server -->
#<meta http-equiv="Expires" content="0"/>

if (php_sapi_name() !== "cli") {
  header("Content-type: image/png");
}


function dumpOutputAndDie($output)
{
  if (php_sapi_name() === "cli") {
    echo substr($output, 0, 32);
    die();
  }
  $result = base64_encode($output);
  header('Content-Length: ' . strlen($result));
  echo $result;
  die();
}

function visualize($graph): string
{
  $descriptorspec = array(
    0 => array("pipe", "r"),
    // stdin is a pipe that the child will read from
    1 => array("pipe", "w"),
    // stdout is a pipe that the child will write to
    2 => array("pipe", "w") // stderr is a file to write to
  );

  // great! except icons in parent...
  //$cmddir = '/tmp';
  $cmddir = '../';
  $env = array();

  $visualizer = $_REQUEST["visualizer"];
  $executable = "./js/visualize.js traceprocess $visualizer";

  $useTempFile = false;
  error_log("run ($executable)");
  $process = proc_open($executable, $descriptorspec, $pipes, $cmddir, $env);

  if (is_resource($process)) {
    $i = getInput();
    $i = $i . "\n";
    error_log($i);
    fwrite($pipes[0], $i);
    fflush($pipes[0]);
    sleep(2);
    fclose($pipes[0]);

    $errors = stream_get_contents($pipes[2]);
    if ($errors) {
      error_log($errors);
    }

    if (!$useTempFile) {
      $image = stream_get_contents($pipes[1]);
      if (strlen($image) == 0) {
        $err = "ERROR : Failed to produce an image";
        error_log($err);
        //header("HTTP/1.1 500 $err");
        echo ($err);
        die(10);
      }
    }

    $return_value = proc_close($process);
    if ($return_value === 0) {
      if ($useTempFile) {
        $image = file_get_contents($useTempFile);
        unlink($useTempFile);
        $useTempFile = false;
      }
      dumpOutputAndDie($image);
    } else {
      error_log("Process returned error $return_value");
      error_log($errors);
    }
    die();
  }
  if ($useTempFile) {
    unlink($useTempFile);
  }
  header("HTTP/1.1 500 ERROR Process creation failed");
  error_log("Process creation failed");
  // failed...
  echo ("ERROR");
  die(1);
}

function getInput()
{
  if (php_sapi_name() === "cli") {
    return stream_get_contents(STDIN);
  } else {
    return trim(file_get_contents('php://input'));
  }
}

visualize(getInput());

die("Should not happen");