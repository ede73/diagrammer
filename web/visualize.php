<?php
#<!-- HTTP 1.1 -->
#<meta http-equiv="Cache-Control" content="no-store"/>
#<!-- HTTP 1.0 -->
#<meta http-equiv="Pragma" content="no-cache"/>
#<!-- Prevents caching at the Proxy Server -->
#<meta http-equiv="Expires" content="0"/>

header("Content-type: image/png");
$prefix = 'result';
$outputFileName=tempnam('.', $prefix);

function getExe($name)
{
  $paths = array("/usr/bin/", "/usr/local/bin/", "/opt/homebrew/bin/");
  foreach ($paths as $path) {
    $file = $path . $name;
    error_log("test $file");
    if (file_exists($file)) {
      return $file;
    }
  }
  error_log("File $file does not exist...");
  http_response_code(501);
  return "./" . $name;
}

$postText = trim(file_get_contents('php://input'));
if (FALSE === file_put_contents("./post.txt", $postText)) {
  error_log("Failed storing input to ./post.txt");
  http_response_code(500);
  return;
}

function visualize(string $executable, string $extra_param = "", string $extra_image_format = "-Tpng"): string
{
  global $outputFileName;
  return exec(getExe($executable) . " ${extra_image_format} ${extra_param} -o ${outputFileName} post.txt");
}

switch ($_REQUEST["visualizer"]) {
  case "mscgen":
    $r = visualize("mscgen");
    break;
  case "actdiag":
    $r = visualize("actdiag3", "-a");
    break;
  case "blockdiag":
    $r = visualize("blockdiag3", "-a");
    break;
  case "nwdiag":
    $r = visualize("nwdiag3", "-a");
    break;
  case "seqdiag":
    $r = visualize("seqdiag3", "-a");
    break;
  case "dot":
    $r = visualize("dot", "", "-Tpng:gd");
    break;
  case "twopi":
    $r = visualize("twopi");
    break;
  case "circo":
    $r = visualize("circo");
    break;
  case "fdp":
    $r = visualize("fdp");
    break;
  case "osage":
    $r = visualize("osage");
    break;
  case "sfdp":
    $r = visualize("sfdp");
    break;
  case "neato":
    $r = visualize("neato");
    break;
  case "plantuml_sequence":
    copy("./post.txt", "./result.txt");
    # Sweet! -darkmode
    # Sweet! -tsvg
    $r = exec("cat result.txt | ".getExe("java") . " -jar ../ext/plantuml.jar -darkmode -pipe > $outputFileName");
    break;
  default:
    $r = visualize("dot");
    break;
}

file_put_contents("./error.txt", $r);

$result=base64_encode(file_get_contents($outputFileName));
header('Content-Length: ' . strlen($result));
echo $result;
unlink($outputFileName);
exit;
