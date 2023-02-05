<?php
#<!-- HTTP 1.1 -->
#<meta http-equiv="Cache-Control" content="no-store"/>
#<!-- HTTP 1.0 -->
#<meta http-equiv="Pragma" content="no-cache"/>
#<!-- Prevents caching at the Proxy Server -->
#<meta http-equiv="Expires" content="0"/>

function getExe($name)
{
  $x = array("/usr/bin/", "/usr/local/bin/", "/opt/homebrew/bin/");
  foreach ($x as $path) {
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
//exec("");
//echo $postText;

//header("Content-Type: image/png");
//passthru("cat state_dot.png");
#brew install mscgen
switch ($_REQUEST["visualizer"]) {
  case "mscgen":
    $r = exec(getExe("mscgen") . " -Tpng -o result.png post.txt");
    break;
  case "actdiag":
    $r = exec(getExe("actdiag3") . " -Tpng -a -o result.png post.txt");
    break;
  case "blockdiag":
    $r = exec(getExe("blockdiag3") . " -Tpng -a -o result.png post.txt");
    break;
  case "nwdiag":
    $r = exec(getExe("nwdiag3") . " -Tpng -a -o result.png post.txt");
    break;
  case "seqdiag":
    $r = exec(getExe("seqdiag") . " -Tpng -a -o result.png post.txt");
    break;
  case "dot":
    $r = exec(getExe("dot") . " -Tpng:gd -o result.png post.txt");
    break;
  case "twopi":
    $r = exec(getExe("twopi") . " -Tpng -o result.png post.txt");
    break;
  case "circo":
    $r = exec(getExe("circo") . " -Tpng -o result.png post.txt");
    break;
  case "fdp":
    $r = exec(getExe("fdp") . " -Tpng -o result.png post.txt");
    break;
  case "sfdp":
    $r = exec(getExe("sfdp") . " -Tpng -o result.png post.txt");
    break;
  case "neato":
    $r = exec(getExe("neato") . " -Tpng -o result.png post.txt");
    break;
  case "plantuml_sequence":
    //cat josha.txt| java -jar ../ext/plantuml.jar -pipe> result.png
    copy("./post.txt", "./result.txt");
    $r = exec(getExe("java") . " -jar ../ext/plantuml.jar result.txt");
    break;
  default:
    $r = exec(getExe("dot") . " -Tpng -o result.png post.txt");
    break;
}
file_put_contents("./error.txt", $r);
echo "web/result.png";