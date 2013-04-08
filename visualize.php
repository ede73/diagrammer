<?
//print_r($_SERVER);
$postText = trim(file_get_contents('php://input'));
file_put_contents("/Users/ede/jison/state/post.txt",$postText);
//exec("");
//echo $postText;

//header("Content-Type: image/png");
//passthru("cat state_dot.png");

switch($_REQUEST["generator"]){
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
  default:
    exec("/usr/local/bin/dot -Tpng -o result.png post.txt");
  break;
}
echo "result.png";
?>
