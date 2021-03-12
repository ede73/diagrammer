<?
#<!-- HTTP 1.1 -->
#<meta http-equiv="Cache-Control" content="no-store"/>
#<!-- HTTP 1.0 -->
#<meta http-equiv="Pragma" content="no-cache"/>
#<!-- Prevents caching at the Proxy Server -->
#<meta http-equiv="Expires" content="0"/>

function getExe($name){
$PATH="/usr/bin/";
if (!file_exists($PATH.$name)){
  $PATH="/usr/local/bin/";
  if (!file_exists($PATH.$name)){
   http_response_code(501);
   return "./".$name;
  }
}
return $PATH.$name;
}
//print_r($_SERVER);
$postText = trim(file_get_contents('php://input'));
if (FALSE===file_put_contents("./post.txt",$postText)){
  http_response_code(500);
  return;
}
//exec("");
//echo $postText;

//header("Content-Type: image/png");
//passthru("cat state_dot.png");

switch($_REQUEST["visualizer"]){
  case "mscgen":
   $r=exec(getExe("mscgen")." -Tpng -o result.png post.txt");
  break;
  case "actdiag":
    $r=exec(getExe("actdiag")." -Tpng -a -o result.png post.txt");
  break;
  case "blockdiag":
    $r=exec(getExe("blockdiag")." -Tpng -a -o result.png post.txt");
  break;
  case "nwdiag":
    $r=exec(getExe("nwdiag")." -Tpng -a -o result.png post.txt");
  break;
  case "seqdiag":
    $r=exec(getExe("seqdiag")." -Tpng -a -o result.png post.txt");
  break;
  case "dot":
    $r=exec(getExe("dot")." -Tpng -o result.png post.txt");
  break;
  case "twopi":
    $r=exec(getExe("twopi")." -Tpng -o result.png post.txt");
  break;
  case "circo":
    $r=exec(getExe("circo")." -Tpng -o result.png post.txt");
  break;
  case "fdp":
    $r=exec(getExe("fdp")." -Tpng -o result.png post.txt");
  break;
  case "sfdp":
    $r=exec(getExe("sfdp")." -Tpng -o result.png post.txt");
  break;
  case "neato":
    $r=exec(getExe("neato")." -Tpng -o result.png post.txt");
  break;
  case "plantuml_sequence":
    //cat josha.txt| java -jar ../ext/plantuml.jar -pipe> result.png
    copy("./post.txt","./result.txt");
    $r=exec(getExe("java")." -jar ../ext/plantuml.jar result.txt");
  break;
  default:
    $r=exec(getExe("dot")." -Tpng -o result.png post.txt");
  break;
}
file_put_contents("./error.txt",$r);
echo "web/result.png";
?>
