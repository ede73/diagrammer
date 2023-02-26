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

function getExe($name)
{
  $paths = array("/usr/bin/", "/usr/local/bin/", "/opt/homebrew/bin/");
  foreach ($paths as $path) {
    $file = $path . $name;
    if (file_exists($file)) {
      return $file;
    }
  }
  error_log("File $file does not exist...");
  http_response_code(501);
  return "./" . $name;
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

function visualize(string $executable, array $extra_param = []): string
{
  $descriptorspec = array(
    0 => array("pipe", "r"),
    // stdin is a pipe that the child will read from
    1 => array("pipe", "w"),
    // stdout is a pipe that the child will write to
    2 => array("pipe", "w") // stderr is a file to write to
  );

  $cmddir = '/tmp';
  $env = array();

  $executable = getExe($executable) . " " . implode(' ', $extra_param);

  $temp_file = false;
  if (strstr($executable, 'TEMP_FILE_REQUIRED')) {
    $prefix = 'result';
    $temp_file = tempnam('/tmp', $prefix);
    $executable = str_replace('TEMP_FILE_REQUIRED', $temp_file, $executable);
    error_log("# Badly designed command, cannot pipe, requires seekable output file");
  }
  error_log("Got : $executable");

  $process = proc_open($executable, $descriptorspec, $pipes, $cmddir, $env);

  if (is_resource($process)) {
    fwrite($pipes[0], getInput());
    fclose($pipes[0]);

    if (!$temp_file) {
      $image = stream_get_contents($pipes[1]);
    }

    $errors = stream_get_contents($pipes[2]);
    $return_value = proc_close($process);
    if ($return_value === 0) {
      if ($temp_file) {
        $image = file_get_contents($temp_file);
        unlink($temp_file);
      }
      dumpOutputAndDie($image);
    } else {
      error_log("Process returned error $return_value");
      error_log($errors);
    }
    die();
  }
  if ($temp_file) {
    unlink($temp_file);
  }
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

function getGenerator($argv)
{
  if (php_sapi_name() === "cli") {
    return $argv[1];
  } else {
    return $_REQUEST["visualizer"];
  }
}

switch (getGenerator($argv)) {
  case "mscgen":
    visualize("mscgen", ["-i-", "-o-"]); // piped
    break;
  case "actdiag":
    visualize("actdiag3", ["-a", "-Tpng", "-o TEMP_FILE_REQUIRED", "-"]);
    break;
  case "blockdiag":
    visualize("blockdiag3", ["-a", "-Tpng", "-o TEMP_FILE_REQUIRED", "-"]);
    break;
  case "nwdiag":
    visualize("nwdiag3", ["-a", "-Tpng", "-o TEMP_FILE_REQUIRED", "-"]);
    break;
  case "seqdiag":
    visualize("seqdiag3", ["-a", "-Tpng", "-o TEMP_FILE_REQUIRED", "-"]);
    break;
  case "dot":
    visualize("dot", ["-Tpng:gd"]); // piped
    break;
  case "twopi":
    visualize("twopi", ["-Tpng:gd"]); // piped
    break;
  case "circo":
    visualize("circo", ["-Tpng:gd"]); // piped
    break;
  case "fdp":
    visualize("fdp", ["-Tpng:gd"]); // piped
    break;
  case "osage":
    visualize("osage", ["-Tpng:gd"]); // piped
    break;
  case "sfdp":
    visualize("sfdp", ["-Tpng:gd"]); // piped
    break;
  case "neato":
    visualize("neato", ["-Tpng:gd"]); // piped
    break;
  case "plantuml_sequence":
    # Sweet! -darkmode
    # Sweet! -tsvg
    $jarpath = getcwd();
    // web page runs in /web/ , CLI one dir up
    if (php_sapi_name() !== "cli") {
      $jarpath .= "/..";
    }
    $jarpath .= "/ext/plantuml.jar";
    visualize("java", ["-jar", $jarpath, "-darkmode", "-pipe", "-o-"]); // piped
    break;
  default:
    visualize("dot", ["-Tpng:gd"]); // piped
    break;
}

die("Should not happen");