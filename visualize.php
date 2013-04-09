<?
#<!-- HTTP 1.1 -->
#<meta http-equiv="Cache-Control" content="no-store"/>
#<!-- HTTP 1.0 -->
#<meta http-equiv="Pragma" content="no-cache"/>
#<!-- Prevents caching at the Proxy Server -->
#<meta http-equiv="Expires" content="0"/>

//print_r($_SERVER);
$postText = trim(file_get_contents('php://input'));
file_put_contents("/Users/ede/jison/state/post.txt",$postText);
//exec("");
//echo $postText;

//header("Content-Type: image/png");
//passthru("cat state_dot.png");

switch($_REQUEST["visualizer"]){
  case "mscgen":
    exec("/usr/local/bin/mscgen -Tpng -o result.png post.txt");
  break;
  case "actdiag":
    exec("/usr/local/bin/actdiag -Tpng -a -o result.png post.txt");
  break;
  case "blockdiag":
    exec("/usr/local/bin/blockdiag -Tpng -a -o result.png post.txt");
  break;
  case "nwdiag":
    exec("/usr/local/bin/nwdiag -Tpng -a -o result.png post.txt");
  break;
  case "seqdiag":
    exec("/usr/local/bin/seqdiag -Tpng -a -o result.png post.txt");
  break;
  case "dot":
    exec("/usr/local/bin/dot -Tpng -o result.png post.txt");
  break;
  case "twopi":
    exec("/usr/local/bin/twopi -Tpng -o result.png post.txt");
  break;
  case "circo":
    exec("/usr/local/bin/circo -Tpng -o result.png post.txt");
  break;
  case "fdp":
    exec("/usr/local/bin/fdp -Tpng -o result.png post.txt");
  break;
  case "sfdp":
    exec("/usr/local/bin/sfdp -Tpng -o result.png post.txt");
  break;
  case "neato":
    exec("/usr/local/bin/neato -Tpng -o result.png post.txt");
  break;
  default:
    exec("/usr/local/bin/dot -Tpng -o result.png post.txt");
  break;
}
echo "result.png";
?>
